const crypto = require("node:crypto");

const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const PBKDF2_ROUNDS = 250000;
const VAULT_FORMAT_V2 = "coco-dense-envelope-v2";
const VAULT_FORMAT_V3 = "coco-dense-envelope-v3";

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
    const dataKey = String(options.dataKey ?? "").trim();
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

function generateDataKeySecret() {
  return crypto.randomBytes(32).toString("base64url");
}

module.exports = {
  IV_LENGTH,
  KEY_LENGTH,
  SALT_LENGTH,
  PBKDF2_ROUNDS,
  VAULT_FORMAT_V2,
  VAULT_FORMAT_V3,
  deriveKey,
  encryptLegacyJson,
  decryptLegacyJson,
  encryptBufferWithPassword,
  decryptBufferWithPassword,
  encryptWithVaultKey,
  decryptWithVaultKey,
  isEnvelopeVault,
  isDataKeyVault,
  makeUnlockError,
  encryptJson,
  verifyDataKeyVaultMaster,
  decryptVault,
  decryptJson,
  encryptText,
  decryptText,
  generateDataKeySecret,
};
