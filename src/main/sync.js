"use strict";

const { safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);
const REMOTE_WRITE_VERIFY_ATTEMPTS = 6;
const REMOTE_WRITE_VERIFY_DELAY_MS = 700;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeSyncConfigFilePath(app) {
  return path.join(app.getPath("userData"), "sync.json");
}

function loadSyncConfig(app, { includePassword = false } = {}) {
  const filePath = normalizeSyncConfigFilePath(app);
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

function saveSyncConfig(app, config) {
  const filePath = normalizeSyncConfigFilePath(app);
  let previous = {};
  if (fs.existsSync(filePath)) {
    try {
      previous = JSON.parse(fs.readFileSync(filePath, "utf8"));
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
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
  return { ok: true, config: loadSyncConfig(app) };
}

function touchSyncLastSyncedAt(app, config, timestamp = new Date().toISOString()) {
  const filePath = normalizeSyncConfigFilePath(app);
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

function touchSyncLastCheckedAt(app, config, timestamp = new Date().toISOString()) {
  const filePath = normalizeSyncConfigFilePath(app);
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
  const base = String(config.serverUrl ?? "").replace(/\/+$/, "");
  const file = String(remotePath ?? "").replace(/^\/+/, "");
  return `${base}/${file}`;
}

function webdavAuthHeader(config) {
  const credentials = Buffer.from(`${config.username}:${config.appPassword}`).toString("base64");
  return `Basic ${credentials}`;
}

async function webdavRequest(config, method, remotePath, options = {}) {
  const url = buildWebdavUrl(config, remotePath || config.remotePath);
  const headers = {
    Authorization: webdavAuthHeader(config),
    ...(options.headers || {}),
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body || undefined,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function webdavStatusError(status, fallback) {
  if (status === 401) return "WebDAV 认证失败，请检查用户名和应用密码";
  if (status === 404) return "远端文件或目录不存在";
  if (status === 409) return "远端目录冲突，正在尝试自动创建";
  if (status >= 500) return `服务器错误 (${status})`;
  return fallback || `请求失败 (${status})`;
}

function getRemoteDirPath(remotePath) {
  const normalized = normalizeRemotePath(remotePath);
  const parts = normalized.split("/");
  parts.pop();
  return parts.join("/") || "/";
}

async function ensureWebdavDirectory(config) {
  const dirPath = getRemoteDirPath(config.remotePath);
  const mkcolResponse = await webdavRequest(config, "MKCOL", dirPath);
  if (mkcolResponse.ok || mkcolResponse.status === 405) {
    return { ok: true };
  }
  return { ok: false, error: webdavStatusError(mkcolResponse.status, "无法创建远端目录") };
}

function comparableEntryTime(entry) {
  return Date.parse(entry?.updatedAt || entry?.lastUsedAt || "") || 0;
}

function mergeVaultPayloads(localPayload, remotePayload) {
  const remoteEntries = Array.isArray(remotePayload?.entries) ? remotePayload.entries : [];
  const localEntries = Array.isArray(localPayload?.entries) ? localPayload.entries : [];

  const remoteMap = new Map();
  remoteEntries.forEach((entry) => {
    if (entry?.id) remoteMap.set(entry.id, entry);
  });

  const mergedMap = new Map();
  localEntries.forEach((entry) => {
    if (!entry?.id) return;
    const remote = remoteMap.get(entry.id);
    if (!remote) {
      mergedMap.set(entry.id, entry);
      return;
    }
    const localTime = comparableEntryTime(entry);
    const remoteTime = comparableEntryTime(remote);
    if (localTime >= remoteTime) {
      mergedMap.set(entry.id, entry);
    } else {
      mergedMap.set(entry.id, remote);
    }
  });

  remoteEntries.forEach((entry) => {
    if (entry?.id && !mergedMap.has(entry.id)) {
      mergedMap.set(entry.id, entry);
    }
  });

  const mergedEntries = [...mergedMap.values()];
  const conflicts = mergedEntries.length - localEntries.length;
  const mergedSettings = remotePayload?.settings || localPayload?.settings || {};

  return {
    payload: {
      version: localPayload?.version || 1,
      createdAt: localPayload?.createdAt || remotePayload?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries: mergedEntries,
      settings: mergedSettings,
    },
    conflicts,
  };
}

function payloadUpdatedTime(payload) {
  return Date.parse(payload?.updatedAt || "") || 0;
}

function resolveSyncConfig(app, candidate = {}) {
  const stored = loadSyncConfig(app, { includePassword: true });
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

async function readRemoteVault(config, masterPassword, { decryptVault, encryptJson, isDataKeyVault, activeDataKey }) {
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
  const crypto = require("node:crypto");
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

async function writeRemoteVault(config, wrapped, options = {}) {
  const app = options.app;
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
        const ts = app ? touchSyncLastSyncedAt(app, config) : new Date().toISOString();
        return { ok: true, lastSyncedAt: ts };
      }
    } catch { /* ignore */ }
  }

  return {
    ok: false,
    error: "上传后未能确认云端文件已更新，请稍后重试",
  };
}

module.exports = {
  ALLOWED_EXTERNAL_PROTOCOLS,
  REMOTE_WRITE_VERIFY_ATTEMPTS,
  REMOTE_WRITE_VERIFY_DELAY_MS,
  sleep,
  normalizeRemotePath,
  normalizeAppPassword,
  normalizeServerUrl,
  encryptLocalSecret,
  decryptLocalSecret,
  loadSyncConfig,
  saveSyncConfig,
  touchSyncLastSyncedAt,
  touchSyncLastCheckedAt,
  buildWebdavUrl,
  webdavAuthHeader,
  webdavRequest,
  webdavStatusError,
  getRemoteDirPath,
  ensureWebdavDirectory,
  comparableEntryTime,
  mergeVaultPayloads,
  payloadUpdatedTime,
  resolveSyncConfig,
  validateSyncConfig,
  readRemoteVault,
  writeRemoteVault,
  stableStringify,
  stableJsonHash,
};
