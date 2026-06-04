const { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, shell, systemPreferences } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Readable, Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");

const {
  IV_LENGTH, KEY_LENGTH, SALT_LENGTH, PBKDF2_ROUNDS,
  VAULT_FORMAT_V2, VAULT_FORMAT_V3,
  isEnvelopeVault, isDataKeyVault, makeUnlockError,
  encryptJson: _encryptJson,
  decryptVault: _decryptVault,
  decryptJson: _decryptJson,
  encryptText, decryptText,
  encryptBufferWithPassword, decryptBufferWithPassword,
  encryptWithVaultKey, decryptWithVaultKey,
  deriveKey, encryptLegacyJson, decryptLegacyJson,
  verifyDataKeyVaultMaster, generateDataKeySecret,
} = require("./src/main/crypto");

const updater = require("./src/main/updater");
const updaterState = require("./src/main/updater-state");
const recoveryModule = require("./src/main/recovery");
const syncModule = require("./src/main/sync");
const biometricModule = require("./src/main/biometric");
const datakeyModule = require("./src/main/datakey");

let loginWindow = null;
let vaultWindow = null;
let vaultCache = null;
let activeMasterPassword = "";
let activeDataKey = "";
let unlockFailures = 0;
let unlockLockedUntil = 0;
let isQuitting = false;

const FAILED_ATTEMPTS_LIMIT = 5;
const RECOVERY_ANSWER_MIN_LENGTH = 2;
const FAILED_ATTEMPT_LOCK_MS = 30000;
const BACKUP_LIMIT = 10;
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);
const isMac = process.platform === "darwin";
const REMOTE_WRITE_VERIFY_ATTEMPTS = 6;
const REMOTE_WRITE_VERIFY_DELAY_MS = 700;
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/is-coco/coco-dense/releases/latest";
const GITHUB_DOWNLOAD_MIRRORS = [
  "https://ghfast.top/",
  "https://ghproxy.cn/",
];
const gotSingleInstanceLock = app.requestSingleInstanceLock();
let currentDownloadController = null;
let currentDownloadFilePath = null;
let downloadCancelledByUser = false;

if (!gotSingleInstanceLock) {
  app.quit();
}

function getAppIconPath() {
  return path.join(__dirname, "assets", "app-icon.png");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stableStringify(value) {
  return syncModule.stableStringify(value);
}


function stableJsonHash(value) {
  return syncModule.stableJsonHash(value);
}


// Crypto functions imported from src/main/crypto.js
// Thin wrappers to inject activeDataKey as default for vault decryption
function encryptJson(masterPassword, payload, options = {}) {
  return _encryptJson(masterPassword, payload, options);
}

function decryptVault(masterPassword, vault, options = {}) {
  const merged = { dataKey: activeDataKey, ...options };
  return _decryptVault(masterPassword, vault, merged);
}

function decryptJson(masterPassword, vault, options = {}) {
  return decryptVault(masterPassword, vault, options).payload;
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
  return recoveryModule.getRecoveryFilePath();
}


function getSyncConfigFilePath() {
  return path.join(app.getPath("userData"), "sync.json");
}


function getBiometricFilePath() {
  return biometricModule.getBiometricFilePath(app);
}


function getFolderUiFilePath() {
  return path.join(app.getPath("userData"), "folder-ui.json");
}

function loadFolderUiFile() {
  try {
    const filePath = getFolderUiFilePath();
    if (!fs.existsSync(filePath)) return {};
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!raw || typeof raw !== "object") return {};
    const next = {};
    Object.entries(raw).forEach(([folderId, value]) => {
      if (folderId) next[folderId] = { collapsed: Boolean(value?.collapsed) };
    });
    return next;
  } catch {
    return {};
  }
}

function saveFolderUiFile(folderUi) {
  try {
    const filePath = getFolderUiFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(folderUi || {}, null, 2), "utf8");
  } catch { /* ignore */ }
}

function getUpdateProxyFilePath() {
  return path.join(app.getPath("userData"), "update-proxy.json");
}


function loadUpdateProxy() {
  return updaterState.loadUpdateProxy();
}


function saveUpdateProxy(proxyUrl) {
  return updaterState.saveUpdateProxy(proxyUrl);
}


function getUpdateReminderFilePath() {
  return path.join(app.getPath("userData"), "update-reminder.json");
}


function getDataKeyFilePath() {
  return datakeyModule.getDataKeyFilePath(app);
}


function normalizeRemotePath(remotePath) {
  return syncModule.normalizeRemotePath(remotePath);
}


function normalizeAppPassword(appPassword) {
  return syncModule.normalizeAppPassword(appPassword);
}


function normalizeServerUrl(serverUrl) {
  return syncModule.normalizeServerUrl(serverUrl);
}


function encryptLocalSecret(secret) {
  return syncModule.encryptLocalSecret(secret);
}


function decryptLocalSecret(secret) {
  return syncModule.decryptLocalSecret(secret);
}


function loadSyncConfig(options) {
  return syncModule.loadSyncConfig(app, options);
}


function saveSyncConfig(config) {
  return syncModule.saveSyncConfig(app, config);
}


function touchSyncLastSyncedAt(config, timestamp) {
  return syncModule.touchSyncLastSyncedAt(app, config, timestamp);
}


function touchSyncLastCheckedAt(config, timestamp) {
  return syncModule.touchSyncLastCheckedAt(app, config, timestamp);
}


function buildWebdavUrl(config, remotePath) {
  return syncModule.buildWebdavUrl(config, remotePath);
}


function webdavAuthHeader(config) {
  return syncModule.webdavAuthHeader(config);
}


function webdavRequest(config, method, remotePath, options) {
  return syncModule.webdavRequest(config, method, remotePath, options);
}


function webdavStatusError(status, fallback) {
  return syncModule.webdavStatusError(status, fallback);
}


function getRemoteDirPath(remotePath) {
  return syncModule.getRemoteDirPath(remotePath);
}


