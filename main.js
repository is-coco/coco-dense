const { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, shell, systemPreferences } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Readable, Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");

let loginWindow = null;
let vaultWindow = null;
let vaultCache = null;
let activeMasterPassword = "";
let activeDataKey = "";
let unlockFailures = 0;
let unlockLockedUntil = 0;
let isQuitting = false;

const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const PBKDF2_ROUNDS = 250000;
const FAILED_ATTEMPTS_LIMIT = 5;
const FAILED_ATTEMPT_LOCK_MS = 30000;
const BACKUP_LIMIT = 10;
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);
const isMac = process.platform === "darwin";
const VAULT_FORMAT_V2 = "coco-dense-envelope-v2";
const VAULT_FORMAT_V3 = "coco-dense-envelope-v3";
const REMOTE_WRITE_VERIFY_ATTEMPTS = 6;
const REMOTE_WRITE_VERIFY_DELAY_MS = 700;
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/is-coco/coco-dense/releases/latest";
const gotSingleInstanceLock = app.requestSingleInstanceLock();

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
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableJsonHash(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function deriveKey(masterPassword, saltBase64, rounds = PBKDF2_ROUNDS) {
  return crypto.pbkdf2Sync(
    String(masterPassword ?? ""),
    Buffer.from(saltBase64, "base64"),
    rounds,
    KEY_LENGTH,
    "sha256",
  );
}

function encryptLegacyJson(masterPassword, payload) {
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

function decryptLegacyJson(masterPassword, vault) {
  const key = deriveKey(masterPassword, vault.salt, vault.rounds || PBKDF2_ROUNDS);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(vault.iv, "base64"));
  decipher.setAuthTag(Buffer.from(vault.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(vault.data, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

function encryptBufferWithPassword(masterPassword, buffer) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(String(masterPassword ?? ""), salt, PBKDF2_ROUNDS, KEY_LENGTH, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
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

function decryptBufferWithPassword(masterPassword, wrapped) {
  const key = deriveKey(masterPassword, wrapped.salt, wrapped.rounds || PBKDF2_ROUNDS);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(wrapped.iv, "base64"));
  decipher.setAuthTag(Buffer.from(wrapped.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(wrapped.data, "base64")),
    decipher.final(),
  ]);
}

function encryptWithVaultKey(vaultKey, payload) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", vaultKey, iv);
  const plaintext = Buffer.from(JSON.stringify(payload ?? null), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function decryptWithVaultKey(vaultKey, wrapped) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", vaultKey, Buffer.from(wrapped.iv, "base64"));
  decipher.setAuthTag(Buffer.from(wrapped.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(wrapped.data, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

function isEnvelopeVault(vault) {
  return vault?.version === 2 && vault?.format === VAULT_FORMAT_V2 && vault?.key;
}

function isDataKeyVault(vault) {
  return vault?.version === 3 && vault?.format === VAULT_FORMAT_V3 && vault?.auth && vault?.key;
}

function makeUnlockError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function encryptJson(masterPassword, payload, options = {}) {
  const vaultKey = options.vaultKey || crypto.randomBytes(KEY_LENGTH);
  const dataKey = String(options.dataKey ?? "").trim();
  const useDataKeyVault = Boolean(options.format === "v3" || dataKey);
  const now = new Date().toISOString();
  const meta = {
    version: payload?.version || 1,
    createdAt: payload?.createdAt || now,
    updatedAt: payload?.updatedAt || now,
  };
  const entries = Array.isArray(payload?.entries) ? payload.entries : [];

  if (useDataKeyVault) {
    if (!dataKey) {
      throw new Error("请先设置数据钥匙");
    }
    return {
      version: 3,
      format: VAULT_FORMAT_V3,
      auth: {
        version: 1,
        wrapped: encryptBufferWithPassword(masterPassword, crypto.randomBytes(KEY_LENGTH)),
      },
      key: encryptBufferWithPassword(dataKey, vaultKey),
      meta: encryptWithVaultKey(vaultKey, meta),
      settings: encryptWithVaultKey(vaultKey, payload?.settings || {}),
      entries: entries.map((entry) => ({
        id: String(entry?.id ?? ""),
        updatedAt: String(entry?.updatedAt || entry?.lastUsedAt || entry?.createdAt || ""),
        deletedAt: String(entry?.deletedAt || ""),
        sealed: encryptWithVaultKey(vaultKey, entry),
      })),
    };
  }

  return {
    version: 2,
    format: VAULT_FORMAT_V2,
    key: encryptBufferWithPassword(masterPassword, vaultKey),
    meta: encryptWithVaultKey(vaultKey, meta),
    settings: encryptWithVaultKey(vaultKey, payload?.settings || {}),
    entries: entries.map((entry) => ({
      id: String(entry?.id ?? ""),
      updatedAt: String(entry?.updatedAt || entry?.lastUsedAt || entry?.createdAt || ""),
      deletedAt: String(entry?.deletedAt || ""),
      sealed: encryptWithVaultKey(vaultKey, entry),
    })),
  };
}

function verifyDataKeyVaultMaster(masterPassword, vault) {
  try {
    decryptBufferWithPassword(masterPassword, vault.auth.wrapped);
    return true;
  } catch {
    return false;
  }
}

function decryptVault(masterPassword, vault, options = {}) {
  if (isDataKeyVault(vault)) {
    if (!verifyDataKeyVaultMaster(masterPassword, vault)) {
      throw makeUnlockError("密码错误", "MASTER_PASSWORD_INVALID");
    }
    const dataKey = String(options.dataKey ?? activeDataKey ?? "").trim();
    if (!dataKey) {
      throw makeUnlockError("请输入数据钥匙", "DATA_KEY_REQUIRED");
    }
    let vaultKey = null;
    try {
      vaultKey = decryptBufferWithPassword(dataKey, vault.key);
    } catch {
      throw makeUnlockError("数据钥匙不正确", "DATA_KEY_INVALID");
    }
    const meta = decryptWithVaultKey(vaultKey, vault.meta);
    const settings = vault.settings ? decryptWithVaultKey(vaultKey, vault.settings) : {};
    const entries = Array.isArray(vault.entries)
      ? vault.entries.map((item) => decryptWithVaultKey(vaultKey, item.sealed))
      : [];
    return {
      legacy: false,
      dataKeyVault: true,
      vaultKey,
      payload: {
        version: meta?.version || 1,
        createdAt: meta?.createdAt || new Date().toISOString(),
        updatedAt: meta?.updatedAt || new Date().toISOString(),
        entries,
        settings,
      },
    };
  }

  if (isEnvelopeVault(vault)) {
    const vaultKey = decryptBufferWithPassword(masterPassword, vault.key);
    const meta = decryptWithVaultKey(vaultKey, vault.meta);
    const settings = vault.settings ? decryptWithVaultKey(vaultKey, vault.settings) : {};
    const entries = Array.isArray(vault.entries)
      ? vault.entries.map((item) => decryptWithVaultKey(vaultKey, item.sealed))
      : [];
    return {
      legacy: false,
      vaultKey,
      payload: {
        version: meta?.version || 1,
        createdAt: meta?.createdAt || new Date().toISOString(),
        updatedAt: meta?.updatedAt || new Date().toISOString(),
        entries,
        settings,
      },
    };
  }

  return {
    legacy: true,
    vaultKey: null,
    payload: decryptLegacyJson(masterPassword, vault),
  };
}

function decryptJson(masterPassword, vault, options = {}) {
  return decryptVault(masterPassword, vault, options).payload;
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

function getSyncConfigFilePath() {
  return path.join(app.getPath("userData"), "sync.json");
}

function getBiometricFilePath() {
  return path.join(app.getPath("userData"), "biometric.json");
}

function getDataKeyFilePath() {
  return path.join(app.getPath("userData"), "data-key.json");
}

function normalizeRemotePath(remotePath) {
  const trimmed = String(remotePath ?? "").trim() || "/CocoDense/vault.json";
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.replace(/\/{2,}/g, "/");
}

function normalizeAppPassword(appPassword) {
  return String(appPassword ?? "").replace(/\s+/g, "");
}

function normalizeServerUrl(serverUrl) {
  const value = String(serverUrl ?? "").trim();
  if (!value) return "";
  const parsed = new URL(value);
  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("WebDAV 地址只允许 http 或 https");
  }
  if (!parsed.pathname.endsWith("/")) {
    parsed.pathname = `${parsed.pathname}/`;
  }
  return parsed.href;
}

function encryptLocalSecret(secret) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("系统加密存储不可用");
  }
  return safeStorage.encryptString(String(secret ?? "")).toString("base64");
}

function decryptLocalSecret(secret) {
  if (!secret) return "";
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("系统加密存储不可用");
  }
  return safeStorage.decryptString(Buffer.from(secret, "base64"));
}

function loadSyncConfig({ includePassword = false } = {}) {
  const filePath = getSyncConfigFilePath();
  if (!fs.existsSync(filePath)) {
    return {
      configured: false,
      serverUrl: "",
      username: "",
      remotePath: "/CocoDense/vault.json",
      updatedAt: "",
      lastSyncedAt: "",
      lastCheckedAt: "",
      appPassword: "",
    };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const config = {
      configured: Boolean(raw?.serverUrl && raw?.username && raw?.password),
      serverUrl: String(raw?.serverUrl ?? ""),
      username: String(raw?.username ?? ""),
      remotePath: normalizeRemotePath(raw?.remotePath),
      updatedAt: String(raw?.updatedAt ?? ""),
      lastSyncedAt: String(raw?.lastSyncedAt ?? ""),
      lastCheckedAt: String(raw?.lastCheckedAt ?? ""),
      appPassword: "",
    };
    if (includePassword && config.configured) {
      config.appPassword = decryptLocalSecret(raw.password);
    }
    return config;
  } catch {
    return {
      configured: false,
      corrupted: true,
      serverUrl: "",
      username: "",
      remotePath: "/CocoDense/vault.json",
      updatedAt: "",
      lastSyncedAt: "",
      lastCheckedAt: "",
      appPassword: "",
    };
  }
}

function saveSyncConfig(config) {
  let previous = {};
  if (fs.existsSync(getSyncConfigFilePath())) {
    try {
      previous = JSON.parse(fs.readFileSync(getSyncConfigFilePath(), "utf8"));
    } catch {
      previous = {};
    }
  }
  const serverUrl = normalizeServerUrl(config.serverUrl);
  const username = String(config.username ?? "").trim();
  const remotePath = normalizeRemotePath(config.remotePath);
  const appPassword = normalizeAppPassword(config.appPassword);
  if (!serverUrl) return { ok: false, error: "请填写 WebDAV 地址" };
  if (!username) return { ok: false, error: "请填写 WebDAV 用户名" };
  if (!appPassword && !previous.password) return { ok: false, error: "请填写 WebDAV 应用密码" };

  const sameTarget =
    String(previous.serverUrl ?? "") === serverUrl &&
    String(previous.username ?? "").trim() === username &&
    normalizeRemotePath(previous.remotePath ?? "/CocoDense/vault.json") === remotePath;
  const content = {
    version: 1,
    serverUrl,
    username,
    remotePath,
    password: appPassword ? encryptLocalSecret(appPassword) : previous.password,
    updatedAt: new Date().toISOString(),
    lastSyncedAt: sameTarget ? String(previous.lastSyncedAt ?? "") : "",
    lastCheckedAt: sameTarget ? String(previous.lastCheckedAt ?? "") : "",
  };
  fs.mkdirSync(path.dirname(getSyncConfigFilePath()), { recursive: true });
  fs.writeFileSync(getSyncConfigFilePath(), JSON.stringify(content, null, 2), "utf8");
  return { ok: true, config: loadSyncConfig() };
}

function touchSyncLastSyncedAt(config, timestamp = new Date().toISOString()) {
  const filePath = getSyncConfigFilePath();
  if (!fs.existsSync(filePath)) return timestamp;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const sameTarget =
      normalizeServerUrl(raw?.serverUrl) === config.serverUrl &&
      String(raw?.username ?? "").trim() === config.username &&
      normalizeRemotePath(raw?.remotePath) === config.remotePath;
    if (!sameTarget) return timestamp;
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        ...raw,
        lastSyncedAt: timestamp,
        lastCheckedAt: timestamp,
      }, null, 2),
      "utf8",
    );
  } catch {
    return timestamp;
  }
  return timestamp;
}

function touchSyncLastCheckedAt(config, timestamp = new Date().toISOString()) {
  const filePath = getSyncConfigFilePath();
  if (!fs.existsSync(filePath)) return timestamp;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const sameTarget =
      normalizeServerUrl(raw?.serverUrl) === config.serverUrl &&
      String(raw?.username ?? "").trim() === config.username &&
      normalizeRemotePath(raw?.remotePath) === config.remotePath;
    if (!sameTarget) return timestamp;
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        ...raw,
        lastCheckedAt: timestamp,
      }, null, 2),
      "utf8",
    );
  } catch {
    return timestamp;
  }
  return timestamp;
}

