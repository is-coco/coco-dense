"use strict";

const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

function getUpdateProxyFilePath() {
  return path.join(app.getPath("userData"), "update-proxy.json");
}

function getUpdateReminderFilePath() {
  return path.join(app.getPath("userData"), "update-reminder.json");
}

function loadUpdateProxy() {
  try {
    const filePath = getUpdateProxyFilePath();
    if (!fs.existsSync(filePath)) return "";
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return String(raw?.proxyUrl || "").trim();
  } catch {
    return "";
  }
}

function saveUpdateProxy(proxyUrl) {
  try {
    const filePath = getUpdateProxyFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ proxyUrl: String(proxyUrl || "").trim() }, null, 2), "utf8");
  } catch { /* ignore */ }
}

function loadUpdateReminder() {
  try {
    const filePath = getUpdateReminderFilePath();
    if (!fs.existsSync(filePath)) return {};
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function saveUpdateReminder(state) {
  try {
    const filePath = getUpdateReminderFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state || {}, null, 2), "utf8");
  } catch { /* ignore */ }
}

module.exports = {
  loadUpdateProxy,
  saveUpdateProxy,
  loadUpdateReminder,
  saveUpdateReminder,
};