function ensureWebdavDirectory(config) {
  return syncModule.ensureWebdavDirectory(config);
}


function comparableEntryTime(entry) {
  return syncModule.comparableEntryTime(entry);
}


function mergeVaultPayloads(localPayload, remotePayload) {
  return syncModule.mergeVaultPayloads(localPayload, remotePayload);
}


function payloadUpdatedTime(payload) {
  return syncModule.payloadUpdatedTime(payload);
}


function resolveSyncConfig(candidate) {
  return syncModule.resolveSyncConfig(app, candidate);
}


function validateSyncConfig(config) {
  return syncModule.validateSyncConfig(config);
}


function readRemoteVault(config, masterPassword) {
  return syncModule.readRemoteVault(config, masterPassword, {
    decryptVault, encryptJson, isDataKeyVault, activeDataKey,
  });
}


function writeRemoteVault(config, wrapped, options) {
  return syncModule.writeRemoteVault(config, wrapped, options);
}


function applySyncedVault(masterPassword, payload, wrapped) {
  saveVaultFile(wrapped);
  vaultCache = payload;
  activeMasterPassword = String(masterPassword ?? "");
  if (biometricStatus().configured) {
    saveBiometricSecret(masterPassword);
  }
  broadcastStatus();
  broadcastVaultUpdated(payload, activeMasterPassword);
}

function encryptVaultForSave(masterPassword, payload) {
  const vaultState = loadVaultFile();
  if (vaultState.exists && !vaultState.corrupted) {
    try {
      const current = decryptVault(masterPassword, vaultState.data, { dataKey: activeDataKey });
      if (current.vaultKey) {
        const dataKey = getSessionDataKey();
        const shouldUseV3 = isDataKeyVault(vaultState.data) || Boolean(dataKey);
        return encryptJson(masterPassword, payload, {
          vaultKey: current.vaultKey,
          dataKey: shouldUseV3 ? dataKey : "",
          format: shouldUseV3 ? "v3" : "v2",
        });
      }
    } catch (error) {
      if (isDataKeyVault(vaultState.data)) {
        throw error;
      }
      // If the current file cannot be opened, save with a fresh data key.
    }
  }
  const dataKey = getSessionDataKey();
  return encryptJson(masterPassword, payload, {
    dataKey,
    format: dataKey ? "v3" : "v2",
  });
}

function canUseBiometricUnlock() {
  return biometricModule.canUseBiometricUnlock();
}


function loadBiometricFile() {
  return biometricModule.loadBiometricFile(app);
}


function biometricStatus() {
  return biometricModule.biometricStatus(app);
}


function saveBiometricSecret(masterPassword) {
  return biometricModule.saveBiometricSecret(app, masterPassword);
}


function deleteBiometricFile() {
  return biometricModule.deleteBiometricFile(app);
}



function writeRememberedDataKeyFile(dataKey) {
  return datakeyModule.writeRememberedDataKeyFile(app, dataKey);
}


function loadDataKeyFile() {
  return datakeyModule.loadDataKeyFile(app);
}


function dataKeyStatus() {
  return datakeyModule.dataKeyStatus(app, { activeDataKey, loadVaultFile, isDataKeyVault });
}


function getSessionDataKey(fallback) {
  return datakeyModule.getSessionDataKey(activeDataKey, fallback);
}


function migrateVaultToDataKey(nextDataKey, previousDataKey) {
  return datakeyModule.migrateVaultToDataKey(app, {
    activeMasterPassword, activeDataKey, vaultCache,
    loadVaultFile, isDataKeyVault, decryptVault, encryptJson,
    saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated,
  }, nextDataKey, previousDataKey);
}


function migrateVaultOffDataKey(previousDataKey) {
  return datakeyModule.migrateVaultOffDataKey(app, {
    activeMasterPassword, activeDataKey, vaultCache,
    loadVaultFile, isDataKeyVault, decryptVault, encryptJson,
    saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated,
  }, previousDataKey);
}


function saveDataKeySecret(dataKey, options) {
  return datakeyModule.saveDataKeySecret(app, {
    activeMasterPassword, activeDataKey, vaultCache,
    loadVaultFile, isDataKeyVault, decryptVault, encryptJson,
    saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated,
  }, dataKey, options);
}


function readRememberedDataKey() {
  return datakeyModule.readRememberedDataKey(app);
}


function deleteDataKeyFile() {
  return datakeyModule.deleteDataKeyFile(app);
}


function setRememberedDataKey(remember) {
  return datakeyModule.setRememberedDataKey(app, { activeDataKey }, remember);
}


function clearDataKeySecret(options) {
  return datakeyModule.clearDataKeySecret(app, {
    activeMasterPassword, activeDataKey, vaultCache,
    loadVaultFile, isDataKeyVault, decryptVault, encryptJson,
    saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated,
  }, options);
}


function loadRememberedDataKeyIntoSession() {
  const remembered = datakeyModule.loadRememberedDataKeyIntoSession(app);
  if (remembered) activeDataKey = remembered;
}


function readBiometricSecret() {
  return biometricModule.readBiometricSecret(app);
}


function normalizeRecoveryAnswer(answer) {
  return recoveryModule.normalizeRecoveryAnswer(answer);
}


function buildRecoverySecret(answers) {
  return recoveryModule.buildRecoverySecret(answers);
}


function loadRecoveryFile() {
  return recoveryModule.loadRecoveryFile();
}


function recoveryStatus() {
  return recoveryModule.recoveryStatus();
}


function saveRecoveryFile(content) {
  return recoveryModule.saveRecoveryFile(content);
}


function deleteRecoveryFile() {
  return recoveryModule.deleteRecoveryFile();
}


function getBackupDirPath() {
  return recoveryModule.getBackupDirPath();
}


function trimBackups() {
  return recoveryModule.trimBackups();
}


function createVaultBackup(reason) {
  return recoveryModule.createVaultBackup(reason);
}


function validateExternalUrl(targetUrl) {
  return updater.validateExternalUrl(targetUrl);
}