function buildWebdavUrl(config, remotePath = config.remotePath) {
  const base = new URL(config.serverUrl);
  const basePath = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;
  const normalizedPath = normalizeRemotePath(remotePath);
  const encodedPath = normalizedPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  base.pathname = `${basePath}${encodedPath}`;
  if (String(remotePath ?? "").endsWith("/") && !base.pathname.endsWith("/")) {
    base.pathname = `${base.pathname}/`;
  }
  return base.href;
}

function webdavAuthHeader(config) {
  return `Basic ${Buffer.from(`${config.username}:${config.appPassword}`, "utf8").toString("base64")}`;
}

async function webdavRequest(config, method, remotePath, options = {}) {
  const response = await fetch(buildWebdavUrl(config, remotePath), {
    method,
    headers: {
      Authorization: webdavAuthHeader(config),
      ...options.headers,
    },
    body: options.body,
  });
  return response;
}

function webdavStatusError(status, fallback) {
  if (status === 401) return "认证失败：请检查坚果云邮箱和 WebDAV 应用密码";
  if (status === 403) return "没有权限：请检查 WebDAV 应用密码或远端路径权限";
  if (status === 404) return "远端路径不存在";
  if (status === 409) return "远端上级目录不存在";
  return `${fallback}：${status}`;
}

