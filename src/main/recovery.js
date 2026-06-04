"use strict";

const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const BACKUP_LIMIT = 10;

function getRecoveryFilePath() {
  return path.join(app.getPath("userData"), "recovery.json");
}

function getBackupDirPath() {
  return path.join(app.getPath("userData"), "backups");
}

function getVaultFilePath() {
  return path.join(app.getPath("userData"), "vault.json");
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
    } catch { /* ignore */ }
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

module.exports = {
  BACKUP_LIMIT,
  getRecoveryFilePath,
  getBackupDirPath,
  normalizeRecoveryAnswer,
  buildRecoverySecret,
  loadRecoveryFile,
  recoveryStatus,
  saveRecoveryFile,
  deleteRecoveryFile,
  trimBackups,
  createVaultBackup,
};