function normalizeVersion(version) {
  return updater.normalizeVersion(version);
}


function compareVersions(currentVersion, nextVersion) {
  return updater.compareVersions(currentVersion, nextVersion);
}


function selectReleaseAsset(release) {
  return updater.selectReleaseAsset(release);
}


function fetchLatestRelease() {
  return updater.fetchLatestRelease();
}


function normalizeReleaseInfo(release) {
  return updater.normalizeReleaseInfo(release);
}


function safeDownloadName(name) {
  return updater.safeDownloadName(name);
}


function downloadReleaseAsset(assetUrl, assetName, assetSize, onProgress) {
  return updater.downloadReleaseAsset(assetUrl, assetName, assetSize, onProgress);
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

function unlockVaultWithPassword(masterPassword, options = {}) {
  const { createIfMissing = false, fromBiometric = false, dataKey = "" } = options;
  const vaultState = loadVaultFile();
  if (vaultState.corrupted) {
    return { ok: false, error: "保险箱文件已损坏，请先导入备份或修复文件" };
  }
  if (unlockLockedUntil && Date.now() < unlockLockedUntil) {
    const remaining = Math.max(1, Math.ceil((unlockLockedUntil - Date.now()) / 1000));
    return { ok: false, error: `错误次数过多，请 ${remaining} 秒后再试`, retryAfter: remaining };
  }
  if (!vaultState.exists) {
    if (!createIfMissing) {
      return { ok: false, error: "本地还没有可解锁的保险箱" };
    }
    if (String(dataKey ?? "").trim()) {
      activeDataKey = String(dataKey ?? "").trim();
    }
    const payload = defaultVault();
    const wrapped = encryptJson(masterPassword, payload, {
      dataKey: activeDataKey,
      format: activeDataKey ? "v3" : "v2",
    });
    saveVaultFile(wrapped);
    deleteRecoveryFile();
    deleteBiometricFile();
    vaultCache = payload;
    activeMasterPassword = String(masterPassword ?? "");
    loadRememberedDataKeyIntoSession();
    resetUnlockFailures();
    broadcastStatus();
    return { ok: true, needsSetup: true, vault: vaultCache };
  }

  try {
    if (String(dataKey ?? "").trim()) {
      activeDataKey = String(dataKey ?? "").trim();
    } else if (isDataKeyVault(vaultState.data)) {
      loadRememberedDataKeyIntoSession();
    }
    const decrypted = decryptVault(masterPassword, vaultState.data, { dataKey: activeDataKey });
    const payload = decrypted.payload;
    if (decrypted.legacy) {
      createVaultBackup("before-v2-migration");
      saveVaultFile(encryptJson(masterPassword, payload, {
        dataKey: activeDataKey,
        vaultKey: decrypted.vaultKey || undefined,
        format: activeDataKey ? "v3" : "v2",
      }));
    } else if (activeDataKey && !decrypted.dataKeyVault) {
      createVaultBackup("before-data-key-migration");
      saveVaultFile(encryptJson(masterPassword, payload, {
        dataKey: activeDataKey,
        vaultKey: decrypted.vaultKey || undefined,
        format: "v3",
      }));
    }
    vaultCache = payload;
    activeMasterPassword = String(masterPassword ?? "");
    loadRememberedDataKeyIntoSession();
    resetUnlockFailures();
    if (!fromBiometric && biometricStatus().configured) {
      saveBiometricSecret(masterPassword);
    }
    broadcastStatus();
    return { ok: true, needsSetup: false, vault: payload };
  } catch (error) {
    if (error?.code === "DATA_KEY_REQUIRED") {
      if (fromBiometric) {
        return {
          ok: false,
          needsDataKey: true,
          error: "Touch ID 已验证主密码，但还需要数据钥匙才能打开保险箱",
        };
      }
      return { ok: false, needsDataKey: true, error: "当前保险箱需要数据钥匙，但本机还没有记住" };
    }
    if (error?.code === "DATA_KEY_INVALID") {
      if (fromBiometric) {
        return {
          ok: false,
          needsDataKey: true,
          error: "Touch ID 已验证主密码，但本机数据钥匙不正确",
        };
      }
      return { ok: false, needsDataKey: true, error: "本机记住的数据钥匙不正确，无法打开当前保险箱" };
    }
    consumeUnlockFailure();
    if (unlockLockedUntil && Date.now() < unlockLockedUntil) {
      const remaining = Math.max(1, Math.ceil((unlockLockedUntil - Date.now()) / 1000));
      return { ok: false, error: `错误次数过多，请 ${remaining} 秒后再试`, retryAfter: remaining };
    }
    return { ok: false, error: "密码错误" };
  }
}

function broadcastStatus() {
  const vaultState = loadVaultFile();
  const status = {
    hasVault: vaultState.exists,
    corrupted: vaultState.corrupted,
    lockedUntil: unlockLockedUntil,
    biometric: biometricStatus(),
    dataKey: dataKeyStatus(),
  };

  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.webContents.send("app:status", status);
  }
  if (vaultWindow && !vaultWindow.isDestroyed()) {
    vaultWindow.webContents.send("app:status", status);
  }
  return status;
}

function broadcastVaultUpdated(payload, masterPassword = activeMasterPassword) {
  if (!payload || !vaultWindow || vaultWindow.isDestroyed()) return;
  vaultWindow.webContents.send("app:vaultUpdated", {
    vault: payload,
    masterPassword,
  });
}