function getRemoteDirPath(remotePath) {
  const parts = normalizeRemotePath(remotePath).split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "/";
}

async function ensureWebdavDirectory(config) {
  const parts = getRemoteDirPath(config.remotePath).split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current += `/${part}`;
    const response = await webdavRequest(config, "MKCOL", `${current}/`);
    if (![200, 201, 301, 302, 405].includes(response.status)) {
      return { ok: false, error: webdavStatusError(response.status, `创建远端目录 ${current} 失败`) };
    }
  }
  return { ok: true };
}

function comparableEntryTime(entry) {
  return Date.parse(entry?.updatedAt || entry?.lastUsedAt || entry?.createdAt || "") || 0;
}

function mergeVaultPayloads(localPayload, remotePayload) {
  const byId = new Map();
  [...(remotePayload?.entries || []), ...(localPayload?.entries || [])].forEach((entry) => {
    if (!entry?.id) return;
    const current = byId.get(entry.id);
    if (!current || comparableEntryTime(entry) >= comparableEntryTime(current)) {
      byId.set(entry.id, entry);
    }
  });
  const localTime = Date.parse(localPayload?.updatedAt || "") || 0;
  const remoteTime = Date.parse(remotePayload?.updatedAt || "") || 0;
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: localPayload?.createdAt || remotePayload?.createdAt || now,
    updatedAt: now,
    entries: Array.from(byId.values()),
    settings: localTime >= remoteTime ? localPayload?.settings : remotePayload?.settings,
  };
}

