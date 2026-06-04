"use strict";

let _vaultCache = null;
let _activeMasterPassword = "";
let _activeDataKey = "";
let _loginWindow = null;
let _vaultWindow = null;
let _isQuitting = false;

module.exports = {
  get vaultCache() { return _vaultCache; },
  set vaultCache(v) { _vaultCache = v; },

  get activeMasterPassword() { return _activeMasterPassword; },
  set activeMasterPassword(v) { _activeMasterPassword = v; },

  get activeDataKey() { return _activeDataKey; },
  set activeDataKey(v) { _activeDataKey = v; },

  get loginWindow() { return _loginWindow; },
  set loginWindow(v) { _loginWindow = v; },

  get vaultWindow() { return _vaultWindow; },
  set vaultWindow(v) { _vaultWindow = v; },

  get isQuitting() { return _isQuitting; },
  set isQuitting(v) { _isQuitting = v; },
};