function createBaseWindow(options) {
  return new BrowserWindow({
    title: "Coco Dense",
    icon: getAppIconPath(),
    frame: !isMac,
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
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

function revealWindow(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return false;
  if (targetWindow.isMinimized()) {
    targetWindow.restore();
  }
  targetWindow.show();
  targetWindow.focus();
  return true;
}

function isVaultUnlocked() {
  return Boolean(vaultCache && activeMasterPassword);
}

function revealPrimaryWindow() {
  if (isVaultUnlocked()) {
    if (revealWindow(vaultWindow)) {
      return true;
    }
    if (revealWindow(loginWindow)) {
      return true;
    }
    return false;
  }

  if (vaultWindow && !vaultWindow.isDestroyed()) {
    vaultWindow.hide();
  }
  if (revealWindow(loginWindow)) {
    return true;
  }
  return false;
}

function bindMacCloseToHide(targetWindow, getPeerWindow) {
  targetWindow.on("close", (event) => {
    if (!isMac || isQuitting) return;

    const peerWindow = typeof getPeerWindow === "function" ? getPeerWindow() : null;
    if (peerWindow && !peerWindow.isDestroyed() && peerWindow.isVisible()) {
      return;
    }

    event.preventDefault();
    targetWindow.hide();
  });
}

function bindDesktopCloseToQuit(targetWindow, getPeerWindow) {
  targetWindow.on("close", () => {
    if (isMac || isQuitting) return;

    isQuitting = true;
    const peerWindow = typeof getPeerWindow === "function" ? getPeerWindow() : null;
    if (peerWindow && !peerWindow.isDestroyed()) {
      peerWindow.destroy();
    }
  });
}

function configureApplicationMenu() {
  if (!isMac) {
    Menu.setApplicationMenu(null);
    return;
  }

  const appName = app.name || "Coco Dense";
  const template = [
    {
      label: appName,
      submenu: [
        { role: "about", label: `关于 ${appName}` },
        { type: "separator" },
        { role: "services", label: "服务" },
        { type: "separator" },
        { role: "hide", label: `隐藏 ${appName}` },
        { role: "hideOthers", label: "隐藏其他" },
        { role: "unhide", label: "全部显示" },
        { type: "separator" },
        { role: "quit", label: `退出 ${appName}` },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" },
        { role: "selectAll", label: "全选" },
      ],
    },
    {
      label: "显示",
      submenu: [
        { role: "reload", label: "重新载入" },
        { role: "forceReload", label: "强制重新载入" },
        { role: "toggleDevTools", label: "开发者工具" },
        { type: "separator" },
        { role: "resetZoom", label: "实际大小" },
        { role: "zoomIn", label: "放大" },
        { role: "zoomOut", label: "缩小" },
        { type: "separator" },
        { role: "togglefullscreen", label: "进入全屏" },
      ],
    },
    {
      label: "窗口",
      submenu: [
        { role: "minimize", label: "最小化" },
        { role: "zoom", label: "缩放" },
        { type: "separator" },
        { role: "front", label: "前置全部窗口" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
    if (!isVaultUnlocked()) {
      if (vaultWindow && !vaultWindow.isDestroyed()) {
        vaultWindow.webContents.send("app:clearAuth");
        vaultWindow.hide();
      }
      if (loginWindow && !loginWindow.isDestroyed()) {
        revealWindow(loginWindow);
      }
      broadcastStatus();
      return { ok: false, error: "请先解锁保险箱" };
    }

    if (vaultWindow && !vaultWindow.isDestroyed()) {
      vaultWindow.webContents.send("app:showVault", {
        vault: vaultCache,
        masterPassword: activeMasterPassword,
      });
      vaultWindow.webContents.send("app:status", {
        hasVault: loadVaultFile().exists,
        corrupted: loadVaultFile().corrupted,
        lockedUntil: unlockLockedUntil,
        dataKey: dataKeyStatus(),
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
    activeDataKey = "";

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
      biometric: biometricStatus(),
      dataKey: dataKeyStatus(),
    };
  });

  ipcMain.handle("vault:getRecoveryStatus", () => recoveryStatus());
  ipcMain.handle("vault:getBiometricStatus", () => biometricStatus());
  ipcMain.handle("vault:getDataKeyStatus", () => dataKeyStatus());
  ipcMain.handle("app:getInfo", () => ({
    ok: true,
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  }));
  ipcMain.handle("folderUi:get", () => loadFolderUiFile());
  ipcMain.handle("folderUi:save", (_event, folderUi) => { saveFolderUiFile(folderUi); return { ok: true }; });
  ipcMain.handle("update:findDownloaded", (_event, assetName) => {
    try {
      const name = safeDownloadName(assetName || "");
      if (!name) return { found: false };
      const filePath = path.join(app.getPath("downloads"), name);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        return { found: true, filePath, size: stat.size };
      }
      return { found: false };
    } catch {
      return { found: false };
    }
  });
  ipcMain.handle("update:getProxy", () => ({ proxyUrl: loadUpdateProxy() }));
  ipcMain.handle("update:saveProxy", (_event, proxyUrl) => { saveUpdateProxy(proxyUrl); return { ok: true }; });
  ipcMain.handle("update:getReminder", () => {
    try {
      const filePath = getUpdateReminderFilePath();
      if (!fs.existsSync(filePath)) return { mutedDate: "", mutedVersion: "" };
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return {
        mutedDate: String(raw?.mutedDate || ""),
        mutedVersion: String(raw?.mutedVersion || ""),
      };
    } catch {
      return { mutedDate: "", mutedVersion: "" };
    }
  });
  ipcMain.handle("update:saveReminder", (_event, reminderState) => {
    try {
      const filePath = getUpdateReminderFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(reminderState || {}, null, 2), "utf8");
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });
  ipcMain.handle("update:check", async () => {
    try {
      const latest = await fetchLatestRelease();
      if (!latest.ok) return latest;
      return { ok: true, ...normalizeReleaseInfo(latest.release) };
    } catch (error) {
      return { ok: false, error: error?.message || "检查更新失败" };
    }
  });
  ipcMain.handle("update:installDownloaded", async (_event, filePath) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return { ok: false, error: "file not found" };
      }
      const isNsis = /[-_]Setup\.exe$/i.test(filePath);
      if (isNsis) {
        const child = require("child_process").spawn(filePath, [], { detached: true, stdio: "ignore" });
        child.unref();
        setTimeout(() => app.quit(), 1500);
        return { ok: true };
      }
      const openError = await shell.openPath(filePath);
      if (openError) {
        shell.showItemInFolder(filePath);
        return { ok: false, error: openError };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || "open failed" };
    }
  });

ipcMain.handle("update:cancelDownload", () => {
    try {
      downloadCancelledByUser = true;
      if (currentDownloadController) {
        currentDownloadController.abort();
        currentDownloadController = null;
      }
      const filePath = currentDownloadFilePath;
      currentDownloadFilePath = null;
      if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "取消下载失败" };
    }
  });

  ipcMain.handle("update:download", async (event) => {
    const sendDownloadProgress = (progress) => {
      event.sender.send("update:downloadProgress", progress);
    };
    try {
      sendDownloadProgress({ stage: "checking", downloadedBytes: 0, totalBytes: 0 });
      const latest = await fetchLatestRelease();
      if (!latest.ok) return latest;
      const info = normalizeReleaseInfo(latest.release);
      if (!info.updateAvailable) {
        return { ok: false, ...info, error: "当前已经是最新版本" };
      }
      if (!info.assetUrl) {
        return { ok: false, ...info, error: "没有找到适合当前系统的安装包" };
      }
      const downloaded = await downloadReleaseAsset(
        info.assetUrl,
        info.assetName,
        info.assetSize,
        sendDownloadProgress,
      );
      if (!downloaded.ok) return { ...downloaded, ...info };
      sendDownloadProgress({
        stage: "done",
        downloadedBytes: info.assetSize,
        totalBytes: info.assetSize,
        filePath: downloaded.filePath,
      });
      return { ok: true, ...info, filePath: downloaded.filePath, opened: false };
    } catch (error) {
      sendDownloadProgress({ stage: "error", error: error?.message || "下载更新失败" });
      return { ok: false, error: error?.message || "下载更新失败" };
    }
  });
  ipcMain.handle("vault:generateDataKey", () => {
    const dataKey = generateDataKeySecret();
    return { ok: true, dataKey, status: dataKeyStatus() };
  });
  ipcMain.handle("vault:saveDataKey", (_event, dataKey, remember) => {
    try {
      return saveDataKeySecret(dataKey, { remember: Boolean(remember) });
    } catch (error) {
      return { ok: false, error: error?.message || "保存数据钥匙失败" };
    }
  });
  ipcMain.handle("vault:setDataKeyRemembered", (_event, remember) => {
    try {
      return setRememberedDataKey(remember);
    } catch (error) {
      return { ok: false, error: error?.message || "更新本机记住状态失败" };
    }
  });
  ipcMain.handle("vault:clearDataKey", () => {
    try {
      return clearDataKeySecret();
    } catch {
      return { ok: false, error: "清除数据钥匙失败" };
    }
  });
  ipcMain.handle("vault:readDataKey", () => {
    try {
      return readRememberedDataKey();
    } catch (error) {
      return { ok: false, error: error?.message || "读取数据钥匙失败" };
    }
  });
  ipcMain.handle("sync:getConfig", () => {
    const config = loadSyncConfig();
    return { ok: true, config };
  });
  ipcMain.handle("sync:saveConfig", (_event, config) => {
    try {
      return saveSyncConfig(config || {});
    } catch (error) {
      return { ok: false, error: error?.message || "保存同步配置失败" };
    }
  });
  ipcMain.handle("sync:testConfig", async (_event, candidateConfig) => {
    try {
      const config = resolveSyncConfig(candidateConfig || {});
      const validation = validateSyncConfig(config);
      if (!validation.ok) return validation;
      const ensured = await ensureWebdavDirectory(config);
      if (!ensured.ok) return ensured;
      const response = await webdavRequest(config, "PROPFIND", config.remotePath, {
        headers: { Depth: "0", "Content-Type": "application/xml; charset=utf-8" },
        body: `<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop><displayname/></prop></propfind>`,
      });
      if (![200, 207, 404].includes(response.status)) {
        return { ok: false, error: webdavStatusError(response.status, "连接失败") };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || "测试连接失败" };
    }
  });
  ipcMain.handle("sync:peek", async (_event, masterPassword, candidateConfig) => {
    try {
      const config = resolveSyncConfig(candidateConfig || {});
      const validation = validateSyncConfig(config);
      if (!validation.ok) return validation;
      if (!String(masterPassword ?? "").trim()) {
        return { ok: false, error: "请先解锁保险箱" };
      }

      const remoteResult = await readRemoteVault(config, masterPassword);
      if (!remoteResult.ok) return remoteResult;
      const lastCheckedAt = touchSyncLastCheckedAt(config);
      return {
        ok: true,
        exists: remoteResult.exists,
        lastCheckedAt,
        updatedAt: remoteResult.payload?.updatedAt || "",
        payload: remoteResult.payload || null,
      };
    } catch (error) {
      return { ok: false, error: error?.message || "检查云端更新失败" };
    }
  });
  ipcMain.handle("sync:upload", async (_event, masterPassword, payload, candidateConfig, options = {}) => {
    try {
      const config = resolveSyncConfig(candidateConfig || {});
      const validation = validateSyncConfig(config);
      if (!validation.ok) return validation;
      if (!String(masterPassword ?? "").trim()) {
        return { ok: false, error: "请先解锁保险箱" };
      }
      const ensured = await ensureWebdavDirectory(config);
      if (!ensured.ok) return ensured;

      const localPayload = payload || vaultCache || defaultVault();
      if (!options?.force) {
        const remoteResult = await readRemoteVault(config, masterPassword);
        if (!remoteResult.ok) return remoteResult;
        if (
          remoteResult.exists &&
          payloadUpdatedTime(remoteResult.payload) > payloadUpdatedTime(localPayload)
        ) {
          return {
            ok: false,
            needsMerge: true,
            error: "云端有更新，请先双向合并",
            remoteUpdatedAt: remoteResult.payload?.updatedAt || "",
          };
        }
      }

      const wrapped = encryptVaultForSave(masterPassword, localPayload);
      const uploadResult = await writeRemoteVault(config, wrapped, { app });
      if (!uploadResult.ok) return uploadResult;
      applySyncedVault(masterPassword, localPayload, wrapped);
      return {
        ok: true,
        vault: localPayload,
        lastSyncedAt: uploadResult.lastSyncedAt,
        lastCheckedAt: uploadResult.lastSyncedAt,
      };
    } catch (error) {
      return { ok: false, error: error?.message || "上传失败" };
    }
  });
  ipcMain.handle("sync:download", async (_event, masterPassword, candidateConfig) => {
    try {
      const config = resolveSyncConfig(candidateConfig || {});
      const validation = validateSyncConfig(config);
      if (!validation.ok) return validation;
      if (!String(masterPassword ?? "").trim()) {
        return { ok: false, error: "请先解锁保险箱" };
      }
      const remoteResult = await readRemoteVault(config, masterPassword);
      if (!remoteResult.ok) return remoteResult;
      if (!remoteResult.exists) {
        return { ok: false, error: "坚果云上还没有保险箱文件，请先上传" };
      }

      if (fs.existsSync(getVaultFilePath())) {
        const backupResult = createVaultBackup("before-webdav-download");
        if (!backupResult.ok) return { ok: false, error: "自动备份失败，已取消下载" };
      }

      applySyncedVault(masterPassword, remoteResult.payload, remoteResult.wrapped);
      const lastSyncedAt = touchSyncLastSyncedAt(config);
      return { ok: true, vault: remoteResult.payload, lastSyncedAt, lastCheckedAt: lastSyncedAt };
    } catch (error) {
      return { ok: false, error: error?.message || "下载失败" };
    }
  });
  ipcMain.handle("sync:syncNow", async (_event, masterPassword, payload, candidateConfig) => {
    try {
      const config = resolveSyncConfig(candidateConfig || {});
      const validation = validateSyncConfig(config);
      if (!validation.ok) return validation;
      if (!String(masterPassword ?? "").trim()) {
        return { ok: false, error: "请先解锁保险箱" };
      }
      const ensured = await ensureWebdavDirectory(config);
      if (!ensured.ok) return ensured;

      let localPayload = payload || vaultCache;
      if (!localPayload) {
        const localState = loadVaultFile();
        localPayload = localState.exists && !localState.corrupted
          ? decryptJson(masterPassword, localState.data, { dataKey: activeDataKey })
          : defaultVault();
      }
      const remoteResult = await readRemoteVault(config, masterPassword);
      if (!remoteResult.ok) return remoteResult;

      let nextPayload = localPayload;
      let mergeConflicts = [];
      let remoteWrapped = null;
      if (remoteResult.exists) {
        const mergeResult = mergeVaultPayloads(localPayload, remoteResult.payload);
        nextPayload = mergeResult.payload;
        mergeConflicts = mergeResult.conflicts || [];
        remoteWrapped = encryptVaultForSave(masterPassword, nextPayload);
      } else {
        remoteWrapped = encryptVaultForSave(masterPassword, localPayload);
      }

      if (fs.existsSync(getVaultFilePath())) {
        const backupResult = createVaultBackup("before-webdav-sync");
        if (!backupResult.ok) return { ok: false, error: "自动备份失败，已取消同步" };
      }

      const uploadResult = await writeRemoteVault(config, remoteWrapped, { app });
      if (!uploadResult.ok) return uploadResult;
      applySyncedVault(masterPassword, nextPayload, remoteWrapped);
      const entryConflicts = mergeConflicts.filter((c) => !c.type);
      return {
        ok: true,
        vault: nextPayload,
        merged: remoteResult.exists,
        conflicts: entryConflicts.length > 0 ? entryConflicts : undefined,
        conflictCount: entryConflicts.length || undefined,
        lastSyncedAt: uploadResult.lastSyncedAt,
        lastCheckedAt: uploadResult.lastSyncedAt,
      };
    } catch (error) {
      return { ok: false, error: error?.message || "同步失败" };
    }
  });
  ipcMain.handle("vault:getCurrent", () => vaultCache ?? loadVaultFile().data);

  ipcMain.handle("vault:unlock", (_event, masterPassword, dataKey) => {
    return unlockVaultWithPassword(masterPassword, { createIfMissing: true, dataKey });
  });

  ipcMain.handle("vault:enableBiometric", async (_event, masterPassword) => {
    if (!canUseBiometricUnlock()) {
      return { ok: false, error: "当前设备或系统不支持 Touch ID 解锁" };
    }
    const vaultState = loadVaultFile();
    if (!vaultState.exists || vaultState.corrupted) {
      return { ok: false, error: "当前保险箱不可用，无法启用 Touch ID" };
    }
    try {
      decryptJson(masterPassword, vaultState.data, { dataKey: activeDataKey });
      await systemPreferences.promptTouchID("启用 Coco Dense 的 Touch ID 解锁");
      const result = saveBiometricSecret(masterPassword);
      broadcastStatus();
      return result;
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return { ok: false, error: "请先输入数据钥匙，再启用 Touch ID" };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return { ok: false, error: "数据钥匙不正确，无法启用 Touch ID" };
      }
      return { ok: false, error: "Touch ID 验证失败或主密码不正确" };
    }
  });

  ipcMain.handle("vault:disableBiometric", () => {
    try {
      deleteBiometricFile();
      broadcastStatus();
      return { ok: true, status: biometricStatus() };
    } catch {
      return { ok: false, error: "关闭 Touch ID 解锁失败" };
    }
  });

  ipcMain.handle("vault:unlockWithBiometric", async () => {
    if (!canUseBiometricUnlock()) {
      return { ok: false, error: "当前设备或系统不支持 Touch ID 解锁" };
    }
    try {
      await systemPreferences.promptTouchID("使用 Touch ID 解锁 Coco Dense");
    } catch {
      return { ok: false, error: "Touch ID 验证未通过" };
    }

    const secret = readBiometricSecret();
    if (!secret.ok) return secret;
    const result = unlockVaultWithPassword(secret.masterPassword, { fromBiometric: true });
    if (result.ok) {
      return { ...result, masterPassword: secret.masterPassword };
    }
    return result;
  });

  ipcMain.handle("vault:save", (_event, masterPassword, payload) => {
    try {
      const wrapped = encryptVaultForSave(masterPassword, payload);
      saveVaultFile(wrapped);
      vaultCache = payload;
      broadcastStatus();
      return { ok: true };
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return { ok: false, error: "请先输入数据钥匙" };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return { ok: false, error: "数据钥匙不正确，无法保存" };
      }
      return { ok: false, error: error?.message || "保存失败" };
    }
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
      const decrypted = decryptVault(currentPassword, vaultState.data, { dataKey: activeDataKey });
      const payload = decrypted.payload;
      const nextPayload = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      const wrapped = encryptJson(nextPassword, nextPayload, {
        vaultKey: decrypted.vaultKey || undefined,
        dataKey: activeDataKey,
        format: decrypted.dataKeyVault || activeDataKey ? "v3" : "v2",
      });
      saveVaultFile(wrapped);
      deleteRecoveryFile();
      vaultCache = nextPayload;
      activeMasterPassword = String(nextPassword ?? "");
      loadRememberedDataKeyIntoSession();
      if (biometricStatus().configured) {
        saveBiometricSecret(nextPassword);
      }
      resetUnlockFailures();
      broadcastStatus();
      return { ok: true, vault: nextPayload, recoveryReset: true };
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return { ok: false, error: "请先输入数据钥匙，再修改主密码" };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return { ok: false, error: "数据钥匙不正确，无法修改主密码" };
      }
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
    if (answerList.length !== 1 || answerList.some((item) => normalizeRecoveryAnswer(item).length < RECOVERY_ANSWER_MIN_LENGTH)) {
      return { ok: false, error: `安全问题答案至少需要 ${RECOVERY_ANSWER_MIN_LENGTH} 个字符` };
    }
    if (!String(masterPassword ?? "").trim()) {
      return { ok: false, error: "请先解锁保险箱" };
    }

    const vaultState = loadVaultFile();
    if (!vaultState.exists || vaultState.corrupted) {
      return { ok: false, error: "当前保险箱不可用，无法设置找回" };
    }

    try {
      decryptJson(masterPassword, vaultState.data, { dataKey: activeDataKey });
      const now = new Date().toISOString();
      saveRecoveryFile({
        version: 1,
        questions: questionList,
        wrapped: encryptText(buildRecoverySecret(answerList), String(masterPassword ?? "")),
        updatedAt: now,
      });
      broadcastStatus();
      return { ok: true, status: recoveryStatus() };
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return { ok: false, error: "请先输入数据钥匙，再保存安全问题" };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return { ok: false, error: "数据钥匙不正确，无法保存安全问题" };
      }
      return { ok: false, error: "主密码校验失败，无法保存安全问题" };
    }
  });

  ipcMain.handle("vault:recoverWithAnswers", (_event, answers, dataKey = "") => {
    const recovery = loadRecoveryFile();
    if (!recovery.exists) {
      return { ok: false, unavailable: true, error: "还没有设置安全问题" };
    }
    if (recovery.corrupted) {
      return { ok: false, error: "安全问题恢复文件已损坏" };
    }

    const answerList = Array.isArray(answers) ? answers.map((item) => String(item ?? "")) : [];
    if (answerList.length !== 1 || answerList.some((item) => normalizeRecoveryAnswer(item).length < RECOVERY_ANSWER_MIN_LENGTH)) {
      return { ok: false, error: `安全问题答案至少需要 ${RECOVERY_ANSWER_MIN_LENGTH} 个字符` };
    }

    try {
      const recoveredPassword = decryptText(buildRecoverySecret(answerList), recovery.data.wrapped);
      const vaultState = loadVaultFile();
      if (!vaultState.exists || vaultState.corrupted) {
        return { ok: false, error: "当前保险箱不可用，无法解锁" };
      }

      const nextDataKey = String(dataKey ?? "").trim();
      const decrypted = decryptVault(recoveredPassword, vaultState.data, {
        dataKey: nextDataKey || activeDataKey,
      });
      const payload = decrypted.payload;
      vaultCache = payload;
      activeMasterPassword = recoveredPassword;
      if (nextDataKey) {
        activeDataKey = nextDataKey;
      } else {
        loadRememberedDataKeyIntoSession();
      }
      if (biometricStatus().configured) {
        saveBiometricSecret(recoveredPassword);
      }
      resetUnlockFailures();
      broadcastStatus();
      return {
        ok: true,
        vault: payload,
        masterPassword: recoveredPassword,
      };
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return {
          ok: false,
          needsDataKey: true,
          error: "安全问题已验证，请继续输入数据钥匙",
        };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return {
          ok: false,
          needsDataKey: true,
          error: "数据钥匙不正确",
        };
      }
      consumeUnlockFailure();
      return { ok: false, error: "安全问题答案不正确" };
    }
  });

  ipcMain.handle("vault:export", (_event, masterPassword, payload) => {
    try {
      return encryptVaultForSave(masterPassword, payload);
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return { ok: false, error: "请先输入数据钥匙，再导出保险箱" };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return { ok: false, error: "数据钥匙不正确，无法导出保险箱" };
      }
      return { ok: false, error: error?.message || "导出失败" };
    }
  });

  ipcMain.handle("vault:import", (_event, masterPassword, wrapped) => {
    try {
      const decrypted = decryptVault(masterPassword, wrapped, { dataKey: activeDataKey });
      const payload = decrypted.payload;
      saveVaultFile(decrypted.legacy ? encryptJson(masterPassword, payload, {
        dataKey: activeDataKey,
        vaultKey: decrypted.vaultKey || undefined,
        format: activeDataKey ? "v3" : "v2",
      }) : wrapped);
      deleteRecoveryFile();
      vaultCache = payload;
      activeMasterPassword = String(masterPassword ?? "");
      loadRememberedDataKeyIntoSession();
      if (biometricStatus().configured) {
        saveBiometricSecret(masterPassword);
      }
      resetUnlockFailures();
      broadcastStatus();
      return { ok: true, vault: payload };
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return { ok: false, error: "请先输入数据钥匙，再导入保险箱" };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return { ok: false, error: "数据钥匙不正确，无法导入保险箱" };
      }
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

    try {
      const wrapped = encryptVaultForSave(masterPassword, payload);
      const jsonContent = JSON.stringify(wrapped, null, 2);
      const checksum = crypto.createHash("sha256").update(jsonContent, "utf8").digest("hex");
      fs.writeFileSync(result.filePath, jsonContent, "utf8");
      try {
        fs.writeFileSync(result.filePath + ".sha256", `${checksum}  ${path.basename(result.filePath)}
`, "utf8");
      } catch { /* checksum file is best-effort */ }
      return { ok: true, filePath: result.filePath, checksum };
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return { ok: false, error: "请先输入数据钥匙，再导出保险箱" };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return { ok: false, error: "数据钥匙不正确，无法导出保险箱" };
      }
      return { ok: false, error: error?.message || "导出失败" };
    }
  });

  ipcMain.handle("vault:importFile", async (_event, masterPassword, dataKey) => {
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
      if (String(dataKey ?? "").trim()) {
        activeDataKey = String(dataKey ?? "").trim();
      }
      const wrapped = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const decrypted = decryptVault(masterPassword, wrapped, { dataKey: activeDataKey });
      const payload = decrypted.payload;

      let backupPath = "";
      if (fs.existsSync(getVaultFilePath())) {
        const backupResult = createVaultBackup("before-import");
        if (!backupResult.ok) {
          return { ok: false, error: "自动备份失败，已取消导入" };
        }
        backupPath = backupResult.filePath;
      }

      saveVaultFile(decrypted.legacy ? encryptJson(masterPassword, payload, {
        dataKey: activeDataKey,
        vaultKey: decrypted.vaultKey || undefined,
        format: activeDataKey ? "v3" : "v2",
      }) : wrapped);
      deleteRecoveryFile();
      vaultCache = payload;
      activeMasterPassword = String(masterPassword ?? "");
      if (biometricStatus().configured) {
        saveBiometricSecret(masterPassword);
      }
      resetUnlockFailures();
      broadcastStatus();
      return { ok: true, vault: payload, filePath, backupPath };
    } catch (error) {
      if (error?.code === "DATA_KEY_REQUIRED") {
        return { ok: false, error: "请先输入数据钥匙，再导入保险箱" };
      }
      if (error?.code === "DATA_KEY_INVALID") {
        return { ok: false, error: "数据钥匙不正确，无法导入保险箱" };
      }
      return { ok: false, error: "导入失败，文件格式或密码不正确" };
    }
  });

  ipcMain.handle("avatar:get", () => {
    try {
      const filePath = path.join(app.getPath("userData"), "login-avatar.json");
      if (!fs.existsSync(filePath)) return { ok: true, avatar: "" };
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return { ok: true, avatar: String(raw?.avatar || "") };
    } catch {
      return { ok: true, avatar: "" };
    }
  });
  ipcMain.handle("avatar:save", (_event, avatarData) => {
    try {
      const filePath = path.join(app.getPath("userData"), "login-avatar.json");
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({ avatar: String(avatarData || "") }, null, 2), "utf8");
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });
  ipcMain.handle("avatar:remove", () => {
    try {
      const filePath = path.join(app.getPath("userData"), "login-avatar.json");
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { ok: true };
    } catch {
      return { ok: false };
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
    width: 420,
    height: 300,
    minWidth: 360,
    minHeight: 280,
    show: false,
    resizable: true,
    maximizable: false,
    minimizable: true,
  });

  loginWindow.loadFile("index.html");
  loginWindow.once("ready-to-show", () => loginWindow.show());
  loginWindow.webContents.once("did-finish-load", () => {
    broadcastStatus();
  });
  bindMacCloseToHide(loginWindow, () => vaultWindow);
  bindDesktopCloseToQuit(loginWindow, () => vaultWindow);
  loginWindow.on("closed", () => {
    loginWindow = null;
  });
}