function payloadUpdatedTime(payload) {
  return Date.parse(payload?.updatedAt || "") || 0;
}

function resolveSyncConfig(candidate = {}) {
  const stored = loadSyncConfig({ includePassword: true });
  const config = {
    serverUrl: candidate.serverUrl ?? stored.serverUrl,
    username: candidate.username ?? stored.username,
    remotePath: candidate.remotePath ?? stored.remotePath,
    appPassword: candidate.appPassword || stored.appPassword,
  };
  return {
    ...config,
    serverUrl: normalizeServerUrl(config.serverUrl),
    username: String(config.username ?? "").trim(),
    remotePath: normalizeRemotePath(config.remotePath),
    appPassword: normalizeAppPassword(config.appPassword),
  };
}

function validateSyncConfig(config) {
  if (!config.serverUrl) return { ok: false, error: "请填写 WebDAV 地址" };
  if (!config.username) return { ok: false, error: "请填写 WebDAV 用户名" };
  if (!config.appPassword) return { ok: false, error: "请填写 WebDAV 应用密码" };
  return { ok: true };
}

async function readRemoteVault(config, masterPassword) {
  const response = await webdavRequest(config, "GET");
  if (response.status === 404) {
    return { ok: true, exists: false, payload: null };
  }
  if (!response.ok) {
    return { ok: false, error: webdavStatusError(response.status, "读取远端文件失败") };
  }

  const wrapped = await response.json();
  try {
    const decrypted = decryptVault(masterPassword, wrapped, { dataKey: activeDataKey });
    const nextWrapped = decrypted.legacy
      ? encryptJson(masterPassword, decrypted.payload, {
        dataKey: activeDataKey,
        vaultKey: decrypted.vaultKey || undefined,
        format: activeDataKey ? "v3" : "v2",
      })
      : wrapped;
    return {
      ok: true,
      exists: true,
      payload: decrypted.payload,
      wrapped: nextWrapped,
      legacy: decrypted.legacy,
    };
  } catch (error) {
    if (error?.code === "DATA_KEY_REQUIRED") {
      return {
        ok: false,
        needsDataKey: true,
        error: "云端保险箱需要数据钥匙，请到设置的数据钥匙页面输入后再同步",
      };
    }
    if (error?.code === "DATA_KEY_INVALID") {
      return {
        ok: false,
        needsDataKey: true,
        error: "云端保险箱的数据钥匙与本机不同，请到设置的数据钥匙页面输入正确钥匙",
      };
    }
    if (error?.code === "MASTER_PASSWORD_INVALID") {
      return { ok: false, error: "远端文件无法解密，请确认主密码是否一致" };
    }
    return { ok: false, error: "远端文件无法解密，请确认主密码是否一致" };
  }
}

