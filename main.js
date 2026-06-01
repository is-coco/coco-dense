const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

let loginWindow = null;
let vaultWindow = null;
let vaultCache = null;
let activeMasterPassword = "";
let unlockFailures = 0;
let unlockLockedUntil = 0;

const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const PBKDF2_ROUNDS = 250000;
const FAILED_ATTEMPTS_LIMIT = 5;
const FAILED_ATTEMPT_LOCK_MS = 30000;
const BACKUP_LIMIT = 10;
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

function getAppIconPath() {
  return path.join(__dirname, "assets", "app-icon.png");
}

function deriveKey(masterPassword, saltBase64) {
  return crypto.pbkdf2Sync(
    String(masterPassword ?? ""),
    Buffer.from(saltBase64, "base64"),
    PBKDF2_ROUNDS,
    KEY_LENGTH,
    "sha256",
  );
}

function encryptJson(masterPassword, payload) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(String(masterPassword ?? ""), salt, PBKDF2_ROUNDS, KEY_LENGTH, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: 1,
    kdf: "pbkdf2",
    rounds: PBKDF2_ROUNDS,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function decryptJson(masterPassword, vault) {
  const key = deriveKey(masterPassword, vault.salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(vault.iv, "base64"));
  decipher.setAuthTag(Buffer.from(vault.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(vault.data, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

function encryptText(secret, text) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(String(secret ?? ""), salt, PBKDF2_ROUNDS, KEY_LENGTH, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text ?? ""), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: 1,
    kdf: "pbkdf2",
    rounds: PBKDF2_ROUNDS,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function decryptText(secret, wrapped) {
  const key = deriveKey(secret, wrapped.salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(wrapped.iv, "base64"));
  decipher.setAuthTag(Buffer.from(wrapped.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(wrapped.data, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function defaultVault() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entries: [],
  };
}

function loadVaultFile() {
  const filePath = getVaultFilePath();
  if (!fs.existsSync(filePath)) {
    return { exists: false, corrupted: false, data: null };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!raw || typeof raw !== "object") {
      return { exists: true, corrupted: true, data: null };
    }
    return { exists: true, corrupted: false, data: raw };
  } catch {
    return { exists: true, corrupted: true, data: null };
  }
}

function saveVaultFile(content) {
  const filePath = getVaultFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
}

function getVaultFilePath() {
  return path.join(app.getPath("userData"), "vault.json");
}

function getRecoveryFilePath() {
  return path.join(app.getPath("userData"), "recovery.json");
}

function normalizeRecoveryAnswer(answer) {
  return String(answer ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildRecoverySecret(answers = []) {
  return answers.map(normalizeRecoveryAnswer).join("|");
}

function loadRecoveryFile() {
  const filePath = getRecoveryFilePath();
  if (!fs.existsSync(filePath)) {
    return { exists: false, corrupted: false, data: null };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const questions = Array.isArray(raw?.questions) ? raw.questions : [];
    if (questions.length !== 1 || !raw?.wrapped) {
      return { exists: true, corrupted: true, data: null };
    }
    return { exists: true, corrupted: false, data: raw };
  } catch {
    return { exists: true, corrupted: true, data: null };
  }
}

function recoveryStatus() {
  const recovery = loadRecoveryFile();
  return {
    configured: recovery.exists && !recovery.corrupted,
    corrupted: recovery.corrupted,
    questions: recovery.exists && !recovery.corrupted ? recovery.data.questions : [],
    updatedAt: recovery.exists && !recovery.corrupted ? recovery.data.updatedAt : "",
  };
}

function saveRecoveryFile(content) {
  const filePath = getRecoveryFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
}

function deleteRecoveryFile() {
  const filePath = getRecoveryFilePath();
  if (!fs.existsSync(filePath)) return;
  fs.unlinkSync(filePath);
}

function getBackupDirPath() {
  return path.join(app.getPath("userData"), "backups");
}

function trimBackups() {
  const backupDir = getBackupDirPath();
  if (!fs.existsSync(backupDir)) return;
  const files = fs
    .readdirSync(backupDir)
    .map((name) => {
      const fullPath = path.join(backupDir, name);
      const stat = fs.statSync(fullPath);
      return { fullPath, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  files.slice(BACKUP_LIMIT).forEach((file) => {
    try {
      fs.unlinkSync(file.fullPath);
    } catch {
      // ignore cleanup errors
    }
  });
}

function createVaultBackup(reason = "manual") {
  const filePath = getVaultFilePath();
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: "当前没有可备份的保险箱" };
  }

  const backupDir = getBackupDirPath();
  fs.mkdirSync(backupDir, { recursive: true });
  const safeReason = String(reason ?? "backup").replace(/[^a-zA-Z0-9-]+/g, "-").slice(0, 24) || "backup";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `vault-${stamp}-${safeReason}.json`);
  fs.copyFileSync(filePath, backupPath);
  trimBackups();
  return { ok: true, filePath: backupPath };
}

function validateExternalUrl(targetUrl) {
  try {
    const parsed = new URL(String(targetUrl ?? "").trim());
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      return { ok: false, error: "只允许打开 http 或 https 链接" };
    }
    return { ok: true, href: parsed.href };
  } catch {
    return { ok: false, error: "网址格式无效" };
  }
}

function resetUnlockFailures() {
  unlockFailures = 0;
  unlockLockedUntil = 0;
}

function consumeUnlockFailure() {
  unlockFailures += 1;
  if (unlockFailures >= FAILED_ATTEMPTS_LIMIT) {
    unlockLockedUntil = Date.now() + FAILED_ATTEMPT_LOCK_MS;
    unlockFailures = 0;
  }
}

function broadcastStatus() {
  const vaultState = loadVaultFile();
  const status = {
    hasVault: vaultState.exists,
    corrupted: vaultState.corrupted,
    lockedUntil: unlockLockedUntil,
  };

  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.webContents.send("app:status", status);
  }
  if (vaultWindow && !vaultWindow.isDestroyed()) {
    vaultWindow.webContents.send("app:status", status);
  }
  return status;
}

function createBaseWindow(options) {
  return new BrowserWindow({
    title: "Coco Dense",
    icon: getAppIconPath(),
    frame: false,
    titleBarStyle: "hidden",
    thickFrame: true,
    roundedCorners: true,
    backgroundColor: "#fbfcfe",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    ...options,
  });
}

function wireWindowControls() {
  ipcMain.handle("window:minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle("window:toggleMaximize", (event) => {
    const target = BrowserWindow.fromWebContents(event.sender);
    if (!target) return;
    if (target.isMaximized()) {
      target.unmaximize();
    } else {
      target.maximize();
    }
  });

  ipcMain.handle("window:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle("window:showVault", () => {
    if (vaultWindow && !vaultWindow.isDestroyed()) {
      vaultWindow.webContents.send("app:showVault", {
        vault: vaultCache ?? defaultVault(),
        masterPassword: activeMasterPassword,
      });
      vaultWindow.webContents.send("app:status", {
        hasVault: loadVaultFile().exists,
        corrupted: loadVaultFile().corrupted,
        lockedUntil: unlockLockedUntil,
      });
      vaultWindow.showInactive();
      vaultWindow.focus();
    }

    if (loginWindow && !loginWindow.isDestroyed()) {
      loginWindow.webContents.send("app:clearAuth");
      loginWindow.hide();
    }
  });

  ipcMain.handle("window:lockVault", () => {
    vaultCache = null;
    activeMasterPassword = "";

    if (loginWindow && !loginWindow.isDestroyed()) {
      loginWindow.webContents.send("app:clearAuth");
    }
    if (vaultWindow && !vaultWindow.isDestroyed()) {
      vaultWindow.webContents.send("app:clearAuth");
    }
    if (loginWindow && !loginWindow.isDestroyed()) {
      loginWindow.show();
      loginWindow.focus();
    }
    if (vaultWindow && !vaultWindow.isDestroyed()) {
      vaultWindow.hide();
    }

    broadcastStatus();
  });

  ipcMain.handle("vault:getStatus", () => {
    const vault = loadVaultFile();
    return {
      hasVault: vault.exists,
      corrupted: vault.corrupted,
      lockedUntil: unlockLockedUntil,
    };
  });

  ipcMain.handle("vault:getRecoveryStatus", () => recoveryStatus());
  ipcMain.handle("vault:getCurrent", () => vaultCache ?? loadVaultFile().data);

  ipcMain.handle("vault:unlock", (_event, masterPassword) => {
    const vaultState = loadVaultFile();
    if (vaultState.corrupted) {
      return { ok: false, error: "保险箱文件已损坏，请先导入备份或修复文件" };
    }
    if (unlockLockedUntil && Date.now() < unlockLockedUntil) {
      const remaining = Math.max(1, Math.ceil((unlockLockedUntil - Date.now()) / 1000));
      return { ok: false, error: `错误次数过多，请 ${remaining} 秒后再试`, retryAfter: remaining };
    }
    if (!vaultState.exists) {
      const payload = defaultVault();
      const wrapped = encryptJson(masterPassword, payload);
      saveVaultFile(wrapped);
      deleteRecoveryFile();
      vaultCache = payload;
      activeMasterPassword = String(masterPassword ?? "");
      resetUnlockFailures();
      broadcastStatus();
      return { ok: true, needsSetup: true, vault: vaultCache };
    }

    try {
      const payload = decryptJson(masterPassword, vaultState.data);
      vaultCache = payload;
      activeMasterPassword = String(masterPassword ?? "");
      resetUnlockFailures();
      broadcastStatus();
      return { ok: true, needsSetup: false, vault: payload };
    } catch {
      consumeUnlockFailure();
      if (unlockLockedUntil && Date.now() < unlockLockedUntil) {
        const remaining = Math.max(1, Math.ceil((unlockLockedUntil - Date.now()) / 1000));
        return { ok: false, error: `错误次数过多，请 ${remaining} 秒后再试`, retryAfter: remaining };
      }
      return { ok: false, error: "密码错误" };
    }
  });

  ipcMain.handle("vault:save", (_event, masterPassword, payload) => {
    const wrapped = encryptJson(masterPassword, payload);
    saveVaultFile(wrapped);
    vaultCache = payload;
    broadcastStatus();
    return { ok: true };
  });

  ipcMain.handle("vault:createBackup", (_event, reason) => {
    try {
      return createVaultBackup(reason);
    } catch {
      return { ok: false, error: "创建备份失败" };
    }
  });

  ipcMain.handle("vault:changePassword", (_event, currentPassword, nextPassword) => {
    const vaultState = loadVaultFile();
    if (vaultState.corrupted) {
      return { ok: false, error: "保险箱文件已损坏，请先导入备份或修复文件" };
    }
    if (!vaultState.exists) {
      return { ok: false, error: "本地还没有可修改的保险箱" };
    }
    if (!String(nextPassword ?? "").trim()) {
      return { ok: false, error: "新主密码不能为空" };
    }

    try {
      const payload = decryptJson(currentPassword, vaultState.data);
      const nextPayload = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      const wrapped = encryptJson(nextPassword, nextPayload);
      saveVaultFile(wrapped);
      deleteRecoveryFile();
      vaultCache = nextPayload;
      activeMasterPassword = String(nextPassword ?? "");
      resetUnlockFailures();
      broadcastStatus();
      return { ok: true, vault: nextPayload, recoveryReset: true };
    } catch {
      consumeUnlockFailure();
      return { ok: false, error: "当前主密码不正确" };
    }
  });

  ipcMain.handle("vault:setupRecovery", (_event, masterPassword, questions, answers) => {
    const questionList = Array.isArray(questions) ? questions.map((item) => String(item ?? "").trim()) : [];
    const answerList = Array.isArray(answers) ? answers.map((item) => String(item ?? "")) : [];
    if (questionList.length !== 1 || questionList.some((item) => !item)) {
      return { ok: false, error: "请先选择一个安全问题" };
    }
    if (answerList.length !== 1 || answerList.some((item) => !normalizeRecoveryAnswer(item))) {
      return { ok: false, error: "请填写答案" };
    }
    if (!String(masterPassword ?? "").trim()) {
      return { ok: false, error: "请先解锁保险箱" };
    }

    const vaultState = loadVaultFile();
    if (!vaultState.exists || vaultState.corrupted) {
      return { ok: false, error: "当前保险箱不可用，无法设置找回" };
    }

    try {
      decryptJson(masterPassword, vaultState.data);
      const now = new Date().toISOString();
      saveRecoveryFile({
        version: 1,
        questions: questionList,
        wrapped: encryptText(buildRecoverySecret(answerList), String(masterPassword ?? "")),
        updatedAt: now,
      });
      broadcastStatus();
      return { ok: true, status: recoveryStatus() };
    } catch {
      return { ok: false, error: "主密码校验失败，无法保存安全问题" };
    }
  });

  ipcMain.handle("vault:recoverWithAnswers", (_event, answers) => {
    const recovery = loadRecoveryFile();
    if (!recovery.exists) {
      return { ok: false, unavailable: true, error: "还没有设置安全问题" };
    }
    if (recovery.corrupted) {
      return { ok: false, error: "安全问题恢复文件已损坏" };
    }

    const answerList = Array.isArray(answers) ? answers.map((item) => String(item ?? "")) : [];
    if (answerList.length !== 1 || answerList.some((item) => !normalizeRecoveryAnswer(item))) {
      return { ok: false, error: "请填写答案" };
    }

    try {
      const recoveredPassword = decryptText(buildRecoverySecret(answerList), recovery.data.wrapped);
      const vaultState = loadVaultFile();
      if (!vaultState.exists || vaultState.corrupted) {
        return { ok: false, error: "当前保险箱不可用，无法解锁" };
      }

      const payload = decryptJson(recoveredPassword, vaultState.data);
      vaultCache = payload;
      activeMasterPassword = recoveredPassword;
      resetUnlockFailures();
      broadcastStatus();
      return {
        ok: true,
        vault: payload,
        masterPassword: recoveredPassword,
      };
    } catch {
      consumeUnlockFailure();
      return { ok: false, error: "安全问题答案不正确" };
    }
  });

  ipcMain.handle("vault:export", (_event, masterPassword, payload) => {
    return encryptJson(masterPassword, payload);
  });

  ipcMain.handle("vault:import", (_event, masterPassword, wrapped) => {
    try {
      const payload = decryptJson(masterPassword, wrapped);
      saveVaultFile(wrapped);
      deleteRecoveryFile();
      vaultCache = payload;
      activeMasterPassword = String(masterPassword ?? "");
      resetUnlockFailures();
      broadcastStatus();
      return { ok: true, vault: payload };
    } catch {
      return { ok: false, error: "导入失败" };
    }
  });

  ipcMain.handle("vault:getCached", () => vaultCache ?? defaultVault());

  ipcMain.handle("vault:exportFile", async (_event, masterPassword, payload) => {
    const result = await dialog.showSaveDialog({
      title: "导出 Coco Dense Vault",
      defaultPath: path.join(app.getPath("downloads"), "Coco Dense-vault.json"),
      filters: [{ name: "Vault File", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }

    const wrapped = encryptJson(masterPassword, payload);
    fs.writeFileSync(result.filePath, JSON.stringify(wrapped, null, 2), "utf8");
    return { ok: true, filePath: result.filePath };
  });

  ipcMain.handle("vault:importFile", async (_event, masterPassword) => {
    const result = await dialog.showOpenDialog({
      title: "导入 Coco Dense Vault",
      properties: ["openFile"],
      filters: [{ name: "Vault File", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePaths.length) {
      return { ok: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    try {
      const wrapped = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const payload = decryptJson(masterPassword, wrapped);

      let backupPath = "";
      if (fs.existsSync(getVaultFilePath())) {
        const backupResult = createVaultBackup("before-import");
        if (!backupResult.ok) {
          return { ok: false, error: "自动备份失败，已取消导入" };
        }
        backupPath = backupResult.filePath;
      }

      saveVaultFile(wrapped);
      deleteRecoveryFile();
      vaultCache = payload;
      activeMasterPassword = String(masterPassword ?? "");
      resetUnlockFailures();
      broadcastStatus();
      return { ok: true, vault: payload, filePath, backupPath };
    } catch {
      return { ok: false, error: "导入失败，文件格式或密码不正确" };
    }
  });

  ipcMain.handle("shell:openExternal", (_event, targetUrl) => {
    if (!targetUrl) return { ok: false, error: "地址为空" };

    const validated = validateExternalUrl(targetUrl);
    if (!validated.ok) return validated;

    try {
      shell.openExternal(validated.href);
      return { ok: true };
    } catch {
      return { ok: false, error: "无法打开网址" };
    }
  });
}

function createLoginWindow() {
  loginWindow = createBaseWindow({
    width: 560,
    height: 360,
    minWidth: 560,
    minHeight: 360,
    show: false,
    resizable: false,
    maximizable: false,
    minimizable: true,
  });

  loginWindow.loadFile("index.html");
  loginWindow.once("ready-to-show", () => loginWindow.show());
  loginWindow.webContents.once("did-finish-load", () => {
    broadcastStatus();
  });
  loginWindow.on("closed", () => {
    loginWindow = null;
  });
}

function createVaultWindow() {
  vaultWindow = createBaseWindow({
    width: 1320,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    resizable: true,
    maximizable: true,
    minimizable: true,
  });

  vaultWindow.loadFile("index.html");
  vaultWindow.webContents.once("did-finish-load", () => {
    vaultWindow.webContents.send("app:showVault", {
      vault: vaultCache ?? defaultVault(),
      masterPassword: activeMasterPassword,
    });
    vaultWindow.webContents.send("app:status", {
      hasVault: loadVaultFile().exists,
      corrupted: loadVaultFile().corrupted,
      lockedUntil: unlockLockedUntil,
    });
  });
  vaultWindow.on("closed", () => {
    vaultWindow = null;
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.coco.cocodense");
  }

  wireWindowControls();
  createVaultWindow();
  createLoginWindow();

  app.on("activate", () => {
    if (!loginWindow && !vaultWindow) {
      createVaultWindow();
      createLoginWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
