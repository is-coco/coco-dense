"use strict";

const { safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

function getDataKeyFilePath(app) {
  return path.join(app.getPath("userData"), "data-key.json");
}

function writeRememberedDataKeyFile(app, dataKey) {
  const value = String(dataKey ?? "").trim();
  if (!value) {
    return { ok: false, error: "当前没有可记住的数据钥匙" };
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return { ok: false, error: "系统加密存储不可用，无法在本机记住数据钥匙" };
  }

  const encrypted = safeStorage.encryptString(value);
  const filePath = getDataKeyFilePath(app);
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

function loadDataKeyFile(app) {
  const filePath = getDataKeyFilePath(app);
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

function dataKeyStatus(app, { activeDataKey, loadVaultFile, isDataKeyVault }) {
  const state = loadDataKeyFile(app);
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

function getSessionDataKey(activeDataKey, fallback = "") {
  return String(activeDataKey || fallback || "").trim();
}

function migrateVaultToDataKey(app, { activeMasterPassword, activeDataKey, vaultCache, loadVaultFile, isDataKeyVault, decryptVault, encryptJson, saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated }, nextDataKey, previousDataKey = "") {
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
      dataKey: isDataKeyVault(vaultState.data) ? getSessionDataKey(activeDataKey, previousDataKey || dataKey) : "",
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
    broadcastStatus();
    broadcastVaultUpdated(payload);
    return { ok: true, migrated: true, vault: payload };
  } catch (error) {
    return { ok: false, error: error?.message || "数据钥匙迁移失败" };
  }
}

function migrateVaultOffDataKey(app, { activeMasterPassword, activeDataKey, vaultCache, loadVaultFile, isDataKeyVault, decryptVault, encryptJson, saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated }, previousDataKey = "") {
  if (!activeMasterPassword || !vaultCache) {
    return { ok: true, migrated: false };
  }

  const vaultState = loadVaultFile();
  if (!vaultState.exists || vaultState.corrupted) {
    return { ok: true, migrated: false };
  }

  if (!isDataKeyVault(vaultState.data)) {
    return { ok: true, migrated: false };
  }

  try {
    const dataKey = getSessionDataKey(activeDataKey, previousDataKey);
    if (!dataKey) {
      return { ok: false, error: "无法解密当前保险箱，数据钥匙丢失" };
    }
    const decrypted = decryptVault(activeMasterPassword, vaultState.data, { dataKey });
    const payload = {
      ...decrypted.payload,
      updatedAt: new Date().toISOString(),
    };
    const backupResult = createVaultBackup("before-data-key-removal");
    if (!backupResult.ok) return { ok: false, error: backupResult.error || "自动备份失败，已取消" };
    const wrapped = encryptJson(activeMasterPassword, payload, {
      format: "v2",
      vaultKey: decrypted.vaultKey || undefined,
    });
    saveVaultFile(wrapped);
    broadcastStatus();
    broadcastVaultUpdated(payload);
    return { ok: true, migrated: true, vault: payload };
  } catch (error) {
    return { ok: false, error: error?.message || "移除数据钥匙失败" };
  }
}

function saveDataKeySecret(app, { activeMasterPassword, activeDataKey, vaultCache, loadVaultFile, isDataKeyVault, decryptVault, encryptJson, saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated }, dataKey, options = {}) {
  const value = String(dataKey ?? "").trim();
  if (!value) return { ok: false, error: "请输入数据钥匙" };
  if (!activeMasterPassword || !vaultCache) return { ok: false, error: "请先解锁保险箱" };

  const result = migrateVaultToDataKey(app, { activeMasterPassword, activeDataKey, vaultCache, loadVaultFile, isDataKeyVault, decryptVault, encryptJson, saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated }, value, activeDataKey);
  if (!result.ok) return result;

  if (options.remember) {
    const persisted = writeRememberedDataKeyFile(app, value);
    if (!persisted.ok) return persisted;
  }

  return { ok: true, status: dataKeyStatus(app, { activeDataKey: value, loadVaultFile, isDataKeyVault }) };
}

function readRememberedDataKey(app) {
  const state = loadDataKeyFile(app);
  if (!state.exists || state.corrupted || !safeStorage.isEncryptionAvailable()) return "";
  try {
    return safeStorage.decryptString(Buffer.from(state.data.secret, "base64"));
  } catch {
    return "";
  }
}

function deleteDataKeyFile(app) {
  const filePath = getDataKeyFilePath(app);
  if (!fs.existsSync(filePath)) return;
  fs.unlinkSync(filePath);
}

function setRememberedDataKey(app, { activeDataKey }, remember) {
  if (remember) {
    return writeRememberedDataKeyFile(app, activeDataKey);
  }
  deleteDataKeyFile(app);
  return { ok: true };
}

function clearDataKeySecret(app, { activeMasterPassword, activeDataKey, vaultCache, loadVaultFile, isDataKeyVault, decryptVault, encryptJson, saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated }, options = {}) {
  const previousDataKey = activeDataKey;
  const migration = migrateVaultOffDataKey(app, { activeMasterPassword, activeDataKey, vaultCache, loadVaultFile, isDataKeyVault, decryptVault, encryptJson, saveVaultFile, createVaultBackup, broadcastStatus, broadcastVaultUpdated }, previousDataKey);
  if (!migration.ok) return migration;
  if (options.forgetRemembered !== false) deleteDataKeyFile(app);
  return { ok: true, status: dataKeyStatus(app, { activeDataKey: "", loadVaultFile, isDataKeyVault }), vault: migration.vault || null, migrated: Boolean(migration.migrated) };
}

function loadRememberedDataKeyIntoSession(app) {
  const state = loadDataKeyFile(app);
  if (!state.exists || state.corrupted || !safeStorage.isEncryptionAvailable()) return "";
  try {
    return safeStorage.decryptString(Buffer.from(state.data.secret, "base64"));
  } catch {
    return "";
  }
}

module.exports = {
  getDataKeyFilePath,
  writeRememberedDataKeyFile,
  loadDataKeyFile,
  dataKeyStatus,
  getSessionDataKey,
  migrateVaultToDataKey,
  migrateVaultOffDataKey,
  saveDataKeySecret,
  readRememberedDataKey,
  deleteDataKeyFile,
  setRememberedDataKey,
  clearDataKeySecret,
  loadRememberedDataKeyIntoSession,
};