async function writeRemoteVault(config, wrapped) {
  const expectedHash = stableJsonHash(wrapped);
  const response = await webdavRequest(config, "PUT", undefined, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(wrapped, null, 2),
  });
  if (!response.ok) {
    return { ok: false, error: webdavStatusError(response.status, "上传失败") };
  }

  for (let attempt = 0; attempt < REMOTE_WRITE_VERIFY_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await sleep(REMOTE_WRITE_VERIFY_DELAY_MS);
    const verifyResponse = await webdavRequest(config, "GET");
    if (!verifyResponse.ok) continue;
    try {
      const remoteWrapped = await verifyResponse.json();
      if (stableJsonHash(remoteWrapped) === expectedHash) {
        return { ok: true, lastSyncedAt: touchSyncLastSyncedAt(config) };
      }
    } catch {
      // Keep retrying until WebDAV returns the JSON we just wrote.
    }
  }

  return {
    ok: false,
    error: "上传后未能确认云端文件已更新，请稍后重试",
  };
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
  return isMac && safeStorage.isEncryptionAvailable();
}

function loadBiometricFile() {
  const filePath = getBiometricFilePath();
  if (!fs.existsSync(filePath)) {
    return { exists: false, corrupted: false, data: null };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!raw || typeof raw.secret !== "string") {
      return { exists: true, corrupted: true, data: null };
    }
    return { exists: true, corrupted: false, data: raw };
  } catch {
    return { exists: true, corrupted: true, data: null };
  }
}

function biometricStatus() {
  const state = loadBiometricFile();
  const supported = canUseBiometricUnlock();
  return {
    supported,
    configured: supported && state.exists && !state.corrupted,
    corrupted: state.corrupted,
    updatedAt: state.exists && !state.corrupted ? state.data.updatedAt : "",
    unavailableReason: supported ? "" : "当前设备或系统不支持 Touch ID 解锁",
  };
}

function saveBiometricSecret(masterPassword) {
  if (!canUseBiometricUnlock()) {
    return { ok: false, error: "当前设备或系统不支持 Touch ID 解锁" };
  }
  if (!String(masterPassword ?? "").trim()) {
    return { ok: false, error: "请先输入主密码" };
  }

  const encrypted = safeStorage.encryptString(String(masterPassword ?? ""));
  const filePath = getBiometricFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify({
      version: 1,
      platform: process.platform,
      secret: encrypted.toString("base64"),
      updatedAt: new Date().toISOString(),
    }, null, 2),
    "utf8",
  );
  return { ok: true, status: biometricStatus() };
}

function deleteBiometricFile() {
  const filePath = getBiometricFilePath();
  if (!fs.existsSync(filePath)) return;
  fs.unlinkSync(filePath);
}

function generateDataKeySecret() {
  return crypto.randomBytes(32).toString("base64url");
}

function writeRememberedDataKeyFile(dataKey) {
  const value = String(dataKey ?? "").trim();
  if (!value) {
    return { ok: false, error: "当前没有可记住的数据钥匙" };
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return { ok: false, error: "系统加密存储不可用，无法在本机记住数据钥匙" };
  }

  const encrypted = safeStorage.encryptString(value);
  const filePath = getDataKeyFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify({
      version: 1,
      platform: process.platform,
      secret: encrypted.toString("base64"),
      updatedAt: new Date().toISOString(),
    }, null, 2),
    "utf8",
  );
  return { ok: true };
}

function loadDataKeyFile() {
  const filePath = getDataKeyFilePath();
  if (!fs.existsSync(filePath)) {
    return { exists: false, corrupted: false, data: null };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!raw || typeof raw.secret !== "string") {
      return { exists: true, corrupted: true, data: null };
    }
    return { exists: true, corrupted: false, data: raw };
  } catch {
    return { exists: true, corrupted: true, data: null };
  }
}

function dataKeyStatus() {
  const state = loadDataKeyFile();
  const supported = safeStorage.isEncryptionAvailable();
  const vaultState = loadVaultFile();
  return {
    supported,
    remembered: supported && state.exists && !state.corrupted,
    sessionActive: Boolean(activeDataKey),
    required: Boolean(vaultState.exists && !vaultState.corrupted && isDataKeyVault(vaultState.data)),
    corrupted: state.corrupted,
    updatedAt: state.exists && !state.corrupted ? state.data.updatedAt : "",
    unavailableReason: supported ? "" : "系统加密存储不可用，无法在本机记住数据钥匙",
  };
}