function createVaultWindow() {
  vaultWindow = createBaseWindow({
    width: 760,
    height: 540,
    minWidth: 620,
    minHeight: 440,
    show: false,
    resizable: true,
    maximizable: true,
    minimizable: true,
  });

  vaultWindow.loadFile("index.html");
  vaultWindow.webContents.once("did-finish-load", () => {
    if (isVaultUnlocked()) {
      vaultWindow.webContents.send("app:showVault", {
        vault: vaultCache,
        masterPassword: activeMasterPassword,
      });
    } else {
      vaultWindow.webContents.send("app:clearAuth");
    }
    vaultWindow.webContents.send("app:status", {
      hasVault: loadVaultFile().exists,
      corrupted: loadVaultFile().corrupted,
      lockedUntil: unlockLockedUntil,
    });
  });
  bindMacCloseToHide(vaultWindow, () => loginWindow);
  bindDesktopCloseToQuit(vaultWindow, () => loginWindow);
  vaultWindow.on("closed", () => {
    vaultWindow = null;
  });
}

if (gotSingleInstanceLock) {
  app.on("second-instance", () => {
    if (revealPrimaryWindow()) {
      return;
    }
    if (!loginWindow && !vaultWindow) {
      createVaultWindow();
      createLoginWindow();
    }
  });

  app.whenReady().then(() => {
    if (process.platform === "win32") {
      app.setAppUserModelId("com.coco.cocodense");
    }

    configureApplicationMenu();
    wireWindowControls();
    createVaultWindow();
    createLoginWindow();

    app.on("activate", () => {
      if (revealPrimaryWindow()) {
        return;
      }
      if (!loginWindow && !vaultWindow) {
        createVaultWindow();
        createLoginWindow();
      }
    });
  });
}

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
