"use strict";

const { safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const isMac = process.platform === "darwin";

function canUseBiometricUnlock() {
  return isMac && safeStorage.isEncryptionAvailable();
}

function getBiometricFilePath(app) {
  return path.join(app.getPath("userData"), "biometric.json");
}

function loadBiometricFile(app) {
  const filePath = getBiometricFilePath(app);
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

function biometricStatus(app) {
  const state = loadBiometricFile(app);
  const supported = canUseBiometricUnlock();
  return {
    supported,
    configured: supported && state.exists && !state.corrupted,
    corrupted: state.corrupted,
    updatedAt: state.exists && !state.corrupted ? state.data.updatedAt : "",
    unavailableReason: supported ? "" : "当前设备或系统不支持 Touch ID 解锁",
  };
}

function saveBiometricSecret(app, masterPassword) {
  if (!canUseBiometricUnlock()) {
    return { ok: false, error: "当前设备或系统不支持 Touch ID 解锁" };
  }
  if (!String(masterPassword ?? "").trim()) {
    return { ok: false, error: "请先输入主密码" };
  }

  const encrypted = safeStorage.encryptString(String(masterPassword ?? ""));
  const filePath = getBiometricFilePath(app);
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
  return { ok: true, status: biometricStatus(app) };
}

function deleteBiometricFile(app) {
  const filePath = getBiometricFilePath(app);
  if (!fs.existsSync(filePath)) return;
  fs.unlinkSync(filePath);
}

function readBiometricSecret(app) {
  const state = loadBiometricFile(app);
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

module.exports = {
  canUseBiometricUnlock,
  getBiometricFilePath,
  loadBiometricFile,
  biometricStatus,
  saveBiometricSecret,
  deleteBiometricFile,
  readBiometricSecret,
};