function getSessionDataKey(fallback = "") {
  return String(activeDataKey || fallback || "").trim();
}

function migrateVaultToDataKey(nextDataKey, previousDataKey = "") {
  const dataKey = String(nextDataKey ?? "").trim();
  if (!dataKey) return { ok: false, error: "请输入数据钥匙" };
  if (!activeMasterPassword || !vaultCache) {
    return { ok: true, migrated: false };
  }

  const vaultState = loadVaultFile();
  if (!vaultState.exists || vaultState.corrupted) {
    return { ok: true, migrated: false };
  }

  try {
    const decryptOptions = {
      dataKey: isDataKeyVault(vaultState.data) ? getSessionDataKey(previousDataKey || dataKey) : "",
    };
    const decrypted = decryptVault(activeMasterPassword, vaultState.data, decryptOptions);
    const payload = {
      ...decrypted.payload,
      updatedAt: new Date().toISOString(),
    };
    const backupResult = createVaultBackup("before-data-key-migration");
    if (!backupResult.ok) return { ok: false, error: backupResult.error || "自动备份失败，已取消迁移" };
    const wrapped = encryptJson(activeMasterPassword, payload, {
      format: "v3",
      dataKey,
      vaultKey: decrypted.vaultKey || undefined,
    });
    saveVaultFile(wrapped);
    vaultCache = payload;
    return { ok: true, migrated: true, vault: payload };
  } catch (error) {
    if (error?.code === "DATA_KEY_INVALID" || error?.code === "DATA_KEY_REQUIRED") {
      return { ok: false, error: "当前数据钥匙不正确，无法迁移保险箱" };
    }
    return { ok: false, error: error?.message || "迁移数据钥匙失败" };
  }
}

function migrateVaultOffDataKey(previousDataKey = "") {
  const vaultState = loadVaultFile();
  if (!vaultState.exists || vaultState.corrupted || !isDataKeyVault(vaultState.data)) {
    return { ok: true, migrated: false };
  }
  if (!activeMasterPassword || !vaultCache) {
    return { ok: false, error: "请先解锁保险箱后再清除数据钥匙" };
  }

  const dataKey = String(previousDataKey ?? "").trim() || getSessionDataKey();
  if (!dataKey) {
    return { ok: false, error: "当前保险箱仍在使用数据钥匙，请先解锁后再清除" };
  }

  try {
    const decrypted = decryptVault(activeMasterPassword, vaultState.data, { dataKey });
    const payload = {
      ...decrypted.payload,
      updatedAt: new Date().toISOString(),
    };
    const backupResult = createVaultBackup("before-data-key-removal");
    if (!backupResult.ok) return { ok: false, error: backupResult.error || "自动备份失败，已取消清除" };
    const wrapped = encryptJson(activeMasterPassword, payload, {
      format: "v2",
      vaultKey: decrypted.vaultKey || undefined,
    });
    saveVaultFile(wrapped);
    vaultCache = payload;
    return { ok: true, migrated: true, vault: payload };
  } catch (error) {
    if (error?.code === "DATA_KEY_INVALID" || error?.code === "DATA_KEY_REQUIRED") {
      return { ok: false, error: "当前数据钥匙不可用，无法清除" };
    }
    return { ok: false, error: error?.message || "清除数据钥匙失败" };
  }
}

function saveDataKeySecret(dataKey, options = {}) {
  const value = String(dataKey ?? "").trim();
  if (!value) {
    return { ok: false, error: "请输入数据钥匙" };
  }
  const shouldRemember = Boolean(options.remember);
  const supported = safeStorage.isEncryptionAvailable();
  const previousDataKey = activeDataKey;
  const migration = migrateVaultToDataKey(value, previousDataKey);
  if (!migration.ok) return migration;
  activeDataKey = value;
  if (!shouldRemember) {
    deleteDataKeyFile();
    broadcastStatus();
    return { ok: true, status: dataKeyStatus(), vault: migration.vault || null };
  }
  if (!supported) {
    broadcastStatus();
    return { ok: true, status: dataKeyStatus(), vault: migration.vault || null };
  }
  const persisted = writeRememberedDataKeyFile(value);
  if (!persisted.ok) return persisted;
  broadcastStatus();
  return { ok: true, status: dataKeyStatus(), vault: migration.vault || null };
}

