const { contextBridge, clipboard, ipcRenderer } = require("electron");
const { pinyin } = require("pinyin-pro");

function toPinyinInitials(text) {
  try {
    return pinyin(String(text ?? ""), {
      pattern: "first",
      toneType: "none",
      separator: "",
    }).toLowerCase();
  } catch {
    return "";
  }
}

contextBridge.exposeInMainWorld("vault", {
  platform: process.platform,
  toPinyinInitials,
  copyText: (text) => clipboard.writeText(String(text ?? "")),
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window:toggleMaximize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  openExternal: (targetUrl) => ipcRenderer.invoke("shell:openExternal", targetUrl),
  showVault: () => ipcRenderer.invoke("window:showVault"),
  lockVault: () => ipcRenderer.invoke("window:lockVault"),
  getStatus: () => ipcRenderer.invoke("vault:getStatus"),
  getRecoveryStatus: () => ipcRenderer.invoke("vault:getRecoveryStatus"),
  getBiometricStatus: () => ipcRenderer.invoke("vault:getBiometricStatus"),
  getDataKeyStatus: () => ipcRenderer.invoke("vault:getDataKeyStatus"),
  generateDataKey: () => ipcRenderer.invoke("vault:generateDataKey"),
  saveDataKey: (dataKey, remember) => ipcRenderer.invoke("vault:saveDataKey", dataKey, remember),
  clearDataKey: () => ipcRenderer.invoke("vault:clearDataKey"),
  readDataKey: () => ipcRenderer.invoke("vault:readDataKey"),
  getSyncConfig: () => ipcRenderer.invoke("sync:getConfig"),
  saveSyncConfig: (config) => ipcRenderer.invoke("sync:saveConfig", config),
  testSyncConfig: (config) => ipcRenderer.invoke("sync:testConfig", config),
  peekSync: (masterPassword, config) => ipcRenderer.invoke("sync:peek", masterPassword, config),
  uploadSync: (masterPassword, payload, config, options) =>
    ipcRenderer.invoke("sync:upload", masterPassword, payload, config, options),
  downloadSync: (masterPassword, config) => ipcRenderer.invoke("sync:download", masterPassword, config),
  syncNow: (masterPassword, payload, config) => ipcRenderer.invoke("sync:syncNow", masterPassword, payload, config),
  unlock: (masterPassword) => ipcRenderer.invoke("vault:unlock", masterPassword),
  unlockWithBiometric: () => ipcRenderer.invoke("vault:unlockWithBiometric"),
  saveVault: (masterPassword, payload) => ipcRenderer.invoke("vault:save", masterPassword, payload),
  createBackup: (reason) => ipcRenderer.invoke("vault:createBackup", reason),
  changePassword: (currentPassword, nextPassword) =>
    ipcRenderer.invoke("vault:changePassword", currentPassword, nextPassword),
  enableBiometric: (masterPassword) => ipcRenderer.invoke("vault:enableBiometric", masterPassword),
  disableBiometric: () => ipcRenderer.invoke("vault:disableBiometric"),
  setupRecovery: (masterPassword, questions, answers) =>
    ipcRenderer.invoke("vault:setupRecovery", masterPassword, questions, answers),
  recoverWithAnswers: (answers) => ipcRenderer.invoke("vault:recoverWithAnswers", answers),
  exportVaultFile: (masterPassword, payload) => ipcRenderer.invoke("vault:exportFile", masterPassword, payload),
  importVaultFile: (masterPassword, dataKey) => ipcRenderer.invoke("vault:importFile", masterPassword, dataKey),
  onShowVault: (callback) => {
    const handler = (_event, payload) => callback?.(payload);
    ipcRenderer.on("app:showVault", handler);
    return () => ipcRenderer.removeListener("app:showVault", handler);
  },
  onStatus: (callback) => {
    const handler = (_event, status) => callback?.(status);
    ipcRenderer.on("app:status", handler);
    return () => ipcRenderer.removeListener("app:status", handler);
  },
  onClearAuth: (callback) => {
    const handler = () => callback?.();
    ipcRenderer.on("app:clearAuth", handler);
    return () => ipcRenderer.removeListener("app:clearAuth", handler);
  },
});