function readRememberedDataKey() {
  const state = loadDataKeyFile();
  if (!state.exists) return { ok: false, error: "本机还没有记住数据钥匙" };
  if (state.corrupted) return { ok: false, error: "本机数据钥匙配置已损坏" };
  if (!safeStorage.isEncryptionAvailable()) {
    return { ok: false, error: "系统加密存储不可用，无法读取数据钥匙" };
  }
  try {
    const dataKey = safeStorage.decryptString(Buffer.from(state.data.secret, "base64"));
    activeDataKey = dataKey;
    return { ok: true, dataKey };
  } catch {
    return { ok: false, error: "无法读取本机数据钥匙，请重新输入" };
  }
}

function deleteDataKeyFile() {
  const filePath = getDataKeyFilePath();
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function setRememberedDataKey(remember) {
  const shouldRemember = Boolean(remember);
  if (!shouldRemember) {
    deleteDataKeyFile();
    broadcastStatus();
    return { ok: true, status: dataKeyStatus() };
  }

  const currentDataKey = getSessionDataKey();
  if (!currentDataKey) {
    return { ok: false, error: "当前没有可记住的数据钥匙，请先保存数据钥匙" };
  }

  const persisted = writeRememberedDataKeyFile(currentDataKey);
  if (!persisted.ok) return persisted;
  activeDataKey = currentDataKey;
  broadcastStatus();
  return { ok: true, status: dataKeyStatus() };
}

function clearDataKeySecret({ forgetRemembered = true } = {}) {
  const previousDataKey = activeDataKey;
  const migration = migrateVaultOffDataKey(previousDataKey);
  if (!migration.ok) return migration;
  activeDataKey = "";
  if (forgetRemembered) deleteDataKeyFile();
  broadcastStatus();
  return { ok: true, status: dataKeyStatus(), vault: migration.vault || null, migrated: Boolean(migration.migrated) };
}

function loadRememberedDataKeyIntoSession() {
  const state = loadDataKeyFile();
  if (!state.exists || state.corrupted || !safeStorage.isEncryptionAvailable()) return;
  try {
    activeDataKey = safeStorage.decryptString(Buffer.from(state.data.secret, "base64"));
  } catch {
    activeDataKey = "";
  }
}

function readBiometricSecret() {
  const state = loadBiometricFile();
  if (!state.exists) {
    return { ok: false, error: "还没有启用 Touch ID 解锁" };
  }
  if (state.corrupted) {
    return { ok: false, error: "Touch ID 解锁配置已损坏，请重新启用" };
  }
  if (!canUseBiometricUnlock()) {
    return { ok: false, error: "当前设备或系统不支持 Touch ID 解锁" };
  }

  try {
    return {
      ok: true,
      masterPassword: safeStorage.decryptString(Buffer.from(state.data.secret, "base64")),
    };
  } catch {
    return { ok: false, error: "无法读取 Touch ID 解锁密钥，请重新启用" };
  }
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

function normalizeVersion(version) {
  return String(version ?? "").trim().replace(/^v/i, "").split("-")[0];
}

function compareVersions(currentVersion, nextVersion) {
  const currentParts = normalizeVersion(currentVersion).split(".").map((part) => Number(part) || 0);
  const nextParts = normalizeVersion(nextVersion).split(".").map((part) => Number(part) || 0);
  const length = Math.max(currentParts.length, nextParts.length);
  for (let index = 0; index < length; index += 1) {
    const current = currentParts[index] || 0;
    const next = nextParts[index] || 0;
    if (next > current) return 1;
    if (next < current) return -1;
  }
  return 0;
}

function selectReleaseAsset(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "darwin") {
    const dmgAssets = assets.filter((asset) => /\.dmg$/i.test(asset?.name || ""));
    return (
      dmgAssets.find((asset) => arch === "arm64" && /arm64/i.test(asset.name || "")) ||
      dmgAssets[0] ||
      assets.find((asset) => /\.zip$/i.test(asset?.name || ""))
    );
  }
  if (platform === "win32") {
    return assets.find((asset) => /\.exe$/i.test(asset?.name || ""));
  }
  return null;
}

async function fetchLatestRelease() {
  const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Coco-Dense-Updater",
    },
  });
  if (!response.ok) {
    return { ok: false, error: `检查更新失败：${response.status}` };
  }
  return { ok: true, release: await response.json() };
}

function normalizeReleaseInfo(release) {
  const currentVersion = app.getVersion();
  const latestVersion = String(release?.tag_name || release?.name || "").replace(/^v/i, "");
  const asset = selectReleaseAsset(release);
  return {
    currentVersion,
    latestVersion,
    updateAvailable: compareVersions(currentVersion, latestVersion) > 0,
    releaseName: release?.name || release?.tag_name || "",
    releaseUrl: release?.html_url || "https://github.com/is-coco/coco-dense/releases",
    notes: release?.body || "",
    assetName: asset?.name || "",
    assetUrl: asset?.browser_download_url || "",
    assetSize: Number(asset?.size) || 0,
    platform: process.platform,
    arch: process.arch,
  };
}

function safeDownloadName(name) {
  return String(name || "Coco-Dense-update")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, ".")
    .slice(0, 160);
}

async function downloadReleaseAsset(assetUrl, assetName, assetSize = 0, onProgress = () => {}) {
  const parsed = new URL(String(assetUrl || ""));
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com") {
    return { ok: false, error: "更新下载地址无效" };
  }
  onProgress({ stage: "connecting", downloadedBytes: 0, totalBytes: Number(assetSize) || 0 });
  const response = await fetch(parsed.href, {
    headers: {
      "User-Agent": "Coco-Dense-Updater",
    },
  });
  if (!response.ok || !response.body) {
    return { ok: false, error: `下载更新失败：${response.status}` };
  }
  const filePath = path.join(app.getPath("downloads"), safeDownloadName(assetName));
  const totalBytes = Number(response.headers.get("content-length")) || Number(assetSize) || 0;
  let downloadedBytes = 0;
  let lastProgressAt = 0;
  const startedAt = Date.now();
  const progressStream = new Transform({
    transform(chunk, _encoding, callback) {
      downloadedBytes += chunk.length;
      const now = Date.now();
      if (now - lastProgressAt > 120 || (totalBytes && downloadedBytes >= totalBytes)) {
        lastProgressAt = now;
        onProgress({
          stage: "downloading",
          downloadedBytes,
          totalBytes,
          elapsedMs: now - startedAt,
        });
      }
      callback(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(response.body), progressStream, fs.createWriteStream(filePath));
  onProgress({
    stage: "downloaded",
    downloadedBytes,
    totalBytes,
    elapsedMs: Date.now() - startedAt,
    filePath,
  });
  return { ok: true, filePath };
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
  ipcMain.handle("update:check", async () => {
    try {
      const latest = await fetchLatestRelease();
      if (!latest.ok) return latest;
      return { ok: true, ...normalizeReleaseInfo(latest.release) };
    } catch (error) {
      return { ok: false, error: error?.message || "检查更新失败" };
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
        stage: "opening",
        downloadedBytes: info.assetSize,
        totalBytes: info.assetSize,
        filePath: downloaded.filePath,
      });
      const openError = await shell.openPath(downloaded.filePath);
      if (openError) {
        shell.showItemInFolder(downloaded.filePath);
        sendDownloadProgress({
          stage: "done",
          opened: false,
          downloadedBytes: info.assetSize,
          totalBytes: info.assetSize,
          filePath: downloaded.filePath,
        });
        return { ok: true, ...info, filePath: downloaded.filePath, opened: false, error: openError };
      }
      sendDownloadProgress({
        stage: "done",
        opened: true,
        downloadedBytes: info.assetSize,
        totalBytes: info.assetSize,
        filePath: downloaded.filePath,
      });
      return { ok: true, ...info, filePath: downloaded.filePath, opened: true };
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
      const uploadResult = await writeRemoteVault(config, wrapped);
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
      let remoteWrapped = null;
      if (remoteResult.exists) {
        nextPayload = mergeVaultPayloads(localPayload, remoteResult.payload);
        remoteWrapped = encryptVaultForSave(masterPassword, nextPayload);
      } else {
        remoteWrapped = encryptVaultForSave(masterPassword, localPayload);
      }

      if (fs.existsSync(getVaultFilePath())) {
        const backupResult = createVaultBackup("before-webdav-sync");
        if (!backupResult.ok) return { ok: false, error: "自动备份失败，已取消同步" };
      }

      const uploadResult = await writeRemoteVault(config, remoteWrapped);
      if (!uploadResult.ok) return uploadResult;
      applySyncedVault(masterPassword, nextPayload, remoteWrapped);
      return {
        ok: true,
        vault: nextPayload,
        merged: remoteResult.exists,
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
    if (answerList.length !== 1 || answerList.some((item) => !normalizeRecoveryAnswer(item))) {
      return { ok: false, error: "请填写答案" };
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
      fs.writeFileSync(result.filePath, JSON.stringify(wrapped, null, 2), "utf8");
      return { ok: true, filePath: result.filePath };
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
