const authScreen = document.getElementById("authScreen");
const vaultScreen = document.getElementById("vaultScreen");
const unlockForm = document.getElementById("unlockForm");
const togglePassword = document.getElementById("togglePassword");
const masterPassword = document.getElementById("masterPassword");
const bioBtn = document.getElementById("bioBtn");
const biometricUnlockBtn = document.getElementById("biometricUnlockBtn");
const toast = document.getElementById("toast");
const newEntryBtn = document.getElementById("newEntryBtn");
const lockBtn = document.getElementById("lockBtn");
const searchInput = document.getElementById("searchInput");
const vaultList = document.getElementById("vaultList");
const emptyState = document.getElementById("emptyState");
const siteInput = document.getElementById("siteInput");
const accountInput = document.getElementById("accountInput");
const entryPasswordInput = document.getElementById("entryPasswordInput");
const toggleEntryPassword = document.getElementById("toggleEntryPassword");
const urlInput = document.getElementById("urlInput");
const tagsInput = document.getElementById("tagsInput");
const tagPreview = document.getElementById("tagPreview");
const tagSuggestions = document.getElementById("tagSuggestions");
const existingTagOptions = document.getElementById("existingTagOptions");
const tagFilterSelect = document.getElementById("tagFilterSelect");
const priorityFilterSelect = document.getElementById("priorityFilterSelect");
const notesInput = document.getElementById("notesInput");
const editEntryBtn = document.getElementById("editEntryBtn");
const favoriteEntryBtn = document.getElementById("favoriteEntryBtn");
const openUrlBtn = document.getElementById("openUrlBtn");
const generatePasswordBtn = document.getElementById("generatePasswordBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const deleteEntryBtn = document.getElementById("deleteEntryBtn");
const content = document.querySelector(".content");
const sidebar = document.querySelector(".sidebar");
const settingsBtn = document.getElementById("settingsBtn");
const topSyncStatus = document.getElementById("topSyncStatus");
const topSyncText = document.getElementById("topSyncText");
const lastUpdateText = document.getElementById("lastUpdateText");
const readView = document.getElementById("readView");
const editView = document.getElementById("editView");
const emptyDetailState = document.getElementById("emptyDetailState");
const settingsView = document.getElementById("settingsView");
const settingsNav = document.getElementById("settingsNav");
const settingsSectionTitle = document.getElementById("settingsSectionTitle");
const settingsSectionHint = document.getElementById("settingsSectionHint");
const detailModeLabel = document.getElementById("detailModeLabel");
const entryContextMenu = document.getElementById("entryContextMenu");
const folderContextMenu = document.getElementById("folderContextMenu");
const sidebarContextMenu = document.getElementById("sidebarContextMenu");
const entryFolderMoveList = document.getElementById("entryFolderMoveList");
const siteValue = document.getElementById("siteValue");
const urlValue = document.getElementById("urlValue");
const accountValue = document.getElementById("accountValue");
const passwordValue = document.getElementById("passwordValue");
const toggleReadPassword = document.getElementById("toggleReadPassword");
const notesValue = document.getElementById("notesValue");
const readTags = document.getElementById("readTags");
const syncText = document.getElementById("syncText");
const footerStatusDot = document.querySelector(".sync-status .status-dot");
const syncBtn = document.getElementById("syncBtn");
const importVaultBtn = document.getElementById("importVaultBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const entryPasswordStrength = document.getElementById("entryPasswordStrength");
const priorityPicker = document.getElementById("priorityPicker");
const pinnedToggle = document.getElementById("pinnedToggle");
const autoLockMinutes = document.getElementById("autoLockMinutes");
const clipboardClearSeconds = document.getElementById("clipboardClearSeconds");
const cloudCheckMinutes = document.getElementById("cloudCheckMinutes");
const passwordLengthSetting = document.getElementById("passwordLengthSetting");
const copyConfirmSetting = document.getElementById("copyConfirmSetting");
const welcomeSetting = document.getElementById("welcomeSetting");
const backupExportSetting = document.getElementById("backupExportSetting");
const clearAllEntriesBtn = document.getElementById("clearAllEntriesBtn");
const changePasswordModal = document.getElementById("changePasswordModal");
const changePasswordForm = document.getElementById("changePasswordForm");
const currentMasterPassword = document.getElementById("currentMasterPassword");
const nextMasterPassword = document.getElementById("nextMasterPassword");
const confirmMasterPassword = document.getElementById("confirmMasterPassword");
const changePasswordError = document.getElementById("changePasswordError");
const closePasswordModalBtn = document.getElementById("closePasswordModalBtn");
const cancelPasswordChangeBtn = document.getElementById("cancelPasswordChangeBtn");
const submitPasswordChangeBtn = document.getElementById("submitPasswordChangeBtn");
const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordHelper = document.getElementById("forgotPasswordHelper");
const forgotPasswordUnavailable = document.getElementById("forgotPasswordUnavailable");
const forgotQuestion1 = document.getElementById("forgotQuestion1");
const forgotAnswer1 = document.getElementById("forgotAnswer1");
const forgotAnswerField = document.getElementById("forgotAnswerField");
const forgotDataKeyField = document.getElementById("forgotDataKeyField");
const forgotDataKeyInput = document.getElementById("forgotDataKeyInput");
const forgotPasswordError = document.getElementById("forgotPasswordError");
const closeForgotPasswordBtn = document.getElementById("closeForgotPasswordBtn");
const cancelForgotPasswordBtn = document.getElementById("cancelForgotPasswordBtn");
const submitForgotPasswordBtn = document.getElementById("submitForgotPasswordBtn");
const recoveryStatusText = document.getElementById("recoveryStatusText");
const recoveryStatusPill = document.getElementById("recoveryStatusPill");
const biometricStatusText = document.getElementById("biometricStatusText");
const biometricStatusPill = document.getElementById("biometricStatusPill");
const biometricToggleBtn = document.getElementById("biometricToggleBtn");
const dataKeyStatusText = document.getElementById("dataKeyStatusText");
const dataKeyStatusPill = document.getElementById("dataKeyStatusPill");
const dataKeyInput = document.getElementById("dataKeyInput");
const rememberDataKeySetting = document.getElementById("rememberDataKeySetting");
const generateDataKeyBtn = document.getElementById("generateDataKeyBtn");
const saveDataKeyBtn = document.getElementById("saveDataKeyBtn");
const clearDataKeyBtn = document.getElementById("clearDataKeyBtn");
const webdavStatusText = document.getElementById("webdavStatusText");
const webdavStatusPill = document.getElementById("webdavStatusPill");
const webdavServerUrl = document.getElementById("webdavServerUrl");
const webdavUsername = document.getElementById("webdavUsername");
const webdavAppPassword = document.getElementById("webdavAppPassword");
const webdavRemotePath = document.getElementById("webdavRemotePath");
const saveWebdavBtn = document.getElementById("saveWebdavBtn");
const testWebdavBtn = document.getElementById("testWebdavBtn");
const uploadWebdavBtn = document.getElementById("uploadWebdavBtn");
const downloadWebdavBtn = document.getElementById("downloadWebdavBtn");
const mergeWebdavBtn = document.getElementById("mergeWebdavBtn");
const updateStatusText = document.getElementById("updateStatusText");
const updateStatusPill = document.getElementById("updateStatusPill");
const currentVersionText = document.getElementById("currentVersionText");
const latestVersionText = document.getElementById("latestVersionText");
const updateAssetText = document.getElementById("updateAssetText");
const updateNotesPanel = document.getElementById("updateNotesPanel");
const updateNotesVersion = document.getElementById("updateNotesVersion");
const updateNotesBody = document.getElementById("updateNotesBody");
const updateProgressPanel = document.getElementById("updateProgressPanel");
const updateProgressPercent = document.getElementById("updateProgressPercent");
const updateProgressMeta = document.getElementById("updateProgressMeta");
const updateProgressTrack = updateProgressPanel?.querySelector(".update-progress-track");
const updateProgressBar = document.getElementById("updateProgressBar");
const updateProgressFile = document.getElementById("updateProgressFile");
const checkUpdateBtn = document.getElementById("checkUpdateBtn");
const downloadUpdateBtn = document.getElementById("downloadUpdateBtn");
const openReleaseBtn = document.getElementById("openReleaseBtn");
const openRecoverySettingsBtn = document.getElementById("openRecoverySettingsBtn");
const recoverySettingsModal = document.getElementById("recoverySettingsModal");
const recoverySettingsForm = document.getElementById("recoverySettingsForm");
const recoverySettingsError = document.getElementById("recoverySettingsError");
const closeRecoverySettingsBtn = document.getElementById("closeRecoverySettingsBtn");
const cancelRecoverySettingsBtn = document.getElementById("cancelRecoverySettingsBtn");
const recoveryQuestion1 = document.getElementById("recoveryQuestion1");
const recoveryAnswer1 = document.getElementById("recoveryAnswer1");
const saveRecoveryBtn = document.getElementById("saveRecoveryBtn");
const clearRecoveryAnswersBtn = document.getElementById("clearRecoveryAnswersBtn");
const unlockPrimaryBtn = unlockForm.querySelector(".primary-btn");
const authHelper = unlockForm.querySelector(".helper");
const closeWindowBtn = document.getElementById("closeWindowBtn");
const minimizeWindowBtn = document.getElementById("minimizeWindowBtn");
const maximizeWindowBtn = document.getElementById("maximizeWindowBtn");

document.body.classList.toggle("native-window-controls", window.vault?.platform === "darwin");

if (favoriteEntryBtn) {
  favoriteEntryBtn.remove();
}

const favoriteContextButton = entryContextMenu?.querySelector('[data-menu-action="toggle-favorite"]');
const favoriteContextSeparator = favoriteContextButton?.nextElementSibling?.classList.contains("menu-separator")
  ? favoriteContextButton.nextElementSibling
  : null;
favoriteContextButton?.remove();
favoriteContextSeparator?.remove();

const PRIORITY_ORDER = {
  red: 4,
  yellow: 3,
  blue: 2,
  green: 1,
};

const SECRET_MASK = "●●●●●●●●";

const SETTINGS_SECTIONS = {
  security: {
    title: "安全",
    hint: "主密码、解锁和恢复。",
  },
  "data-key": {
    title: "数据钥匙",
    hint: "独立加密钥匙。",
  },
  sync: {
    title: "云同步",
    hint: "WebDAV、上传和下载。",
  },
  general: {
    title: "通用",
    hint: "编辑和显示习惯。",
  },
  update: {
    title: "更新",
    hint: "检查和下载新版本。",
  },
  backup: {
    title: "备份",
    hint: "导出和清理。",
  },
};

const state = {
  entries: [],
  activeId: "",
  unlocked: false,
  editing: false,
  detailMode: "welcome",
  settingsSection: "general",
  editTags: [],
  pendingActions: {},
  readPasswordVisible: false,
  masterPassword: "",
  vaultMeta: null,
  settings: {
    autoLockMinutes: 5,
    clipboardClearSeconds: 30,
    cloudCheckMinutes: 5,
    passwordLength: 18,
    copyConfirm: true,
    welcomeOnStart: true,
    backupBeforeExport: true,
    folders: [],
  },
  folderUi: loadFolderUiState(),
  folderToggleAt: {},
  autoLockTimer: null,
  clipboardTimer: null,
  cloudCheckTimer: null,
  cloudCheckBusy: false,
  syncBusy: false,
  unlockSyncJob: null,
  persistJob: null,
  persistQueuedPayload: null,
  cloudSyncJob: null,
  cloudSyncQueuedPayload: null,
  syncError: "",
  pendingCloudUpdate: false,
  pendingCloudPayload: null,
  pendingCloudUpdatedAt: 0,
  hasVaultFile: false,
  vaultCorrupted: false,
  lockedUntil: 0,
  activeFilter: "全部",
  activeTagFilter: "",
  activePriorityFilter: "",
  activePriority: "green",
  tagInputFocused: false,
  contextEntryId: "",
  contextFolderId: "",
  renamingEntryId: "",
  renamingFolderId: "",
  recoveryStatus: {
    configured: false,
    corrupted: false,
    questions: [],
    updatedAt: "",
  },
  biometricStatus: {
    supported: false,
    configured: false,
    corrupted: false,
    updatedAt: "",
    unavailableReason: "",
  },
  dataKeyStatus: {
    supported: false,
    remembered: false,
    sessionActive: false,
    corrupted: false,
    updatedAt: "",
    unavailableReason: "",
  },
  syncConfig: {
    configured: false,
    corrupted: false,
    serverUrl: "",
    username: "",
    remotePath: "/CocoDense/vault.json",
    updatedAt: "",
    lastSyncedAt: "",
  },
  appInfo: {
    version: "",
    platform: "",
    arch: "",
  },
  updateInfo: null,
  updateDownloadProgress: null,
};

function normalizePriority(priority) {
  const value = String(priority ?? "").trim().toLowerCase();
  if (Object.hasOwn(PRIORITY_ORDER, value)) return value;
  const alias = {
    "红色": "red",
    "黄色": "yellow",
    "蓝色": "blue",
    "绿色": "green",
    high: "red",
    medium: "yellow",
    mid: "yellow",
    normal: "blue",
    low: "green",
    1: "red",
    2: "yellow",
    3: "blue",
    4: "green",
  };
  return alias[value] || "green";
}

function buildSearchIndex(entry) {
  const parts = [entry.site, entry.account, entry.url, entry.tags, entry.notes].filter(Boolean);
  const baseText = parts.join(" ").toLowerCase();
  const initials = window.vault?.toPinyinInitials?.(parts.join(" ")) || "";
  return `${baseText} ${initials}`.trim();
}

function getAllTags(entries = getVisibleEntries()) {
  const tags = new Set();
  entries.forEach((entry) => {
    parseTags(entry.tags).forEach((tag) => tags.add(tag));
  });
  return [...tags].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function formatEntryTagLine(value) {
  const tags = parseTags(value);
  return tags.length ? tags.join(" · ") : "无标签";
}

function getSuggestedTags(keyword = "") {
  const query = keyword.trim().toLowerCase();
  const queryInitials = window.vault?.toPinyinInitials?.(keyword.trim()) || "";
  return getAllTags().filter((tag) => {
    if (state.editTags.includes(tag)) return false;
    if (!query) return true;
    const lowerTag = tag.toLowerCase();
    const initials = window.vault?.toPinyinInitials?.(tag) || "";
    return lowerTag.includes(query) || (queryInitials && initials.includes(queryInitials));
  });
}

function syncSidebarFilters() {
  const tags = getAllTags();

  if (tagFilterSelect) {
    if (state.activeTagFilter && !tags.includes(state.activeTagFilter)) {
      state.activeTagFilter = "";
    }
    tagFilterSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "全部标签";
    tagFilterSelect.appendChild(defaultOption);
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagFilterSelect.appendChild(option);
    });
    tagFilterSelect.value = state.activeTagFilter;
  }

  if (priorityFilterSelect) {
    priorityFilterSelect.value = state.activePriorityFilter;
  }

  if (existingTagOptions) {
    existingTagOptions.innerHTML = "";
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      existingTagOptions.appendChild(option);
    });
  }
}

function renderTagSuggestions() {
  if (!tagSuggestions) return;
  const shouldShow = state.tagInputFocused || Boolean(tagsInput?.value.trim());
  if (!shouldShow) {
    tagSuggestions.innerHTML = "";
    tagSuggestions.classList.add("hidden");
    return;
  }

  const suggestions = getSuggestedTags(tagsInput?.value || "").slice(0, 8);
  tagSuggestions.innerHTML = "";
  tagSuggestions.classList.toggle("hidden", suggestions.length === 0);
  suggestions.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-suggestion";
    button.dataset.tagSuggestion = tag;
    button.textContent = tag;
    tagSuggestions.appendChild(button);
  });
}

function normalizeSettings(settings = {}) {
  const autoLockMinutesValue = Number(settings.autoLockMinutes);
  const clipboardSecondsValue = Number(settings.clipboardClearSeconds);
  const cloudCheckMinutesValue = Number(settings.cloudCheckMinutes);
  const passwordLengthValue = Number(settings.passwordLength);
  const seenFolders = new Set();
  const folders = Array.isArray(settings.folders)
    ? settings.folders
      .map((folder) => ({
        id: String(folder?.id || "").trim(),
        name: String(folder?.name || "").trim(),
        priority: normalizePriority(folder?.priority),
      }))
      .filter((folder) => {
        if (!folder.id || !folder.name || seenFolders.has(folder.id)) return false;
        seenFolders.add(folder.id);
        return true;
      })
    : [];
  return {
    autoLockMinutes: Number.isFinite(autoLockMinutesValue) ? autoLockMinutesValue : 5,
    clipboardClearSeconds: Number.isFinite(clipboardSecondsValue) ? clipboardSecondsValue : 30,
    cloudCheckMinutes: Number.isFinite(cloudCheckMinutesValue) ? Math.min(240, Math.max(1, cloudCheckMinutesValue)) : 5,
    passwordLength: Math.min(40, Math.max(8, Number.isFinite(passwordLengthValue) ? passwordLengthValue : 18)),
    copyConfirm: settings.copyConfirm !== false,
    welcomeOnStart: settings.welcomeOnStart !== false,
    backupBeforeExport: settings.backupBeforeExport !== false,
    folders,
  };
}

function normalizeEntry(entry) {
  const priority = normalizePriority(entry?.priority ?? entry?.priorityColor ?? entry?.priorityLevel ?? entry?.colorLevel);
  return {
    id: entry?.id || makeId(entry?.site || "entry"),
    site: entry?.site || "",
    account: entry?.account || "",
    password: entry?.password || "",
    url: entry?.url || "",
    tags: entry?.tags || "",
    notes: entry?.notes || "",
    folderId: String(entry?.folderId || ""),
    favorite: Boolean(entry?.favorite),
    pinned: Boolean(entry?.pinned),
    priority,
    createdAt: entry?.createdAt || entry?.lastUsedAt || "",
    updatedAt: entry?.updatedAt || entry?.lastUsedAt || "",
    deletedAt: entry?.deletedAt || "",
    lastUsedAt: entry?.lastUsedAt || "",
    status: entry?.status || "已同步",
  };
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function setSecretMask(input) {
  if (!input) return;
  input.value = SECRET_MASK;
  input.dataset.secretMasked = "true";
}

function clearSecretMask(input) {
  if (!input || input.dataset.secretMasked !== "true") return;
  input.value = "";
  delete input.dataset.secretMasked;
}

function getSecretInputValue(input) {
  if (!input || input.dataset.secretMasked === "true") return "";
  return input.value.trim();
}

function updateUnlockCooldown(lockedUntil) {
  state.lockedUntil = Number(lockedUntil || 0);
  const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
  if (remaining > 0) {
    unlockPrimaryBtn.disabled = true;
    unlockPrimaryBtn.textContent = `${remaining} 秒后重试`;
    authHelper.textContent = "主密码错误次数过多，请稍等再试。";
    clearTimeout(window.unlockCooldownTimer);
    window.unlockCooldownTimer = setTimeout(() => updateUnlockCooldown(state.lockedUntil), 1000);
    return;
  }

  clearTimeout(window.unlockCooldownTimer);
  unlockPrimaryBtn.disabled = false;
  if (!state.vaultCorrupted) {
    unlockPrimaryBtn.textContent = state.hasVaultFile ? "解锁" : "创建保险箱";
  }
}

function clearClipboardLater() {
  scheduleClipboardClear();
}

function clearSensitiveInputs() {
  masterPassword.value = "";
  if (dataKeyInput) {
    clearSecretMask(dataKeyInput);
    dataKeyInput.value = "";
  }
  currentMasterPassword.value = "";
  nextMasterPassword.value = "";
  confirmMasterPassword.value = "";
  entryPasswordInput.value = "";
  forgotAnswer1.value = "";
  if (forgotDataKeyInput) forgotDataKeyInput.value = "";
  recoveryAnswer1.value = "";
  masterPassword.type = "password";
  entryPasswordInput.type = "password";
  togglePassword.setAttribute("aria-pressed", "false");
  toggleEntryPassword.setAttribute("aria-pressed", "false");
  togglePassword.querySelector(".toggle-icon-show")?.classList.remove("hidden");
  togglePassword.querySelector(".toggle-icon-hide")?.classList.add("hidden");
  toggleEntryPassword.querySelector(".toggle-icon-show")?.classList.remove("hidden");
  toggleEntryPassword.querySelector(".toggle-icon-hide")?.classList.add("hidden");
  syncPasswordStrength();
}

function setActiveEntry(id) {
  state.activeId = id;
  state.readPasswordVisible = false;
  renderEntries();
  fillForm(getActiveEntry());
  setDetailMode("read");
}

function getActiveEntry() {
  if (!state.activeId) return null;
  return state.entries.find((entry) => entry.id === state.activeId && !entry.deletedAt) ?? null;
}

function getVisibleEntries() {
  return state.entries.filter((entry) => !entry.deletedAt);
}

function copyToClipboard(text, successMessage) {
  const value = String(text ?? "");
  if (window.vault?.copyText) {
    try {
      const result = window.vault.copyText(value);
      if (result?.then) {
        return result
          .then(() => {
            showToast(successMessage);
            clearClipboardLater();
          })
          .catch(() => showToast("复制失败"));
      }
      showToast(successMessage);
      clearClipboardLater();
      return Promise.resolve(true);
    } catch {
      showToast("复制失败");
      return Promise.resolve(false);
    }
  }
  return navigator.clipboard
    .writeText(value)
    .then(() => {
      showToast(successMessage);
      clearClipboardLater();
    })
    .catch(() => showToast("复制失败"));
}

async function handlePrimaryAction() {
  if (state.editing) {
    newEntryBtn.disabled = true;
    newEntryBtn.textContent = "保存中";
    try {
      await upsertEntry();
    } finally {
      newEntryBtn.disabled = false;
      syncPrimaryActionButton();
    }
    return;
  }

  if (isSettingsOpen()) {
    closeSettingsView();
    return;
  }

  clearForm();
  setEditing(true);
  showToast("新建模式");
  touchActivity();
}

function clearPendingAction(actionKey) {
  const pending = state.pendingActions[actionKey];
  if (!pending) return;
  clearTimeout(pending.timeoutId);
  clearInterval(pending.intervalId);
  delete state.pendingActions[actionKey];
}

function confirmWithin(actionKey, firstMessage, onConfirm, windowMs = 3000) {
  const now = Date.now();
  const pending = state.pendingActions[actionKey];
  if (pending && pending.expiresAt > now) {
    clearPendingAction(actionKey);
    onConfirm();
    return;
  }

  clearPendingAction(actionKey);
  const expiresAt = now + windowMs;
  const renderCountdownToast = () => {
    const remaining = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
    showToast(`${firstMessage}（${remaining}）`);
  };

  renderCountdownToast();
  const intervalId = setInterval(() => {
    if (Date.now() >= expiresAt) {
      clearPendingAction(actionKey);
      return;
    }
    renderCountdownToast();
  }, 1000);
  const timeoutId = setTimeout(() => clearPendingAction(actionKey), windowMs);
  state.pendingActions[actionKey] = {
    expiresAt,
    intervalId,
    timeoutId,
  };
}

function makeId(site) {
  return `${site || "entry"}-${Date.now().toString(36)}`;
}

function getVaultPayload(options = {}) {
  const shouldTouchUpdatedAt = options.touchUpdatedAt !== false;
  return {
    version: 1,
    createdAt: state.vaultMeta?.createdAt || new Date().toISOString(),
    updatedAt: shouldTouchUpdatedAt
      ? new Date().toISOString()
      : state.vaultMeta?.updatedAt || new Date().toISOString(),
    entries: state.entries,
    settings: state.settings,
  };
}

function snapshotVaultPayload(payload = getVaultPayload()) {
  try {
    return structuredClone(payload);
  } catch {
    return JSON.parse(JSON.stringify(payload));
  }
}

function touchActivity() {
  if (!state.unlocked) return;
  clearTimeout(state.autoLockTimer);
  const autoLockMs = Number(state.settings.autoLockMinutes) * 60000;
  if (!autoLockMs) return;
  state.autoLockTimer = setTimeout(() => {
    if (state.unlocked) {
      lockVaultSilently();
    }
  }, autoLockMs);
}

function lockVaultSilently() {
  clearTimeout(state.autoLockTimer);
  clearTimeout(state.clipboardTimer);
  clearCloudSyncTimer();
  state.cloudCheckBusy = false;
  state.syncBusy = false;
  state.syncError = "";
  if (window.vault?.copyText) {
    window.vault.copyText("");
  } else {
    navigator.clipboard?.writeText("");
  }
  state.unlocked = false;
  state.masterPassword = "";
  state.entries = [];
  state.activeId = "";
  state.editTags = [];
  state.vaultMeta = null;
  state.readPasswordVisible = false;
  resetDetailSurface();
  closeChangePasswordModal();
  changePasswordError.textContent = "";
  searchInput.value = "";
  renderEntries();
  clearForm();
  clearSensitiveInputs();
  syncEmptyDetailState();
  document.body.classList.add("auth-mode");
  vaultScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
  window.vault?.lockVault?.();
  refreshStatusText();
}

function scheduleClipboardClear() {
  clearTimeout(state.clipboardTimer);
  const clearMs = Number(state.settings.clipboardClearSeconds) * 1000;
  if (!clearMs) return;
  state.clipboardTimer = setTimeout(() => {
    if (window.vault?.copyText) {
      window.vault.copyText("");
    } else {
      navigator.clipboard?.writeText("");
    }
  }, clearMs);
}

function syncPriorityPicker() {
  priorityPicker?.querySelectorAll(".priority-choice").forEach((button) => {
    const active = button.dataset.priority === state.activePriority;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function syncPinnedToggle() {
  const entry = getActiveEntry();
  const pinned = Boolean(entry?.pinned);
  pinnedToggle?.setAttribute("aria-pressed", String(pinned));
  if (pinnedToggle) {
    pinnedToggle.querySelector("span:last-child").textContent = pinned ? "已置顶" : "不置顶";
  }
}

function syncPrimaryActionButton() {
  newEntryBtn.textContent = isSettingsOpen() ? "返回" : state.editing ? "保存" : "新增";
}

function formatStatusTime(label, value) {
  if (!value) return `${label}：--`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `${label}：--`;
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  const options = sameYear
    ? { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
  return `${label}：${date.toLocaleString("zh-CN", options)}`;
}

function isLocalVaultNewerThanSync() {
  if (!state.syncConfig?.configured) return false;
  const localTime = Date.parse(state.vaultMeta?.updatedAt || "") || 0;
  const syncedTime = Date.parse(state.syncConfig?.lastSyncedAt || "") || 0;
  return Boolean(localTime && localTime > syncedTime);
}

function getSyncStatusMeta() {
  if (state.vaultCorrupted) {
    return { state: "error", label: "保险箱异常" };
  }
  if (state.syncConfig?.corrupted) {
    return { state: "error", label: "同步配置异常" };
  }
  if (state.syncBusy || state.cloudCheckBusy || state.cloudSyncJob) {
    return { state: "warn", label: "同步中" };
  }
  if (state.syncError) {
    return { state: "error", label: state.syncError };
  }
  if (!state.unlocked) {
    return { state: "warn", label: "未解锁" };
  }
  if (!state.syncConfig?.configured) {
    return { state: "warn", label: "未配置同步" };
  }
  if (state.pendingCloudUpdate) {
    return { state: "warn", label: "云端有更新" };
  }
  if (isLocalVaultNewerThanSync()) {
    return { state: "warn", label: "待同步" };
  }
  return { state: "ok", label: "已同步" };
}

function syncTopSyncStatus() {
  const meta = getSyncStatusMeta();
  topSyncStatus?.setAttribute("data-sync-state", meta.state);
  topSyncStatus?.classList.toggle("sync-pill-ok", meta.state === "ok");
  topSyncStatus?.classList.toggle("sync-pill-warn", meta.state === "warn");
  topSyncStatus?.classList.toggle("sync-pill-error", meta.state === "error");
  footerStatusDot?.classList.toggle("status-dot-ok", meta.state === "ok");
  footerStatusDot?.classList.toggle("status-dot-warn", meta.state === "warn");
  footerStatusDot?.classList.toggle("status-dot-error", meta.state === "error");
  if (topSyncText) topSyncText.textContent = meta.label;
  if (lastUpdateText) {
    lastUpdateText.textContent = state.syncConfig?.configured
      ? formatStatusTime("上次同步", state.syncConfig?.lastSyncedAt)
      : formatStatusTime("本地更新", state.vaultMeta?.updatedAt);
  }
}

function setSyncBusy(isBusy) {
  state.syncBusy = Boolean(isBusy);
  refreshStatusText();
}

function clearSyncError() {
  state.syncError = "";
  refreshStatusText();
}

function setSyncError(message = "同步失败") {
  state.syncError = message;
  refreshStatusText();
}

function showDataKeySyncPrompt(result, options = {}) {
  if (!result?.needsDataKey) return false;
  const message = result.error || "同步需要数据钥匙，请到设置的数据钥匙页面输入后再试";
  setSyncError(message);
  showToast(message);
  if (options.openSettings) {
    openSettingsView();
    setSettingsSection("data-key");
    requestAnimationFrame(() => dataKeyInput?.focus({ preventScroll: true }));
  }
  return true;
}

function markSyncSucceeded(result = {}) {
  const lastSyncedAt = result.lastSyncedAt || new Date().toISOString();
  state.syncConfig = {
    ...state.syncConfig,
    lastSyncedAt,
  };
  clearSyncError();
}

function latestTimestampValue(currentValue, nextValue) {
  const currentTime = Date.parse(currentValue || "") || 0;
  const nextTime = Date.parse(nextValue || "") || 0;
  if (currentTime > nextTime) return currentValue || "";
  return nextValue || "";
}

function isSameSyncTarget(currentConfig = {}, nextConfig = {}) {
  return (
    Boolean(currentConfig.configured) === Boolean(nextConfig.configured) &&
    String(currentConfig.serverUrl || "") === String(nextConfig.serverUrl || "") &&
    String(currentConfig.username || "") === String(nextConfig.username || "") &&
    String(currentConfig.remotePath || "") === String(nextConfig.remotePath || "")
  );
}

function syncAuthSecondaryAction() {
  if (!bioBtn) return;
  bioBtn.textContent = state.vaultCorrupted || !state.hasVaultFile ? "导入备份" : "忘记密码";
}

function syncAuthBiometricAction() {
  const canUnlock = Boolean(
    state.hasVaultFile &&
      !state.vaultCorrupted &&
      state.biometricStatus.supported &&
      state.biometricStatus.configured,
  );
  biometricUnlockBtn?.classList.toggle("hidden", !canUnlock);
}

function hasActiveSelection() {
  return Boolean(getActiveEntry());
}

function resolveDetailMode(mode) {
  if (mode === "settings") return "settings";
  if (mode === "edit") return "edit";
  if (mode === "read" && hasActiveSelection()) return "read";
  return hasActiveSelection() ? "read" : "welcome";
}

function syncDetailSurface() {
  const mode = resolveDetailMode(state.detailMode);
  const showWelcome = mode === "welcome";
  const showRead = mode === "read";
  const showEdit = mode === "edit";
  const showSettings = mode === "settings";
  const hasSelection = hasActiveSelection();

  state.detailMode = mode;
  state.editing = showEdit;

  settingsNav?.classList.toggle("hidden", !showSettings);
  settingsView?.classList.toggle("hidden", !showSettings);
  sidebar?.classList.toggle("settings-mode", showSettings);
  content?.classList.toggle("settings-mode", showSettings);
  content?.classList.toggle("empty-detail-mode", showWelcome);
  emptyDetailState?.classList.toggle("hidden", !showWelcome);
  readView?.classList.toggle("hidden", !showRead);
  editView?.classList.toggle("hidden", !showEdit);
  cancelEditBtn?.classList.toggle("hidden", !showEdit);
  importVaultBtn?.classList.toggle("hidden", showEdit);
  generatePasswordBtn?.classList.toggle("hidden", !showEdit);
  openUrlBtn?.classList.toggle("hidden", !showRead);
  deleteEntryBtn?.classList.toggle("hidden", !hasSelection || showSettings || showWelcome);

  if (detailModeLabel) {
    detailModeLabel.textContent = showSettings
      ? "设置"
      : showEdit
        ? "编辑记录"
        : showRead
          ? "查看详情"
          : "欢迎";
  }

  if (editEntryBtn) {
    editEntryBtn.textContent = showSettings ? "返回" : showEdit ? "查看" : "编辑";
  }

  syncPrimaryActionButton();
  if (showSettings) {
    syncSettingsNavigation();
  }
  if (showEdit) {
    siteInput.focus({ preventScroll: true });
  }
}

function setDetailMode(mode) {
  state.detailMode = resolveDetailMode(mode);
  syncDetailSurface();
}

function isSettingsOpen() {
  return state.detailMode === "settings";
}

function syncSettingsModeClass() {
  syncDetailSurface();
}

function normalizeSettingsSection(section) {
  return Object.hasOwn(SETTINGS_SECTIONS, section) ? section : "security";
}

function syncSettingsNavigation() {
  const section = normalizeSettingsSection(state.settingsSection);
  state.settingsSection = section;
  const meta = SETTINGS_SECTIONS[section];
  if (settingsSectionTitle) settingsSectionTitle.textContent = meta.title;
  if (settingsSectionHint) settingsSectionHint.textContent = meta.hint;

  settingsNav?.querySelectorAll("[data-settings-section]").forEach((button) => {
    const active = button.dataset.settingsSection === section;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });

  const navOrder = ["general", "data-key", "security", "backup", "sync"];
  settingsNav?.querySelectorAll("[data-settings-section]").forEach((button) => {
    const order = navOrder.indexOf(button.dataset.settingsSection);
    button.style.order = String(order >= 0 ? order : 99);
  });

  settingsView?.querySelectorAll("[data-settings-page]").forEach((page) => {
    page.classList.toggle("hidden", page.dataset.settingsPage !== section);
  });
}

function setSettingsSection(section) {
  state.settingsSection = normalizeSettingsSection(section);
  syncSettingsNavigation();
}

function resetDetailSurface() {
  state.readPasswordVisible = false;
  setDetailMode("welcome");
}

function syncSettingsForm() {
  if (autoLockMinutes) autoLockMinutes.value = String(state.settings.autoLockMinutes);
  if (clipboardClearSeconds) clipboardClearSeconds.value = String(state.settings.clipboardClearSeconds);
  if (cloudCheckMinutes) cloudCheckMinutes.value = String(state.settings.cloudCheckMinutes);
  if (passwordLengthSetting) passwordLengthSetting.value = String(state.settings.passwordLength);
  if (copyConfirmSetting) copyConfirmSetting.checked = Boolean(state.settings.copyConfirm);
  if (welcomeSetting) welcomeSetting.checked = Boolean(state.settings.welcomeOnStart);
  if (backupExportSetting) backupExportSetting.checked = Boolean(state.settings.backupBeforeExport);
  syncSettingsNavigation();
  syncDataKeySettings();
  syncUpdateSettings();
}

function syncRecoverySettings() {
  const status = state.recoveryStatus || {};
  const configured = Boolean(status.configured);
  if (recoveryStatusText) {
    recoveryStatusText.textContent = configured
      ? "已设置，忘记主密码时可以找回。"
      : "未设置，忘记主密码时无法找回。";
  }
  if (recoveryStatusPill) {
    recoveryStatusPill.textContent = configured ? "已设置" : "未设置";
    recoveryStatusPill.classList.toggle("is-live", configured);
  }
  const questions = status.questions || [];
  if (questions[0]) recoveryQuestion1.value = questions[0];
}

function syncBiometricSettings() {
  const status = state.biometricStatus || {};
  const supported = Boolean(status.supported);
  const configured = Boolean(status.configured);
  const corrupted = Boolean(status.corrupted);

  if (biometricStatusText) {
    biometricStatusText.textContent = !supported
      ? status.unavailableReason || "当前设备或系统不支持 Touch ID 解锁。"
      : corrupted
        ? "配置文件异常，请关闭后重新启用。"
        : configured
          ? "已启用，可在登录页使用指纹解锁。"
          : "未启用，解锁时仍需输入主密码。";
  }
  if (biometricStatusPill) {
    biometricStatusPill.textContent = configured ? "已启用" : supported ? "未启用" : "不可用";
    biometricStatusPill.classList.toggle("is-live", configured);
  }
  if (biometricToggleBtn) {
    biometricToggleBtn.disabled = !supported || !state.unlocked;
    biometricToggleBtn.textContent = configured ? "关闭 Touch ID" : "启用 Touch ID";
  }
  syncAuthBiometricAction();
}

function syncDataKeySettings() {
  const status = state.dataKeyStatus || {};
  const supported = Boolean(status.supported);
  const remembered = Boolean(status.remembered);
  const sessionActive = Boolean(status.sessionActive);
  const corrupted = Boolean(status.corrupted);

  if (dataKeyStatusText) {
    dataKeyStatusText.textContent = !supported
      ? status.unavailableReason || "系统加密存储不可用，无法在本机记住数据钥匙。"
      : corrupted
        ? "本机数据钥匙配置异常，请重新保存。"
        : remembered
          ? sessionActive
            ? "本机已记住，当前会话也已加载。"
            : "本机已记住，重新解锁后会自动加载。"
          : sessionActive
            ? "当前会话已加载，关闭软件后会清空。"
            : "未设置。保存后，保险箱内容将改由数据钥匙解密。";
  }
  if (dataKeyStatusPill) {
    dataKeyStatusPill.textContent = remembered ? "已记住" : sessionActive ? "会话中" : "未设置";
    dataKeyStatusPill.classList.toggle("is-live", remembered || sessionActive);
  }
  if (rememberDataKeySetting) {
    rememberDataKeySetting.checked = remembered;
    rememberDataKeySetting.disabled = !supported;
  }
  if (
    dataKeyInput &&
    (remembered || sessionActive) &&
    (dataKeyInput.dataset.secretMasked === "true" || dataKeyInput.value === "")
  ) {
    setSecretMask(dataKeyInput);
  }
}

function getWebdavFormConfig() {
  return {
    serverUrl: webdavServerUrl?.value.trim() || "",
    username: webdavUsername?.value.trim() || "",
    appPassword: getSecretInputValue(webdavAppPassword).replace(/\s+/g, ""),
    remotePath: webdavRemotePath?.value.trim() || "/CocoDense/vault.json",
  };
}

function syncWebdavSettingsForm() {
  const config = state.syncConfig || {};
  if (webdavServerUrl) webdavServerUrl.value = config.serverUrl || "https://dav.jianguoyun.com/dav/";
  if (webdavUsername) webdavUsername.value = config.username || "";
  if (webdavRemotePath) webdavRemotePath.value = config.remotePath || "/CocoDense/vault.json";
  const configured = Boolean(config.configured);
  const corrupted = Boolean(config.corrupted);
  if (webdavAppPassword) {
    if (configured && document.activeElement !== webdavAppPassword) {
      setSecretMask(webdavAppPassword);
    } else if (!configured) {
      clearSecretMask(webdavAppPassword);
      webdavAppPassword.value = "";
    }
  }
  if (webdavStatusText) {
    webdavStatusText.textContent = corrupted
      ? "同步配置异常，请重新保存。"
      : configured
        ? "已配置。上传会覆盖坚果云，下载会覆盖本地，合并会双向合并。"
        : "未配置。坚果云只保存加密后的保险箱文件。";
  }
  if (webdavStatusPill) {
    webdavStatusPill.textContent = configured ? "已配置" : corrupted ? "异常" : "未配置";
    webdavStatusPill.classList.toggle("is-live", configured);
  }
  const syncReady = Boolean(state.unlocked && configured);
  if (uploadWebdavBtn) uploadWebdavBtn.disabled = !syncReady;
  if (downloadWebdavBtn) downloadWebdavBtn.disabled = !syncReady;
  if (mergeWebdavBtn) mergeWebdavBtn.disabled = !syncReady;
}

function formatDownloadBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

function formatDownloadSpeed(downloadedBytes, elapsedMs) {
  if (!downloadedBytes || !elapsedMs) return "";
  return `${formatDownloadBytes((downloadedBytes / elapsedMs) * 1000)}/s`;
}

function getUpdateProgressLabel(stage) {
  const labels = {
    checking: "正在检查版本",
    connecting: "正在连接下载",
    downloading: "正在下载",
    downloaded: "下载完成，正在准备打开",
    opening: "正在打开安装包",
    done: "下载完成",
    error: "下载失败",
  };
  return labels[stage] || "正在下载";
}

function syncUpdateDownloadProgress() {
  const progress = state.updateDownloadProgress;
  if (!updateProgressPanel || !progress) return;

  const totalBytes = Number(progress.totalBytes) || Number(state.updateInfo?.assetSize) || 0;
  const downloadedBytes = Number(progress.downloadedBytes) || 0;
  const hasTotal = totalBytes > 0;
  const percent = progress.stage === "done"
    ? 100
    : hasTotal
      ? Math.min(100, Math.max(0, Math.round((downloadedBytes / totalBytes) * 100)))
      : 0;
  const speed = formatDownloadSpeed(downloadedBytes, Number(progress.elapsedMs) || 0);
  const sizeText = hasTotal
    ? `${formatDownloadBytes(downloadedBytes)} / ${formatDownloadBytes(totalBytes)}`
    : downloadedBytes
      ? `已下载 ${formatDownloadBytes(downloadedBytes)}`
      : "等待数据";

  updateProgressPanel.classList.remove("hidden");
  updateProgressTrack?.classList.toggle("is-indeterminate", !hasTotal && progress.stage === "downloading");
  if (updateProgressTrack) updateProgressTrack.setAttribute("aria-valuenow", String(percent));
  if (updateProgressBar) updateProgressBar.style.width = hasTotal || progress.stage === "done" ? `${percent}%` : "42%";
  if (updateProgressPercent) updateProgressPercent.textContent = hasTotal || progress.stage === "done" ? `${percent}%` : "--";
  if (updateProgressMeta) updateProgressMeta.textContent = speed ? `${sizeText} · ${speed}` : sizeText;
  if (updateProgressFile) updateProgressFile.textContent = progress.filePath || state.updateInfo?.assetName || "--";
  if (updateStatusText && state.updateDownloading) {
    updateStatusText.textContent = getUpdateProgressLabel(progress.stage);
  }
}

function syncUpdateSettings() {
  const currentVersion = state.appInfo?.version || "";
  const latestVersion = state.updateInfo?.latestVersion || "";
  const updateAvailable = Boolean(state.updateInfo?.updateAvailable);
  const notes = String(state.updateInfo?.notes || "").trim();
  if (currentVersionText) currentVersionText.textContent = currentVersion ? `v${currentVersion}` : "--";
  if (latestVersionText) latestVersionText.textContent = latestVersion ? `v${latestVersion}` : "--";
  if (downloadUpdateBtn) downloadUpdateBtn.disabled = state.updateDownloading || !updateAvailable || !state.updateInfo?.assetUrl;
  if (updateStatusPill) {
    const progressStage = state.updateDownloadProgress?.stage || "";
    const failed = progressStage === "error";
    updateStatusPill.textContent = state.updateDownloading
      ? "下载中"
      : failed
        ? "下载失败"
        : progressStage === "done"
          ? "已下载"
          : updateAvailable
            ? "有新版"
            : latestVersion
              ? "已是最新"
              : "未检查";
    updateStatusPill.classList.toggle("is-live", (updateAvailable || progressStage === "done") && !state.updateDownloading && !failed);
    updateStatusPill.classList.toggle("is-busy", Boolean(state.updateDownloading));
    updateStatusPill.classList.toggle("is-error", failed);
  }
  if (updateStatusText && !state.updateChecking && !state.updateDownloading) {
    if (state.updateDownloadProgress?.stage === "done") {
      updateStatusText.textContent = `安装包已下载：${state.updateDownloadProgress.filePath || ""}`;
    } else if (updateAvailable) {
      updateStatusText.textContent = `发现新版本 v${latestVersion}，可下载并打开安装包。`;
    } else if (latestVersion) {
      updateStatusText.textContent = "当前已经是最新版本。";
    } else {
      updateStatusText.textContent = "检查 GitHub Release 中的最新版本。";
    }
  }
  if (updateAssetText) {
    updateAssetText.textContent = state.updateInfo?.assetName
      ? `将下载：${state.updateInfo.assetName}${state.updateInfo.assetSize ? `（${formatDownloadBytes(state.updateInfo.assetSize)}）` : ""}`
      : "发现新版后，会自动选择当前系统对应的安装包。";
  }
  if (updateNotesPanel && updateNotesBody && updateNotesVersion) {
    const showNotes = updateAvailable && Boolean(notes);
    updateNotesPanel.classList.toggle("hidden", !showNotes);
    updateNotesVersion.textContent = latestVersion ? `v${latestVersion}` : "--";
    updateNotesBody.textContent = showNotes ? notes : "--";
  }
  syncUpdateDownloadProgress();
}

async function refreshAppInfo() {
  const result = await window.vault?.getAppInfo?.();
  if (result?.ok) {
    state.appInfo = {
      version: result.version || "",
      platform: result.platform || "",
      arch: result.arch || "",
    };
  }
  syncUpdateSettings();
  return state.appInfo;
}

async function checkForAppUpdates() {
  state.updateChecking = true;
  if (checkUpdateBtn) {
    checkUpdateBtn.disabled = true;
    checkUpdateBtn.textContent = "检查中";
  }
  if (updateStatusText) updateStatusText.textContent = "正在连接 GitHub 检查最新版本...";
  try {
    const result = await window.vault?.checkForUpdates?.();
    if (!result?.ok) {
      showToast(result?.error || "检查更新失败");
      if (updateStatusText) updateStatusText.textContent = result?.error || "检查更新失败";
      return false;
    }
    state.updateInfo = result;
    showToast(result.updateAvailable ? `发现新版本 v${result.latestVersion}` : "当前已经是最新版本");
    syncUpdateSettings();
    return result.updateAvailable;
  } finally {
    state.updateChecking = false;
    if (checkUpdateBtn) {
      checkUpdateBtn.disabled = false;
      checkUpdateBtn.textContent = "检查更新";
    }
  }
}

async function downloadAppUpdate() {
  if (!state.updateInfo?.updateAvailable) {
    const hasUpdate = await checkForAppUpdates();
    if (!hasUpdate) return;
  }
  state.updateDownloading = true;
  state.updateDownloadProgress = {
    stage: "checking",
    downloadedBytes: 0,
    totalBytes: Number(state.updateInfo?.assetSize) || 0,
  };
  if (downloadUpdateBtn) {
    downloadUpdateBtn.disabled = true;
    downloadUpdateBtn.textContent = "下载中";
  }
  if (updateStatusText) updateStatusText.textContent = "正在下载安装包，完成后会自动打开。";
  syncUpdateSettings();
  try {
    const result = await window.vault?.downloadUpdate?.();
    if (!result?.ok) {
      state.updateDownloadProgress = { stage: "error", error: result?.error || "下载更新失败" };
      showToast(result?.error || "下载更新失败");
      if (updateStatusText) updateStatusText.textContent = result?.error || "下载更新失败";
      syncUpdateSettings();
      return;
    }
    state.updateInfo = result;
    const message = result.opened ? "安装包已下载并打开" : "安装包已下载，请在下载目录中打开";
    showToast(message);
    if (updateStatusText) updateStatusText.textContent = `${message}：${result.filePath || ""}`;
    syncUpdateSettings();
  } finally {
    state.updateDownloading = false;
    if (downloadUpdateBtn) {
      downloadUpdateBtn.textContent = "下载并打开";
    }
    syncUpdateSettings();
  }
}

async function openReleasePage() {
  const targetUrl = state.updateInfo?.releaseUrl || "https://github.com/is-coco/coco-dense/releases";
  const result = await window.vault?.openExternal?.(targetUrl);
  showToast(result?.ok ? "已打开发布页" : result?.error || "无法打开发布页");
}

function getCloudSyncIntervalMs() {
  const minutes = Number(state.settings.cloudCheckMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Math.max(60000, minutes * 60000);
}

function clearCloudSyncTimer() {
  clearTimeout(state.cloudCheckTimer);
  state.cloudCheckTimer = null;
}

function clearPendingCloudUpdate() {
  state.pendingCloudUpdate = false;
  state.pendingCloudPayload = null;
  state.pendingCloudUpdatedAt = 0;
}

function canRunCloudSyncCheck() {
  return Boolean(
    state.unlocked &&
      state.masterPassword &&
      !state.vaultCorrupted &&
      state.syncConfig?.configured,
  );
}

function scheduleCloudSyncCheck() {
  clearCloudSyncTimer();
  if (!canRunCloudSyncCheck()) return;
  const delay = getCloudSyncIntervalMs();
  if (!delay) return;
  state.cloudCheckTimer = setTimeout(async () => {
    state.cloudCheckTimer = null;
    await runCloudSyncCheck();
    scheduleCloudSyncCheck();
  }, delay);
}

async function runCloudSyncCheck() {
  if (state.cloudCheckBusy || !canRunCloudSyncCheck()) return false;
  state.cloudCheckBusy = true;
  refreshStatusText();
  try {
    const syncConfig = state.syncConfig || {};
    const remote = await window.vault?.peekSync?.(state.masterPassword, syncConfig);
    if (!remote?.ok) {
      if (showDataKeySyncPrompt(remote)) return false;
      setSyncError(remote?.error || "同步检查失败");
      return false;
    }
    if (!remote.exists) {
      clearPendingCloudUpdate();
      if (isLocalVaultNewerThanSync() && !state.editing) {
        clearSyncError();
        await queueCloudSync(getVaultPayload({ touchUpdatedAt: false }));
        return true;
      }
      clearSyncError();
      return false;
    }

    const remoteUpdatedAt = Date.parse(remote.updatedAt || remote.payload?.updatedAt || "") || 0;
    const localUpdatedAt = Date.parse(state.vaultMeta?.updatedAt || "") || 0;
    if (remoteUpdatedAt <= localUpdatedAt) {
      clearPendingCloudUpdate();
      if (isLocalVaultNewerThanSync() && !state.editing) {
        clearSyncError();
        await queueCloudSync(getVaultPayload());
        return true;
      }
      if (!isLocalVaultNewerThanSync()) {
        clearSyncError();
      }
      return false;
    }

    if (state.editing) {
      state.pendingCloudUpdate = true;
      state.pendingCloudPayload = remote.payload;
      state.pendingCloudUpdatedAt = remoteUpdatedAt;
      clearSyncError();
      refreshStatusText();
      return true;
    }

    clearPendingCloudUpdate();
    const result = await window.vault?.downloadSync?.(state.masterPassword, syncConfig);
    if (!result?.ok) {
      if (showDataKeySyncPrompt(result)) return false;
      setSyncError(result?.error || "下载失败");
      return false;
    }
    if (result.vault) {
      loadVaultPayload(result.vault, { preserveView: true });
    }
    markSyncSucceeded(result);
    showToast("已从云端自动更新");
    return true;
  } catch {
    setSyncError("同步检查失败");
    return false;
  } finally {
    state.cloudCheckBusy = false;
    refreshStatusText();
  }
}

async function syncLocalMutationToCloud(payload = getVaultPayload()) {
  if (!state.unlocked || !state.masterPassword || !state.syncConfig?.configured) return false;
  const syncConfig = state.syncConfig || {};
  const hasPendingRemote = Boolean(state.pendingCloudUpdate);

  try {
    if (hasPendingRemote) {
      const result = await window.vault?.syncNow?.(state.masterPassword, payload, syncConfig);
      if (!result?.ok) {
        if (showDataKeySyncPrompt(result)) return false;
        setSyncError(result?.error || "自动同步失败");
        showToast(result?.error || "自动同步失败");
        return false;
      }
      clearPendingCloudUpdate();
      if (result.vault) {
        loadVaultPayload(result.vault, { preserveView: true });
      }
      markSyncSucceeded(result);
      return true;
    }

    const result = await window.vault?.uploadSync?.(state.masterPassword, payload, syncConfig);
    if (!result?.ok) {
      if (showDataKeySyncPrompt(result)) return false;
      if (result?.needsMerge) {
        const mergeResult = await window.vault?.syncNow?.(state.masterPassword, payload, syncConfig);
        if (!mergeResult?.ok) {
          if (showDataKeySyncPrompt(mergeResult)) return false;
          setSyncError(mergeResult?.error || "自动合并失败");
          showToast(mergeResult?.error || "自动合并失败");
          return false;
        }
        if (mergeResult.vault) {
          loadVaultPayload(mergeResult.vault, { preserveView: true });
        }
        markSyncSucceeded(mergeResult);
        return true;
      }
      setSyncError(result?.error || "自动同步失败");
      showToast(result?.error || "自动同步失败");
      return false;
    }
    markSyncSucceeded(result);
    return true;
  } finally {
    scheduleCloudSyncCheck();
  }
}

async function forceUploadDataKeyVault(payload) {
  if (!state.unlocked || !state.masterPassword || !state.syncConfig?.configured || !payload) return false;
  const syncConfig = state.syncConfig || {};
  clearPendingCloudUpdate();
  clearSyncError();
  setSyncBusy(true);
  try {
    const result = await window.vault?.uploadSync?.(state.masterPassword, payload, syncConfig, { force: true });
    if (!result?.ok) {
      setSyncError(result?.error || "数据钥匙已保存，但上传云端失败");
      showToast(result?.error || "数据钥匙已保存，但上传云端失败");
      return false;
    }
    markSyncSucceeded(result);
    showToast("数据钥匙已保存并同步到云端");
    return true;
  } finally {
    setSyncBusy(false);
    scheduleCloudSyncCheck();
  }
}

async function syncCloudAfterUnlock() {
  if (!state.unlocked || !state.masterPassword || state.unlockSyncJob) return state.unlockSyncJob || false;
  state.unlockSyncJob = (async () => {
    await refreshWebdavConfig();
    if (!state.syncConfig?.configured || state.vaultCorrupted) return false;
    clearSyncError();
    setSyncBusy(true);
    try {
      const payload = snapshotVaultPayload(getVaultPayload({ touchUpdatedAt: false }));
      const result = await window.vault?.syncNow?.(state.masterPassword, payload, state.syncConfig);
      if (!result?.ok) {
        if (showDataKeySyncPrompt(result)) return false;
        setSyncError(result?.error || "登录后同步失败");
        showToast(result?.error || "登录后同步失败");
        return false;
      }
      if (result.vault) {
        loadVaultPayload(result.vault, { preserveView: true });
      }
      markSyncSucceeded(result);
      await refreshWebdavConfig();
      refreshStatusText();
      showToast(result.merged ? "已同步云端最新数据" : "已完成云端同步");
      return true;
    } finally {
      setSyncBusy(false);
      scheduleCloudSyncCheck();
      state.unlockSyncJob = null;
    }
  })();
  return state.unlockSyncJob;
}

async function flushQueuedCloudSync() {
  let lastResult = false;
  while (state.cloudSyncQueuedPayload) {
    const payload = state.cloudSyncQueuedPayload;
    state.cloudSyncQueuedPayload = null;
    lastResult = await syncLocalMutationToCloud(payload);
  }
  return lastResult;
}

function queueCloudSync(payload = getVaultPayload()) {
  if (!state.unlocked || !state.masterPassword || !state.syncConfig?.configured) return Promise.resolve(false);
  state.cloudSyncQueuedPayload = snapshotVaultPayload(payload);
  if (state.cloudSyncJob) return state.cloudSyncJob;
  state.cloudSyncJob = flushQueuedCloudSync().finally(() => {
    state.cloudSyncJob = null;
    state.cloudSyncQueuedPayload = null;
    refreshStatusText();
  });
  refreshStatusText();
  return state.cloudSyncJob;
}

async function refreshWebdavConfig() {
  const result = await window.vault?.getSyncConfig?.();
  const config = result?.config || {};
  const nextConfig = {
    configured: Boolean(config.configured),
    corrupted: Boolean(config.corrupted),
    serverUrl: config.serverUrl || "",
    username: config.username || "",
    remotePath: config.remotePath || "/CocoDense/vault.json",
    updatedAt: config.updatedAt || "",
    lastSyncedAt: config.lastSyncedAt || "",
  };
  if (isSameSyncTarget(state.syncConfig, nextConfig)) {
    nextConfig.lastSyncedAt = latestTimestampValue(state.syncConfig?.lastSyncedAt, nextConfig.lastSyncedAt);
  }
  state.syncConfig = {
    ...nextConfig,
  };
  syncWebdavSettingsForm();
  scheduleCloudSyncCheck();
  refreshStatusText();
  return state.syncConfig;
}

async function saveWebdavConfig() {
  const config = getWebdavFormConfig();
  saveWebdavBtn.disabled = true;
  saveWebdavBtn.textContent = "保存中";
  const result = await window.vault?.saveSyncConfig?.(config);
  saveWebdavBtn.disabled = false;
  saveWebdavBtn.textContent = "保存配置";
  if (!result?.ok) {
    showToast(result?.error || "保存同步配置失败");
    return false;
  }
  clearSyncError();
  await refreshWebdavConfig();
  showToast("同步配置已保存");
  touchActivity();
  return true;
}

async function testWebdavConnection() {
  const config = getWebdavFormConfig();
  testWebdavBtn.disabled = true;
  testWebdavBtn.textContent = "测试中";
  const result = await window.vault?.testSyncConfig?.(config);
  testWebdavBtn.disabled = false;
  testWebdavBtn.textContent = "测试连接";
  if (result?.ok && config.appPassword) {
    await window.vault?.saveSyncConfig?.(config);
    await refreshWebdavConfig();
  }
  if (result?.ok) clearSyncError();
  showToast(result?.ok ? "WebDAV 连接正常" : result?.error || "连接失败");
  touchActivity();
}

async function uploadWebdavNow() {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  const syncConfig = getWebdavFormConfig();
  clearSyncError();
  setSyncBusy(true);
  uploadWebdavBtn.disabled = true;
  uploadWebdavBtn.textContent = "上传中";
  const result = await window.vault?.uploadSync?.(state.masterPassword, getVaultPayload(), syncConfig);
  uploadWebdavBtn.disabled = false;
  uploadWebdavBtn.textContent = "上传到坚果云";
  if (!result?.ok) {
    setSyncBusy(false);
    if (showDataKeySyncPrompt(result, { openSettings: true })) return;
    if (result?.needsMerge) {
      state.pendingCloudUpdate = true;
      state.pendingCloudUpdatedAt = Date.parse(result.remoteUpdatedAt || "") || Date.now();
      setSyncError(result.error || "云端有更新，请先双向合并");
      showToast(result.error || "云端有更新，请先双向合并");
      return;
    }
    setSyncError(result?.error || "上传失败");
    showToast(result?.error || "上传失败");
    return;
  }
  if (result.vault) {
    loadVaultPayload(result.vault);
  }
  markSyncSucceeded(result);
  await window.vault?.saveSyncConfig?.(syncConfig);
  await refreshWebdavConfig();
  setSyncBusy(false);
  showToast("已上传到坚果云");
  touchActivity();
}

async function downloadWebdavNow() {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  const syncConfig = getWebdavFormConfig();
  clearSyncError();
  setSyncBusy(true);
  downloadWebdavBtn.disabled = true;
  downloadWebdavBtn.textContent = "下载中";
  const result = await window.vault?.downloadSync?.(state.masterPassword, syncConfig);
  downloadWebdavBtn.disabled = false;
  downloadWebdavBtn.textContent = "从坚果云下载";
  if (!result?.ok) {
    setSyncBusy(false);
    if (showDataKeySyncPrompt(result, { openSettings: true })) return;
    setSyncError(result?.error || "下载失败");
    showToast(result?.error || "下载失败");
    return;
  }
  if (result.vault) {
    loadVaultPayload(result.vault);
  }
  markSyncSucceeded(result);
  await window.vault?.saveSyncConfig?.(syncConfig);
  await refreshWebdavConfig();
  setSyncBusy(false);
  showToast("已从坚果云下载");
  touchActivity();
}

async function mergeWebdavNow() {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  const syncConfig = getWebdavFormConfig();
  clearSyncError();
  setSyncBusy(true);
  mergeWebdavBtn.disabled = true;
  mergeWebdavBtn.textContent = "合并中";
  const result = await window.vault?.syncNow?.(state.masterPassword, getVaultPayload(), syncConfig);
  mergeWebdavBtn.disabled = false;
  mergeWebdavBtn.textContent = "双向合并";
  if (!result?.ok) {
    setSyncBusy(false);
    if (showDataKeySyncPrompt(result, { openSettings: true })) return;
    setSyncError(result?.error || "合并失败");
    showToast(result?.error || "合并失败");
    return;
  }
  if (result.vault) {
    loadVaultPayload(result.vault);
  }
  markSyncSucceeded(result);
  await window.vault?.saveSyncConfig?.(syncConfig);
  await refreshWebdavConfig();
  setSyncBusy(false);
  showToast(result.merged ? "已合并并同步" : "已合并到坚果云");
  touchActivity();
}

function syncDetailMode() {
  syncDetailSurface();
}

function confirmAction(message) {
  return window.confirm(message);
}

function showFormError(message) {
  changePasswordError.textContent = message;
  changePasswordError.classList.remove("hidden");
}

function clearFormError() {
  changePasswordError.textContent = "";
  changePasswordError.classList.add("hidden");
}

function openChangePasswordModal() {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  changePasswordForm.reset();
  clearFormError();
  changePasswordModal.classList.remove("hidden");
  changePasswordModal.setAttribute("aria-hidden", "false");
  currentMasterPassword.focus({ preventScroll: true });
}

function closeChangePasswordModal() {
  changePasswordModal.classList.add("hidden");
  changePasswordModal.setAttribute("aria-hidden", "true");
  changePasswordForm.reset();
  clearFormError();
}

function openForgotPasswordModal() {
  if (state.vaultCorrupted) {
    showToast("本地保险箱损坏，无法找回");
    return;
  }
  forgotPasswordForm?.reset();
  forgotPasswordError.textContent = "";
  forgotPasswordError.classList.add("hidden");
  forgotPasswordForm.classList.toggle("hidden", !state.recoveryStatus.configured);
  forgotPasswordUnavailable.classList.toggle("hidden", state.recoveryStatus.configured);
  if (state.recoveryStatus.configured) {
    forgotQuestion1.textContent = state.recoveryStatus.questions?.[0] || "安全问题";
  }
  setForgotRecoveryStep("answer");
  forgotPasswordModal.classList.remove("hidden");
  forgotPasswordModal.setAttribute("aria-hidden", "false");
  (state.recoveryStatus.configured ? forgotAnswer1 : closeForgotPasswordBtn).focus({ preventScroll: true });
}

function closeForgotPasswordModal() {
  forgotPasswordModal.classList.add("hidden");
  forgotPasswordModal.setAttribute("aria-hidden", "true");
  forgotPasswordForm.reset();
  if (forgotDataKeyInput) forgotDataKeyInput.value = "";
  setForgotRecoveryStep("answer");
  forgotPasswordError.textContent = "";
  forgotPasswordError.classList.add("hidden");
}

function showForgotPasswordError(message) {
  forgotPasswordError.textContent = message;
  forgotPasswordError.classList.remove("hidden");
}

function setForgotRecoveryStep(step = "answer") {
  const needsDataKey = step === "data-key";
  if (forgotPasswordForm) {
    forgotPasswordForm.dataset.recoveryStep = needsDataKey ? "data-key" : "answer";
  }
  forgotAnswerField?.classList.toggle("hidden", needsDataKey);
  forgotDataKeyField?.classList.toggle("hidden", !needsDataKey);
  if (forgotPasswordHelper) {
    forgotPasswordHelper.classList.toggle("is-alert", needsDataKey);
    forgotPasswordHelper.textContent = needsDataKey
      ? "重要提醒：安全问题已验证，仍需输入数据钥匙才能解锁。"
      : "先验证你设置过的安全问题答案。";
  }
  if (submitForgotPasswordBtn) {
    submitForgotPasswordBtn.textContent = "解锁";
  }
}

function openRecoverySettingsModal() {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  recoverySettingsError.textContent = "";
  recoverySettingsError.classList.add("hidden");
  recoverySettingsModal.classList.remove("hidden");
  recoverySettingsModal.setAttribute("aria-hidden", "false");
  recoveryQuestion1.focus({ preventScroll: true });
}

function closeRecoverySettingsModal() {
  recoverySettingsModal.classList.add("hidden");
  recoverySettingsModal.setAttribute("aria-hidden", "true");
  recoverySettingsForm.reset();
  recoverySettingsError.textContent = "";
  recoverySettingsError.classList.add("hidden");
}

function showRecoverySettingsError(message) {
  recoverySettingsError.textContent = message;
  recoverySettingsError.classList.remove("hidden");
}

function normalizeUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function scorePassword(value) {
  const password = String(value ?? "");
  if (!password) return { level: 0, label: "未填写" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { level: 1, label: "偏弱" };
  if (score <= 4) return { level: 2, label: "一般" };
  return { level: 3, label: "很强" };
}

function priorityScore(priority) {
  return PRIORITY_ORDER[priority] ?? 0;
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const priorityDelta = priorityScore(b.priority) - priorityScore(a.priority);
    if (priorityDelta !== 0) return priorityDelta;
    const aTime = new Date(a.lastUsedAt || 0).getTime();
    const bTime = new Date(b.lastUsedAt || 0).getTime();
    return bTime - aTime;
  });
}

function loadFolderUiState() {
  try {
    const raw = window.localStorage?.getItem("coco-dense-folder-ui") || "";
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    const next = {};
    Object.entries(parsed).forEach(([folderId, value]) => {
      if (folderId) {
        next[folderId] = {
          collapsed: Boolean(value?.collapsed),
        };
      }
    });
    return next;
  } catch {
    return {};
  }
}

function saveFolderUiState() {
  try {
    window.localStorage?.setItem("coco-dense-folder-ui", JSON.stringify(state.folderUi || {}));
  } catch {
    // ignore local persistence errors
  }
}

function getFolders() {
  return Array.isArray(state.settings?.folders) ? state.settings.folders : [];
}

function getFolder(folderId) {
  return getFolders().find((folder) => folder.id === folderId) || null;
}

function sortFolders(folders = getFolders()) {
  return [...folders].sort((a, b) => {
    const priorityDelta = priorityScore(normalizePriority(b.priority)) - priorityScore(normalizePriority(a.priority));
    if (priorityDelta !== 0) return priorityDelta;
    return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN", {
      numeric: true,
      sensitivity: "base",
    });
  });
}

function isValidFolderId(folderId) {
  return Boolean(folderId && getFolder(folderId));
}

function getEntryFolderId(entry) {
  return isValidFolderId(entry?.folderId) ? entry.folderId : "";
}

function getFolderName(folderId) {
  return folderId ? getFolder(folderId)?.name || "文件夹" : "未分组";
}

function getFolderPriority(folderId) {
  return normalizePriority(getFolder(folderId)?.priority);
}

function makeFolderId(name) {
  const base = String(name || "folder")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "folder";
  return `${base}-${Date.now().toString(36)}`;
}

function getFolderEntryCount(folderId, entries = getVisibleEntries()) {
  return entries.filter((entry) => getEntryFolderId(entry) === folderId).length;
}

function getFolderCollapsed(folderId) {
  return Boolean(state.folderUi?.[folderId]?.collapsed);
}

function setFolderCollapsed(folderId, collapsed) {
  if (!folderId) return;
  state.folderUi = {
    ...state.folderUi,
    [folderId]: {
      ...state.folderUi?.[folderId],
      collapsed: Boolean(collapsed),
    },
  };
  saveFolderUiState();
}

function reconcileFolderUiState() {
  const next = {};
  getFolders().forEach((folder) => {
    next[folder.id] = {
      collapsed: Boolean(state.folderUi?.[folder.id]?.collapsed),
    };
  });
  state.folderUi = next;
  saveFolderUiState();
}

function findFolderByName(name, excludeId = "") {
  const needle = String(name || "").trim().toLocaleLowerCase("zh-CN");
  if (!needle) return null;
  return getFolders().find((folder) => {
    if (excludeId && folder.id === excludeId) return false;
    return String(folder.name || "").trim().toLocaleLowerCase("zh-CN") === needle;
  }) || null;
}

function getNextFolderName() {
  let index = 1;
  while (findFolderByName(`分组${index}`)) {
    index += 1;
  }
  return `分组${index}`;
}

function markFolderToggle(folderId) {
  const now = Date.now();
  const lastAt = Number(state.folderToggleAt?.[folderId] || 0);
  if (now - lastAt < 220) return false;
  state.folderToggleAt = {
    ...state.folderToggleAt,
    [folderId]: now,
  };
  return true;
}

async function setFolderPriority(folderId, priority) {
  if (!folderId) return;
  const nextPriority = normalizePriority(priority);
  state.settings = normalizeSettings({
    ...state.settings,
    folders: getFolders().map((folder) =>
      folder.id === folderId ? { ...folder, priority: nextPriority } : folder,
    ),
  });
  renderEntries();
  await persistVault();
}

function applyPriority(priority) {
  state.activePriority = Object.hasOwn(PRIORITY_ORDER, priority) ? priority : "green";
  syncPriorityPicker();
}

function hideEntryContextMenu() {
  if (!entryContextMenu) return;
  entryContextMenu.classList.add("hidden");
  entryContextMenu.setAttribute("aria-hidden", "true");
  state.contextEntryId = "";
}

function hideFolderContextMenu() {
  if (!folderContextMenu) return;
  folderContextMenu.classList.add("hidden");
  folderContextMenu.setAttribute("aria-hidden", "true");
  state.contextFolderId = "";
}

function hideSidebarContextMenu() {
  if (!sidebarContextMenu) return;
  sidebarContextMenu.classList.add("hidden");
  sidebarContextMenu.setAttribute("aria-hidden", "true");
}

function placeContextMenu(menu, x, y) {
  if (!menu) return;
  menu.classList.remove("hidden");
  menu.setAttribute("aria-hidden", "false");
  const rect = menu.getBoundingClientRect();
  const margin = 10;
  const left = Math.min(x, window.innerWidth - rect.width - margin);
  const top = Math.min(y, window.innerHeight - rect.height - margin);
  menu.style.left = `${Math.max(margin, left)}px`;
  menu.style.top = `${Math.max(margin, top)}px`;
}

function placeEntryContextMenu(x, y) {
  placeContextMenu(entryContextMenu, x, y);
}

function syncEntryFolderMenu(entry) {
  if (!entryFolderMoveList) return;
  entryFolderMoveList.innerHTML = "";
  const currentFolderId = getEntryFolderId(entry);
  const options = [{ id: "", name: "移出分组" }, ...getFolders()];
  options.forEach((folder) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.menuAction = "move-folder";
    button.dataset.folderId = folder.id;
    if (!folder.id) {
      button.textContent = currentFolderId ? "移出当前分组" : "当前未分组";
    } else {
      button.textContent = currentFolderId === folder.id ? `已在${folder.name}` : `移到${folder.name}`;
    }
    button.disabled = currentFolderId === folder.id;
    entryFolderMoveList.appendChild(button);
  });
}

function showEntryContextMenu(event, entry) {
  if (!entryContextMenu || !entry) return;
  event.preventDefault();
  event.stopPropagation();
  hideFolderContextMenu();
  hideSidebarContextMenu();
  state.contextEntryId = entry.id;
  setActiveEntry(entry.id);

  const pinLabel = entryContextMenu.querySelector('[data-menu-action="toggle-pin"] .menu-label');
  if (pinLabel) pinLabel.textContent = entry.pinned ? "取消置顶" : "置顶";
  const favoriteLabel = entryContextMenu.querySelector('[data-menu-action="toggle-favorite"] .menu-label');
  if (favoriteLabel) favoriteLabel.textContent = entry.favorite ? "取消收藏" : "收藏";
  syncEntryFolderMenu(entry);
  entryContextMenu.querySelectorAll("[data-priority]").forEach((button) => {
    button.classList.toggle("active", button.dataset.priority === normalizePriority(entry.priority));
  });
  placeEntryContextMenu(event.clientX, event.clientY);
}

function showFolderContextMenu(event, folderId) {
  if (!folderContextMenu || !folderId) return;
  event.preventDefault();
  event.stopPropagation();
  hideEntryContextMenu();
  hideSidebarContextMenu();
  state.contextFolderId = folderId;
  const priority = getFolderPriority(folderId);
  folderContextMenu.querySelectorAll("[data-folder-priority]").forEach((button) => {
    button.classList.toggle("active", button.dataset.folderPriority === priority);
  });
  placeContextMenu(folderContextMenu, event.clientX, event.clientY);
}

function showSidebarContextMenu(event) {
  if (!sidebarContextMenu) return;
  event.preventDefault();
  event.stopPropagation();
  hideEntryContextMenu();
  hideFolderContextMenu();
  placeContextMenu(sidebarContextMenu, event.clientX, event.clientY);
}

async function persistContextEntry(message = "已更新") {
  const target = state.entries.find((item) => item.id === (state.contextEntryId || state.activeId));
  if (target) target.updatedAt = new Date().toISOString();
  renderEntries();
  const entry = getActiveEntry();
  if (entry) {
    fillForm(entry);
  }
  if (await persistVault()) {
    if (message) showToast(message);
  }
}

function renameContextEntry(entry) {
  if (!entry) return;
  state.renamingEntryId = entry.id;
  state.activeId = entry.id;
  renderEntries();
  requestAnimationFrame(() => {
    const input = vaultList.querySelector(`[data-rename-input="${CSS.escape(entry.id)}"]`);
    input?.focus({ preventScroll: true });
    input?.select();
  });
}

async function commitInlineRename(input, options = {}) {
  const id = input?.dataset.renameInput;
  if (!id || state.renamingEntryId !== id) return;
  const entry = state.entries.find((item) => item.id === id);
  const nextName = input.value.trim();

  state.renamingEntryId = "";
  if (!entry) {
    renderEntries();
    return;
  }
  if (options.cancel) {
    renderEntries();
    return;
  }
  if (!nextName) {
    showToast("名称不能为空");
    renderEntries();
    return;
  }
  if (nextName === entry.site) {
    renderEntries();
    return;
  }

  entry.site = nextName;
  entry.updatedAt = new Date().toISOString();
  await persistContextEntry("名称已修改");
}

async function createFolderForEntry(entry) {
  if (!entry) return;
  const folder = await createFolder({
    assignEntryId: entry.id,
    defaultName: getNextFolderName(),
  });
  if (!folder) return;
  hideEntryContextMenu();
}

async function createFolder(options = {}) {
  const assignEntryId = options.assignEntryId || "";
  const defaultName = String(options.defaultName || getNextFolderName()).trim() || getNextFolderName();
  const targetEntry = assignEntryId
    ? state.entries.find((entry) => entry.id === assignEntryId && !entry.deletedAt) || null
    : null;
  const folder = {
    id: makeFolderId(defaultName),
    name: defaultName,
    priority: "green",
  };
  state.settings = normalizeSettings({
    ...state.settings,
    folders: [...getFolders(), folder],
  });
  if (targetEntry) {
    targetEntry.folderId = folder.id;
    targetEntry.updatedAt = new Date().toISOString();
  }
  state.renamingFolderId = folder.id;
  setFolderCollapsed(folder.id, false);
  renderEntries();
  await persistVault();
  requestAnimationFrame(() => {
    const input = vaultList.querySelector(`[data-folder-rename-input="${CSS.escape(folder.id)}"]`);
    if (!input) return;
    input.focus({ preventScroll: true });
    const length = input.value.length;
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(length, length);
    }
  });
  return folder;
}

async function moveEntryToFolder(entry, folderId) {
  if (!entry) return;
  const nextFolderId = isValidFolderId(folderId) ? folderId : "";
  entry.folderId = nextFolderId;
  entry.updatedAt = new Date().toISOString();
  hideEntryContextMenu();
  await persistContextEntry("");
}

function renameContextFolder(folderId) {
  const folder = getFolder(folderId);
  if (!folder) return;
  state.renamingFolderId = folder.id;
  renderEntries();
  requestAnimationFrame(() => {
    const input = vaultList.querySelector(`[data-folder-rename-input="${CSS.escape(folder.id)}"]`);
    if (!input) return;
    input.focus({ preventScroll: true });
    const length = input.value.length;
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(length, length);
    }
  });
}

async function commitFolderRename(input, options = {}) {
  const folderId = input?.dataset.folderRenameInput;
  if (!folderId || state.renamingFolderId !== folderId) return;
  const nextName = input.value.trim();

  state.renamingFolderId = "";
  if (options.cancel) {
    renderEntries();
    return;
  }
  if (!nextName) {
    renderEntries();
    return;
  }
  if (findFolderByName(nextName, folderId)) {
    renderEntries();
    return;
  }

  const folder = getFolder(folderId);
  if (!folder) {
    renderEntries();
    return;
  }
  if (nextName === folder.name) {
    renderEntries();
    return;
  }

  state.settings = normalizeSettings({
    ...state.settings,
    folders: getFolders().map((item) =>
      item.id === folderId ? { ...item, name: nextName } : item,
    ),
  });
  renderEntries();
  await persistVault();
}

async function deleteContextFolder(folderId) {
  const folder = getFolder(folderId);
  if (!folder) return;
  state.settings = normalizeSettings({
    ...state.settings,
    folders: getFolders().filter((item) => item.id !== folderId),
  });
  if (state.folderUi?.[folderId]) {
    const nextFolderUi = { ...state.folderUi };
    delete nextFolderUi[folderId];
    state.folderUi = nextFolderUi;
    saveFolderUiState();
  }
  state.entries = state.entries.map((entry) =>
    entry.folderId === folderId
      ? { ...entry, folderId: "", updatedAt: new Date().toISOString() }
      : entry,
  );
  hideFolderContextMenu();
  renderEntries();
  await persistVault();
}

function syncPasswordStrength() {
  if (!entryPasswordStrength) return;
  const result = scorePassword(entryPasswordInput.value);
  entryPasswordStrength.dataset.level = String(result.level);
  entryPasswordStrength.querySelector(".strength-text").textContent = `密码强度：${result.label}`;
}

async function refreshVaultAfterMutation(resultMessage) {
  if (await persistVault()) {
    showToast(resultMessage);
  }
}

async function refreshRecoveryStatus() {
  const status = await window.vault?.getRecoveryStatus?.();
  state.recoveryStatus = {
    configured: Boolean(status?.configured),
    corrupted: Boolean(status?.corrupted),
    questions: Array.isArray(status?.questions) ? status.questions : [],
    updatedAt: status?.updatedAt || "",
  };
  syncRecoverySettings();
  return state.recoveryStatus;
}

async function refreshBiometricStatus() {
  const status = await window.vault?.getBiometricStatus?.();
  state.biometricStatus = {
    supported: Boolean(status?.supported),
    configured: Boolean(status?.configured),
    corrupted: Boolean(status?.corrupted),
    updatedAt: status?.updatedAt || "",
    unavailableReason: status?.unavailableReason || "",
  };
  syncBiometricSettings();
  return state.biometricStatus;
}

async function refreshDataKeyStatus() {
  const status = await window.vault?.getDataKeyStatus?.();
  state.dataKeyStatus = {
    supported: Boolean(status?.supported),
    remembered: Boolean(status?.remembered),
    sessionActive: Boolean(status?.sessionActive),
    corrupted: Boolean(status?.corrupted),
    updatedAt: status?.updatedAt || "",
    unavailableReason: status?.unavailableReason || "",
  };
  syncDataKeySettings();
  return state.dataKeyStatus;
}

async function saveDataKeySettings() {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  const dataKey = getSecretInputValue(dataKeyInput);
  if (!dataKey) {
    showToast(dataKeyInput?.dataset.secretMasked === "true" ? "如需修改数据钥匙，请输入新的数据钥匙" : "请输入数据钥匙");
    dataKeyInput?.focus();
    return;
  }

  saveDataKeyBtn.disabled = true;
  saveDataKeyBtn.textContent = "正在保存";
  const result = await window.vault?.saveDataKey?.(dataKey, rememberDataKeySetting?.checked);
  saveDataKeyBtn.disabled = false;
  saveDataKeyBtn.textContent = "保存数据钥匙";
  if (!result?.ok) {
    showToast(result?.error || "保存数据钥匙失败");
    return;
  }
  state.dataKeyStatus = {
    supported: Boolean(result.status?.supported),
    remembered: Boolean(result.status?.remembered),
    sessionActive: Boolean(result.status?.sessionActive),
    corrupted: Boolean(result.status?.corrupted),
    updatedAt: result.status?.updatedAt || "",
    unavailableReason: result.status?.unavailableReason || "",
  };
  if (result.vault) {
    loadVaultPayload(result.vault, { preserveView: true });
  }
  syncDataKeySettings();
  setSecretMask(dataKeyInput);
  if (result.vault && state.syncConfig?.configured) {
    await forceUploadDataKeyVault(result.vault);
  } else {
    showToast(state.dataKeyStatus.remembered ? "数据钥匙已保存到本机" : "数据钥匙已在当前会话加载");
  }
  touchActivity();
}

async function generateDataKeySettings() {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  const result = await window.vault?.generateDataKey?.();
  if (!result?.ok) {
    showToast(result?.error || "生成数据钥匙失败");
    return;
  }
  if (dataKeyInput) {
    clearSecretMask(dataKeyInput);
    dataKeyInput.value = result.dataKey || "";
  }
  state.dataKeyStatus = {
    supported: Boolean(result.status?.supported),
    remembered: Boolean(result.status?.remembered),
    sessionActive: Boolean(result.status?.sessionActive),
    corrupted: Boolean(result.status?.corrupted),
    updatedAt: result.status?.updatedAt || "",
    unavailableReason: result.status?.unavailableReason || "",
  };
  syncDataKeySettings();
  showToast("已生成数据钥匙");
  touchActivity();
}

async function clearDataKeySettings() {
  const result = await window.vault?.clearDataKey?.();
  if (!result?.ok) {
    showToast(result?.error || "清除数据钥匙失败");
    return;
  }
  if (dataKeyInput) {
    clearSecretMask(dataKeyInput);
    dataKeyInput.value = "";
  }
  state.dataKeyStatus = {
    supported: Boolean(result.status?.supported),
    remembered: Boolean(result.status?.remembered),
    sessionActive: Boolean(result.status?.sessionActive),
    corrupted: Boolean(result.status?.corrupted),
    updatedAt: result.status?.updatedAt || "",
    unavailableReason: result.status?.unavailableReason || "",
  };
  syncDataKeySettings();
  showToast("已清除数据钥匙，请重新解锁");
  if (state.unlocked) {
    lockVaultSilently();
  }
  touchActivity();
}

async function saveRecoverySettings(event) {
  event?.preventDefault();
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  const questions = [recoveryQuestion1.value];
  const answers = [recoveryAnswer1.value];
  if (!answers[0].trim()) {
    showRecoverySettingsError("请填写答案");
    return;
  }

  saveRecoveryBtn.disabled = true;
  saveRecoveryBtn.textContent = "正在保存";
  const result = await window.vault?.setupRecovery?.(state.masterPassword, questions, answers);
  saveRecoveryBtn.disabled = false;
  saveRecoveryBtn.textContent = "保存";
  if (!result?.ok) {
    showRecoverySettingsError(result?.error || "安全问题保存失败");
    return;
  }

  recoveryAnswer1.value = "";
  state.recoveryStatus = {
    configured: Boolean(result.status?.configured),
    corrupted: Boolean(result.status?.corrupted),
    questions: Array.isArray(result.status?.questions) ? result.status.questions : [],
    updatedAt: result.status?.updatedAt || "",
  };
  syncRecoverySettings();
  closeRecoverySettingsModal();
  showToast("安全问题已保存");
  touchActivity();
}

async function recoverAndUnlock(event) {
  event?.preventDefault();
  const step = forgotPasswordForm?.dataset.recoveryStep || "answer";
  const answers = [forgotAnswer1.value];
  const dataKey = forgotDataKeyInput?.value.trim() || "";
  if (step === "answer") {
    if (!answers[0].trim()) {
      showForgotPasswordError("请填写答案");
      return;
    }
  } else if (!dataKey) {
    showForgotPasswordError("请输入数据钥匙");
    forgotDataKeyInput?.focus();
    return;
  }

  submitForgotPasswordBtn.disabled = true;
  submitForgotPasswordBtn.textContent = "解锁中";
  const result = await window.vault?.recoverWithAnswers?.(answers, dataKey);
  submitForgotPasswordBtn.disabled = false;
  submitForgotPasswordBtn.textContent = "解锁";
  if (!result?.ok) {
    if (result?.needsDataKey) {
      forgotPasswordError.textContent = "";
      forgotPasswordError.classList.add("hidden");
      setForgotRecoveryStep("data-key");
      requestAnimationFrame(() => forgotDataKeyInput?.focus({ preventScroll: true }));
      return;
    }
    showForgotPasswordError(result?.error || "验证失败");
    return;
  }

  state.unlocked = true;
  state.masterPassword = result.masterPassword;
  closeForgotPasswordModal();
  masterPassword.value = "";
  window.vault?.showVault?.();
  loadVaultPayload(result.vault);
  showToast("已通过安全问题解锁");
  syncCloudAfterUnlock();
  touchActivity();
}

async function unlockWithBiometric() {
  if (state.vaultCorrupted) {
    showToast("本地保险箱损坏，请先导入备份");
    return;
  }

  biometricUnlockBtn.disabled = true;
  biometricUnlockBtn.textContent = "验证中";
  const result = await window.vault?.unlockWithBiometric?.();
  biometricUnlockBtn.disabled = false;
  biometricUnlockBtn.textContent = "指纹解锁";
  if (!result?.ok) {
    showToast(result?.error || "指纹解锁失败");
    return;
  }

  state.unlocked = true;
  state.masterPassword = result.masterPassword || state.masterPassword;
  window.vault?.showVault?.();
  loadVaultPayload(result.vault);
  showToast("已通过 Touch ID 解锁");
  syncCloudAfterUnlock();
  touchActivity();
}

async function toggleBiometricUnlock() {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  if (!state.biometricStatus.supported) {
    showToast(state.biometricStatus.unavailableReason || "当前设备不支持 Touch ID");
    return;
  }

  biometricToggleBtn.disabled = true;
  biometricToggleBtn.textContent = state.biometricStatus.configured ? "关闭中" : "启用中";
  const result = state.biometricStatus.configured
    ? await window.vault?.disableBiometric?.()
    : await window.vault?.enableBiometric?.(state.masterPassword);
  biometricToggleBtn.disabled = false;
  if (!result?.ok) {
    biometricToggleBtn.textContent = state.biometricStatus.configured ? "关闭 Touch ID" : "启用 Touch ID";
    showToast(result?.error || "Touch ID 设置失败");
    return;
  }

  state.biometricStatus = {
    supported: Boolean(result.status?.supported),
    configured: Boolean(result.status?.configured),
    corrupted: Boolean(result.status?.corrupted),
    updatedAt: result.status?.updatedAt || "",
    unavailableReason: result.status?.unavailableReason || "",
  };
  syncBiometricSettings();
  showToast(state.biometricStatus.configured ? "已启用 Touch ID" : "已关闭 Touch ID");
  touchActivity();
}
async function importVaultFromFile() {
  const password = masterPassword.value.trim();
  if (!password) {
    showToast("请先输入主密码");
    masterPassword.focus();
    return;
  }
  if (state.unlocked && !confirmAction("导入会覆盖当前保险箱。系统会先自动备份当前数据，确定继续吗？")) {
    showToast("已取消导入");
    return;
  }
  showToast("正在选择加密文件");
  const importDataKey = getSecretInputValue(dataKeyInput) || "";
  const result = await window.vault?.importVaultFile?.(password, importDataKey);
  if (result?.ok) {
    state.unlocked = true;
    state.masterPassword = password;
    window.vault?.showVault?.();
    loadVaultPayload(result.vault);
    showToast(result.backupPath ? "已备份并导入保险箱" : "已导入保险箱");
    touchActivity();
    return;
  }
  if (!result?.canceled) {
    showToast(result?.error || "导入失败");
  }
  touchActivity();
}

async function persistVault() {
  if (!state.masterPassword) {
    showToast("请先解锁保险箱");
    return false;
  }
  state.persistQueuedPayload = snapshotVaultPayload(getVaultPayload());
  if (state.persistJob) return state.persistJob;
  state.persistJob = (async () => {
    let lastResult = false;
    try {
      while (state.persistQueuedPayload) {
        const payload = state.persistQueuedPayload;
        state.persistQueuedPayload = null;
        const result = await window.vault?.saveVault?.(state.masterPassword, payload);
        if (!result?.ok) {
          showToast("保存失败");
          lastResult = false;
          continue;
        }
        state.vaultMeta = {
          createdAt: payload.createdAt,
          updatedAt: payload.updatedAt,
        };
        state.hasVaultFile = true;
        refreshStatusText();
        await queueCloudSync(payload);
        lastResult = true;
      }
      return lastResult;
    } finally {
      state.persistJob = null;
      state.persistQueuedPayload = null;
    }
  })();
  return state.persistJob;
}

async function changeMasterPassword(event) {
  event?.preventDefault();
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }

  const currentPassword = currentMasterPassword.value.trim();
  if (currentPassword !== state.masterPassword) {
    showFormError("当前主密码不正确");
    currentMasterPassword.focus();
    return;
  }

  const nextPassword = nextMasterPassword.value.trim();
  if (!nextPassword) {
    showFormError("新主密码不能为空");
    nextMasterPassword.focus();
    return;
  }

  const confirmPassword = confirmMasterPassword.value.trim();
  if (nextPassword !== confirmPassword) {
    showFormError("两次新密码不一致");
    confirmMasterPassword.focus();
    return;
  }
  clearFormError();
  submitPasswordChangeBtn.disabled = true;
  submitPasswordChangeBtn.textContent = "正在保存";
  const result = await window.vault?.changePassword?.(currentPassword, nextPassword);
  submitPasswordChangeBtn.disabled = false;
  submitPasswordChangeBtn.textContent = "保存新密码";
  if (!result?.ok) {
    showFormError(result?.error || "修改主密码失败");
    return;
  }

  state.masterPassword = nextPassword;
  if (result.vault) {
    loadVaultPayload(result.vault);
  }
  state.recoveryStatus = { configured: false, corrupted: false, questions: [], updatedAt: "" };
  syncRecoverySettings();
  closeChangePasswordModal();
  showToast("主密码已修改");
  touchActivity();
}

function loadVaultPayload(payload, options = {}) {
  const preserveView = Boolean(options.preserveView);
  const previousMode = state.detailMode;
  const previousActiveId = state.activeId;
  const previousSettingsSection = state.settingsSection;
  clearPendingCloudUpdate();
  state.syncError = "";
  if (!preserveView) {
    resetDetailSurface();
  }
  state.entries = Array.isArray(payload?.entries) ? payload.entries.map(normalizeEntry) : [];
  state.settings = normalizeSettings(payload?.settings);
  reconcileFolderUiState();
  state.vaultMeta = {
    createdAt: payload?.createdAt || new Date().toISOString(),
    updatedAt: payload?.updatedAt || new Date().toISOString(),
  };
  const activeEntryStillExists = state.entries.some((entry) => entry.id === previousActiveId && !entry.deletedAt);
  state.activeId = preserveView && activeEntryStillExists ? previousActiveId : "";
  applyPriority("green");
  syncSettingsForm();
  renderEntries();
  if (preserveView && previousMode === "settings") {
    setDetailMode("settings");
    setSettingsSection(previousSettingsSection);
  } else if (preserveView && state.activeId) {
    fillForm(getActiveEntry());
    setDetailMode(previousMode === "edit" ? "edit" : "read");
  } else {
    clearForm();
  }
  refreshStatusText();
  refreshRecoveryStatus();
  refreshBiometricStatus();
  refreshDataKeyStatus();
  refreshWebdavConfig();
  touchActivity();
}

async function initAuthState() {
  const status = await window.vault?.getStatus?.();
  state.hasVaultFile = Boolean(status?.hasVault);
  state.vaultCorrupted = Boolean(status?.corrupted);
  await refreshRecoveryStatus();
  await refreshBiometricStatus();
  await refreshDataKeyStatus();
  await refreshWebdavConfig();
  if (state.vaultCorrupted) {
    unlockPrimaryBtn.textContent = "无法解锁";
    authHelper.textContent = "本地保险箱文件可能损坏，请从备份文件恢复。";
  } else {
    unlockPrimaryBtn.textContent = state.hasVaultFile ? "解锁" : "创建保险箱";
    authHelper.textContent = state.hasVaultFile
      ? "输入主密码解锁；忘记密码时可使用已设置的安全问题。"
      : "首次输入主密码会创建新的加密保险箱。";
  }
  syncAuthSecondaryAction();
  refreshStatusText();
}

function shouldShowEmptyFolders(query) {
  return !query && !state.activeTagFilter && !state.activePriorityFilter && state.activeFilter === "全部";
}

function createEntryNode(entry) {
  const priority = normalizePriority(entry.priority);
  const isRenaming = state.renamingEntryId === entry.id;
  const isNested = Boolean(getEntryFolderId(entry));
  const button = document.createElement("button");
  button.type = "button";
  button.className = `vault-item${entry.id === state.activeId ? " active" : ""}${isNested ? " vault-item-nested" : ""}`;
  button.setAttribute("role", "listitem");
  button.dataset.entry = entry.id;
  const row = document.createElement("div");
  row.className = "vault-item-row";

  const dot = document.createElement("span");
  dot.className = `priority-dot ${priority}`;

  const itemMain = document.createElement("div");
  itemMain.className = "item-main";

  if (isRenaming) {
    const renameInput = document.createElement("input");
    renameInput.className = "rename-input";
    renameInput.dataset.renameInput = entry.id;
    renameInput.value = entry.site || "";
    renameInput.setAttribute("aria-label", "修改名称");
    itemMain.appendChild(renameInput);
  } else {
    const strong = document.createElement("strong");
    strong.textContent = entry.site || "";
    itemMain.appendChild(strong);
  }

  const tags = document.createElement("span");
  tags.textContent = formatEntryTagLine(entry.tags);
  itemMain.appendChild(tags);

  row.append(dot, itemMain);
  button.append(row);
  button.addEventListener("click", () => {
    if (state.renamingEntryId) return;
    setActiveEntry(entry.id);
  });
  button.addEventListener("contextmenu", (event) => {
    showEntryContextMenu(event, entry);
  });
  const renameInput = button.querySelector(".rename-input");
  renameInput?.addEventListener("click", (event) => event.stopPropagation());
  renameInput?.addEventListener("pointerdown", (event) => event.stopPropagation());
  renameInput?.addEventListener("blur", () => {
    commitInlineRename(renameInput);
  });
  renameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      renameInput.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      commitInlineRename(renameInput, { cancel: true });
    }
  });
  return button;
}

function createFolderNode(folder, entries) {
  const folderId = folder?.id || "";
  if (!folderId) return null;
  const isCollapsed = getFolderCollapsed(folderId);
  const isRenaming = state.renamingFolderId === folderId;
  const wrapper = document.createElement("div");
  wrapper.className = `folder-item${isCollapsed ? " collapsed" : ""}`;
  wrapper.dataset.folder = folderId;
  wrapper.setAttribute("role", "listitem");
  wrapper.setAttribute("aria-expanded", String(!isCollapsed));

  const row = document.createElement("div");
  row.className = "folder-toggle";

  const chevron = document.createElement("span");
  chevron.className = "folder-chevron";
  chevron.textContent = "›";

  const priority = document.createElement("span");
  priority.className = `priority-dot ${normalizePriority(folder.priority)}`;
  priority.setAttribute("aria-hidden", "true");

  const main = document.createElement("span");
  main.className = "folder-main";

  const nameWrap = document.createElement("span");
  nameWrap.className = "folder-name-wrap";

  if (isRenaming) {
    const input = document.createElement("input");
    input.className = "folder-rename-input";
    input.dataset.folderRenameInput = folderId;
    input.value = folder.name || "";
    input.setAttribute("aria-label", "修改文件夹名");
    nameWrap.appendChild(input);
  } else {
    const name = document.createElement("strong");
    name.textContent = folder.name;
    nameWrap.appendChild(name);
  }

  const count = document.createElement("small");
  count.className = "folder-count";
  count.textContent = `${entries.length}`;
  main.append(nameWrap, count);

  row.append(chevron, priority, main);
  wrapper.appendChild(row);

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "folder-menu-btn";
  menuButton.setAttribute("aria-label", `${folder.name} 菜单`);
  menuButton.textContent = "⋯";
  menuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showFolderContextMenu(event, folderId);
  });
  wrapper.appendChild(menuButton);

  const toggleFolder = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (state.renamingFolderId) return;
    if (!markFolderToggle(folderId)) return;
    setFolderCollapsed(folderId, !isCollapsed);
    renderEntries();
    touchActivity();
  };
  row.addEventListener("click", toggleFolder);
  wrapper.addEventListener("contextmenu", (event) => {
    showFolderContextMenu(event, folderId);
  });

  const input = wrapper.querySelector(".folder-rename-input");
  input?.addEventListener("click", (event) => event.stopPropagation());
  input?.addEventListener("pointerdown", (event) => event.stopPropagation());
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitFolderRename(input);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      commitFolderRename(input, { cancel: true });
    }
  });
  return wrapper;
}

function renderEntries() {
  syncSidebarFilters();
  const query = searchInput.value.trim().toLowerCase();
  const filtered = sortEntries(getVisibleEntries().filter((entry) => {
    if (state.activeTagFilter && !parseTags(entry.tags).includes(state.activeTagFilter)) return false;
    if (state.activePriorityFilter && normalizePriority(entry.priority) !== state.activePriorityFilter) return false;
    if (state.activeFilter === "收藏" && !entry.favorite) return false;
    if (state.activeFilter === "最近" && !entry.lastUsedAt) return false;
    if (!query) return true;
    const haystack = buildSearchIndex(entry);
    const queryInitials = window.vault?.toPinyinInitials?.(searchInput.value.trim()) || "";
    return haystack.includes(query) || (queryInitials && haystack.includes(queryInitials));
  }));

  vaultList.querySelectorAll("[data-entry], [data-folder]").forEach((node) => node.remove());
  let renderedGroupCount = 0;

  const groups = new Map();
  getFolders().forEach((folder) => groups.set(folder.id, []));
  groups.set("", []);
  filtered.forEach((entry) => {
    const folderId = getEntryFolderId(entry);
    if (!groups.has(folderId)) groups.set(folderId, []);
    groups.get(folderId).push(entry);
  });

  const showEmptyFolders = shouldShowEmptyFolders(query);
  const appendGroup = (folder, entries) => {
    const shouldShowGroup = entries.length || showEmptyFolders || (folder?.id && state.renamingFolderId === folder.id);
    if (!shouldShowGroup) return;
    renderedGroupCount += 1;
    const folderNode = createFolderNode(folder, entries);
    if (!folderNode) return;
    vaultList.insertBefore(folderNode, emptyState);
    if (folder?.id && getFolderCollapsed(folder.id)) return;
    entries.forEach((entry) => vaultList.insertBefore(createEntryNode(entry), emptyState));
  };

  sortFolders(getFolders()).forEach((folder) => appendGroup(folder, groups.get(folder.id) || []));
  const unfiledEntries = groups.get("") || [];
  unfiledEntries.forEach((entry) => {
    renderedGroupCount += 1;
    vaultList.insertBefore(createEntryNode(entry), emptyState);
  });
  emptyState.classList.toggle("hidden", renderedGroupCount > 0);
}

function fillForm(entry) {
  if (!entry) return;
  siteInput.value = entry.site;
  accountInput.value = entry.account;
  entryPasswordInput.value = entry.password;
  syncPasswordStrength();
  urlInput.value = entry.url;
  state.activePriority = normalizePriority(entry.priority);
  state.editTags = parseTags(entry.tags);
  tagsInput.value = "";
  notesInput.value = entry.notes;
  refreshStatusText();
  syncPriorityPicker();
  syncPinnedToggle();
  renderTagPreview();
  renderReadView(entry);
}

function clearForm() {
  state.activeId = "";
  state.readPasswordVisible = false;
  state.activePriority = "green";
  state.tagInputFocused = false;
  siteInput.value = "";
  accountInput.value = "";
  entryPasswordInput.value = "";
  syncPasswordStrength();
  urlInput.value = "";
  state.editTags = [];
  tagsInput.value = "";
  notesInput.value = "";
  refreshStatusText();
  renderTagPreview();
  renderReadView(null);
  document.querySelectorAll(".vault-item").forEach((node) => node.classList.remove("active"));
  syncPriorityPicker();
  syncPinnedToggle();
  renderTagSuggestions();
  setDetailMode("welcome");
}

function parseTags(value) {
  return value
    .split(/[、/|;；,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function renderTagPreview() {
  tagPreview.innerHTML = "";
  state.editTags.forEach((tag) => {
    const token = document.createElement("span");
    token.className = "tag-token";
    token.title = "双击标签或点击 × 删除";

    const label = document.createElement("span");
    label.textContent = tag;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "tag-remove";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `删除标签 ${tag}`);
    removeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeEditTag(tag);
    });

    token.addEventListener("dblclick", (event) => {
      event.preventDefault();
      removeEditTag(tag);
    });
    token.append(label, removeButton);
    tagPreview.appendChild(token);
  });
  renderTagSuggestions();
}

function addEditTag(tag) {
  const nextTag = tag.trim();
  if (!nextTag) return;
  if (state.editTags.includes(nextTag)) {
    showToast("标签已存在");
    return;
  }
  state.editTags.push(nextTag);
  renderTagPreview();
  showToast("标签已添加");
}

function removeEditTag(tag) {
  state.editTags = state.editTags.filter((value) => value !== tag);
  renderTagPreview();
  showToast("标签已删除");
}

function renderReadView(entry) {
  if (!entry) {
    siteValue.textContent = "-";
    urlValue.textContent = "-";
    accountValue.textContent = "-";
    passwordValue.textContent = "-";
    syncReadPasswordToggle();
    notesValue.textContent = "-";
    readTags.innerHTML = "";
    syncEmptyDetailState();
    return;
  }

  siteValue.textContent = entry.site || "-";
  urlValue.textContent = entry.url || "-";
  accountValue.textContent = entry.account || "-";
  passwordValue.textContent = state.readPasswordVisible ? entry.password || "-" : "••••••••";
  syncReadPasswordToggle();
  notesValue.textContent = entry.notes || "-";
  readTags.innerHTML = "";
  parseTags(entry.tags).forEach((tag) => {
    const token = document.createElement("button");
    token.type = "button";
    token.className = "tag-token read-tag";
    const label = document.createElement("span");
    label.textContent = tag;
    token.appendChild(label);
    token.addEventListener("click", () => {
      confirmWithin(`copy-tag-${tag}`, "再次点击复制标签", () => copyToClipboard(tag, "已复制"));
    });
    token.addEventListener("dblclick", () => {
      if (!state.editing) {
        showToast("先进入编辑才能删除标签");
      }
    });
    readTags.appendChild(token);
  });
  syncEmptyDetailState();
}

function refreshStatusText() {
  const count = getVisibleEntries().length;
  syncTopSyncStatus();
  if (!state.unlocked) {
    syncText.textContent = "等待解锁保险箱";
    return;
  }
  if (state.pendingCloudUpdate) {
    syncText.textContent = "云端有更新，保存或退出编辑后会处理";
    return;
  }
  syncText.textContent = count
    ? `已加载 ${count} 条密码记录，本地加密 vault 已解锁`
    : "当前没有密码记录，可直接新增";
}

function syncReadPasswordToggle() {
  toggleReadPassword.setAttribute("aria-label", state.readPasswordVisible ? "隐藏密码" : "显示密码");
  toggleReadPassword.setAttribute("aria-pressed", String(state.readPasswordVisible));
  toggleReadPassword.querySelector(".eye-open")?.classList.toggle("hidden", state.readPasswordVisible);
  toggleReadPassword.querySelector(".eye-close")?.classList.toggle("hidden", !state.readPasswordVisible);
}

function syncEditorMode() {
  syncDetailSurface();
}

function syncEmptyDetailState() {
  syncDetailSurface();
}

function setEditing(nextEditing) {
  if (nextEditing) {
    setDetailMode("edit");
    return;
  }
  setDetailMode(hasActiveSelection() ? "read" : "welcome");
  if (state.pendingCloudUpdate) {
    runCloudSyncCheck().finally(scheduleCloudSyncCheck);
    return;
  }
  scheduleCloudSyncCheck();
}

function openSettingsView() {
  setDetailMode("settings");
  setSettingsSection(state.settingsSection || "security");
  syncSettingsForm();
  refreshAppInfo();
  refreshDataKeyStatus();
  refreshWebdavConfig();
}

function closeSettingsView() {
  setDetailMode(hasActiveSelection() ? "read" : "welcome");
  if (state.activeId) {
    renderEntries();
    fillForm(getActiveEntry());
  } else {
    renderEntries();
    clearForm();
  }
  scheduleCloudSyncCheck();
}

async function saveSettings() {
  state.settings = normalizeSettings({
    ...state.settings,
    autoLockMinutes: autoLockMinutes?.value,
    clipboardClearSeconds: clipboardClearSeconds?.value,
    cloudCheckMinutes: cloudCheckMinutes?.value,
    passwordLength: passwordLengthSetting?.value,
    copyConfirm: copyConfirmSetting?.checked,
    welcomeOnStart: welcomeSetting?.checked,
    backupBeforeExport: backupExportSetting?.checked,
    folders: state.settings?.folders,
  });
  syncSettingsForm();
  touchActivity();
  await refreshVaultAfterMutation("设置已保存");
  scheduleCloudSyncCheck();
}

function generateStrongPassword(length = 18) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (value) => alphabet[value % alphabet.length]).join("");
}

async function upsertEntry() {
  const site = siteInput.value.trim();
  if (!site) {
    showToast("先填写名称");
    siteInput.focus();
    return;
  }

  const nextEntry = {
    id: state.activeId || makeId(site),
    site,
    account: accountInput.value.trim(),
    password: entryPasswordInput.value.trim(),
    url: urlInput.value.trim(),
    tags: state.editTags.join(" / "),
    notes: notesInput.value.trim(),
    favorite: getActiveEntry()?.favorite || false,
    folderId: getActiveEntry()?.folderId || "",
    pinned: getActiveEntry()?.pinned || pinnedToggle?.getAttribute("aria-pressed") === "true",
    priority: normalizePriority(state.activePriority),
    createdAt: getActiveEntry()?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: getActiveEntry()?.lastUsedAt || new Date().toISOString(),
    status: "已同步",
  };

  const index = state.entries.findIndex((entry) => entry.id === state.activeId);
  if (index >= 0) {
    state.entries[index] = nextEntry;
  } else {
    state.entries.unshift(nextEntry);
    state.activeId = nextEntry.id;
  }

  renderEntries();
  setActiveEntry(nextEntry.id);
  setDetailMode("read");
  await refreshVaultAfterMutation("密码已保存");
}

unlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.vaultCorrupted) {
    showToast("本地保险箱损坏，请先导入备份");
    return;
  }
  const password = masterPassword.value.trim();
  if (!password) {
    showToast("请输入主密码");
    masterPassword.focus();
    return;
  }

  const result = await window.vault?.unlock?.(password);
  if (!result?.ok) {
    if (result?.retryAfter) updateUnlockCooldown(Date.now() + result.retryAfter * 1000);
    showToast(result?.error || "解锁失败");
    return;
  }

  state.unlocked = true;
  state.masterPassword = password;
  window.vault?.showVault?.();
  loadVaultPayload(result.vault);
  showToast(result.needsSetup ? "已创建保险箱" : "已解锁保险箱");
  syncCloudAfterUnlock();
  touchActivity();
});

togglePassword.addEventListener("click", () => {
  const isPassword = masterPassword.type === "password";
  masterPassword.type = isPassword ? "text" : "password";
  togglePassword.setAttribute("aria-label", isPassword ? "隐藏主密码" : "显示主密码");
  togglePassword.setAttribute("aria-pressed", String(isPassword));
  togglePassword.querySelector(".toggle-icon-show")?.classList.toggle("hidden", isPassword);
  togglePassword.querySelector(".toggle-icon-hide")?.classList.toggle("hidden", !isPassword);
});

toggleEntryPassword.addEventListener("click", () => {
  const isPassword = entryPasswordInput.type === "password";
  entryPasswordInput.type = isPassword ? "text" : "password";
  toggleEntryPassword.setAttribute("aria-label", isPassword ? "隐藏密码" : "显示密码");
  toggleEntryPassword.setAttribute("aria-pressed", String(isPassword));
  toggleEntryPassword.querySelector(".toggle-icon-show")?.classList.toggle("hidden", isPassword);
  toggleEntryPassword.querySelector(".toggle-icon-hide")?.classList.toggle("hidden", !isPassword);
});

bioBtn.addEventListener("click", () => {
  if (state.vaultCorrupted || !state.hasVaultFile) {
    importVaultFromFile();
    return;
  }
  openForgotPasswordModal();
});

biometricUnlockBtn?.addEventListener("click", unlockWithBiometric);

newEntryBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  handlePrimaryAction();
});

sidebar?.addEventListener("click", (event) => {
  if (event.target.closest("button, input, textarea, select, label, .vault-item")) return;
  if (isSettingsOpen()) return;
  if (!state.activeId && state.detailMode === "welcome") return;
  clearForm();
  setEditing(false);
  touchActivity();
});

settingsNav?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-settings-section]");
  if (!button) return;
  setSettingsSection(button.dataset.settingsSection);
  touchActivity();
});

editEntryBtn.addEventListener("click", () => {
  if (isSettingsOpen()) {
    closeSettingsView();
    return;
  }
  const entry = getActiveEntry();
  if (!entry && !state.activeId) {
    setEditing(true);
    return;
  }
  setEditing(!state.editing);
  if (state.editing) {
    showToast("进入编辑");
  }
  touchActivity();
});

settingsBtn?.addEventListener("click", () => {
  if (isSettingsOpen()) {
    closeSettingsView();
  } else {
    openSettingsView();
  }
  refreshRecoveryStatus();
  touchActivity();
});

cancelEditBtn.addEventListener("click", () => {
  const entry = getActiveEntry();
  if (entry) {
    fillForm(entry);
  }
  setEditing(false);
  showToast("已取消编辑");
  touchActivity();
});

generatePasswordBtn.addEventListener("click", () => {
  entryPasswordInput.value = generateStrongPassword(state.settings.passwordLength);
  syncPasswordStrength();
  entryPasswordInput.type = "text";
  toggleEntryPassword.setAttribute("aria-pressed", "true");
  toggleEntryPassword.querySelector(".toggle-icon-show")?.classList.add("hidden");
  toggleEntryPassword.querySelector(".toggle-icon-hide")?.classList.remove("hidden");
  showToast("已生成强密码");
  touchActivity();
});

lockBtn?.addEventListener("click", () => {
  lockVaultSilently();
});

changePasswordBtn?.addEventListener("click", openChangePasswordModal);
changePasswordForm?.addEventListener("submit", changeMasterPassword);
closePasswordModalBtn?.addEventListener("click", closeChangePasswordModal);
cancelPasswordChangeBtn?.addEventListener("click", closeChangePasswordModal);
changePasswordModal?.addEventListener("click", (event) => {
  if (event.target === changePasswordModal) closeChangePasswordModal();
});

generateDataKeyBtn?.addEventListener("click", generateDataKeySettings);
saveDataKeyBtn?.addEventListener("click", saveDataKeySettings);
clearDataKeyBtn?.addEventListener("click", clearDataKeySettings);
dataKeyInput?.addEventListener("focus", () => {
  clearSecretMask(dataKeyInput);
});
dataKeyInput?.addEventListener("blur", () => {
  const hasDataKey = Boolean(state.dataKeyStatus?.remembered || state.dataKeyStatus?.sessionActive);
  if (hasDataKey && !dataKeyInput.value.trim()) {
    setSecretMask(dataKeyInput);
  }
});

openRecoverySettingsBtn?.addEventListener("click", openRecoverySettingsModal);
clearRecoveryAnswersBtn?.addEventListener("click", () => {
  recoveryAnswer1.value = "";
  showToast("已清空");
});
recoverySettingsForm?.addEventListener("submit", saveRecoverySettings);
closeRecoverySettingsBtn?.addEventListener("click", closeRecoverySettingsModal);
cancelRecoverySettingsBtn?.addEventListener("click", closeRecoverySettingsModal);
recoverySettingsModal?.addEventListener("click", (event) => {
  if (event.target === recoverySettingsModal) closeRecoverySettingsModal();
});
forgotPasswordForm?.addEventListener("submit", recoverAndUnlock);
closeForgotPasswordBtn?.addEventListener("click", closeForgotPasswordModal);
cancelForgotPasswordBtn?.addEventListener("click", closeForgotPasswordModal);
forgotPasswordModal?.addEventListener("click", (event) => {
  if (event.target === forgotPasswordModal) closeForgotPasswordModal();
});

openUrlBtn?.addEventListener("click", async () => {
  const entry = getActiveEntry();
  const targetUrl = normalizeUrl(entry?.url);
  if (!targetUrl) {
    showToast("当前记录没有网址");
    return;
  }
  const result = await window.vault?.openExternal?.(targetUrl);
  showToast(result?.ok ? "已打开网址" : result?.error || "无法打开网址");
  touchActivity();
});

importVaultBtn?.addEventListener("click", () => {
  const password = state.masterPassword || masterPassword.value.trim();
  if (password) {
    masterPassword.value = password;
  }
  importVaultFromFile();
});

syncBtn?.addEventListener("click", async () => {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  let createdBackup = false;
  if (state.settings.backupBeforeExport) {
    const backup = await window.vault?.createBackup?.("before-export");
    if (!backup?.ok) {
      showToast(backup?.error || "自动备份失败");
      return;
    }
    createdBackup = true;
  }
  const result = await window.vault?.exportVaultFile?.(state.masterPassword, getVaultPayload());
  if (result?.ok) {
    showToast(createdBackup ? "已备份并导出加密文件" : "已导出加密文件");
    touchActivity();
  } else if (!result?.canceled) {
    showToast(result?.error || "导出失败");
  }
});

clearAllEntriesBtn?.addEventListener("click", () => {
  if (!getVisibleEntries().length) {
    showToast("当前没有密码可清空");
    return;
  }
  confirmWithin("clear-all-entries", "再次点击清空全部密码", async () => {
    const now = new Date().toISOString();
    state.entries = state.entries.map((entry) => ({
      ...entry,
      deletedAt: entry.deletedAt || now,
      updatedAt: now,
    }));
    state.activeId = "";
    state.editTags = [];
    state.readPasswordVisible = false;
    state.renamingEntryId = "";
    state.contextEntryId = "";
    hideEntryContextMenu();
    clearForm();
    renderEntries();
    if (await persistVault()) {
      showToast("已清空全部密码");
    }
    touchActivity();
  });
});

biometricToggleBtn?.addEventListener("click", () => {
  toggleBiometricUnlock();
});

saveWebdavBtn?.addEventListener("click", () => {
  saveWebdavConfig();
});

testWebdavBtn?.addEventListener("click", () => {
  testWebdavConnection();
});
webdavAppPassword?.addEventListener("focus", () => {
  clearSecretMask(webdavAppPassword);
});
webdavAppPassword?.addEventListener("blur", () => {
  if (state.syncConfig?.configured && !webdavAppPassword.value.trim()) {
    setSecretMask(webdavAppPassword);
  }
});

uploadWebdavBtn?.addEventListener("click", () => {
  uploadWebdavNow();
});

downloadWebdavBtn?.addEventListener("click", () => {
  downloadWebdavNow();
});

mergeWebdavBtn?.addEventListener("click", () => {
  mergeWebdavNow();
});

checkUpdateBtn?.addEventListener("click", () => {
  checkForAppUpdates();
});

downloadUpdateBtn?.addEventListener("click", () => {
  downloadAppUpdate();
});

openReleaseBtn?.addEventListener("click", () => {
  openReleasePage();
});

deleteEntryBtn.addEventListener("click", () => {
  if (!state.activeId) return showToast("当前没有可删除的记录");
  const entry = getActiveEntry();
  const deleteMessage = "再次点击删除「" + (entry?.site || "当前记录") + "」";
  confirmWithin("delete-" + state.activeId, deleteMessage, async () => {
    const now = new Date().toISOString();
    state.entries = state.entries.map((item) =>
      item.id === state.activeId ? { ...item, deletedAt: now, updatedAt: now } : item,
    );
    state.activeId = getVisibleEntries()[0]?.id ?? "";
    renderEntries();
    if (state.activeId) {
      fillForm(getActiveEntry());
    } else {
      clearForm();
    }
    if (await persistVault()) {
      showToast("已删除");
    }
    touchActivity();
  });
});

searchInput.addEventListener("input", () => {
  renderEntries();
  touchActivity();
});
tagsInput.addEventListener("input", () => {
  const value = tagsInput.value;
  if (/[、/|;；,\s]/.test(value)) {
    parseTags(value).forEach(addEditTag);
    tagsInput.value = "";
  }
  renderTagSuggestions();
  touchActivity();
});
tagsInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  parseTags(tagsInput.value).forEach(addEditTag);
  tagsInput.value = "";
  renderTagSuggestions();
  touchActivity();
});

tagsInput.addEventListener("focus", () => {
  state.tagInputFocused = true;
  renderTagSuggestions();
});

tagsInput.addEventListener("blur", () => {
  setTimeout(() => {
    state.tagInputFocused = false;
    const value = tagsInput.value.trim();
    if (value) {
      parseTags(value).forEach(addEditTag);
      tagsInput.value = "";
    }
    renderTagSuggestions();
  }, 120);
});

tagSuggestions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tag-suggestion]");
  if (!button) return;
  addEditTag(button.dataset.tagSuggestion || "");
  tagsInput.value = "";
  renderTagSuggestions();
  tagsInput.focus();
  touchActivity();
});

priorityPicker?.addEventListener("click", (event) => {
  const button = event.target.closest(".priority-choice");
  if (!button) return;
  applyPriority(button.dataset.priority);
  touchActivity();
});

pinnedToggle?.addEventListener("click", async () => {
  const nextPinned = pinnedToggle.getAttribute("aria-pressed") !== "true";
  pinnedToggle.setAttribute("aria-pressed", String(nextPinned));
  pinnedToggle.querySelector("span:last-child").textContent = nextPinned ? "已置顶" : "不置顶";
  const entry = getActiveEntry();
  if (entry) {
    entry.pinned = nextPinned;
    entry.updatedAt = new Date().toISOString();
    renderEntries();
    await persistVault();
  }
  touchActivity();
});

entryPasswordInput.addEventListener("input", () => {
  syncPasswordStrength();
  touchActivity();
});

tagPreview.addEventListener("dblclick", (event) => {
  const button = event.target.closest(".tag-token");
  if (!button) return;
  const label = button.querySelector("span")?.textContent || "";
  if (label) removeEditTag(label);
});

tagPreview.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".tag-remove");
  if (!removeButton) return;
  event.preventDefault();
  event.stopPropagation();
  const token = removeButton.closest(".tag-token");
  const label = token?.querySelector("span")?.textContent || "";
  if (label) removeEditTag(label);
});

document.querySelectorAll(".detail-tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    const field = tile.dataset.copyField;
    const entry = getActiveEntry();
    if (!entry) return;
    const fieldMap = {
      site: { value: entry.site, label: "名称" },
      url: { value: entry.url, label: "网址" },
      account: { value: entry.account, label: "账号" },
      password: { value: entry.password, label: "密码" },
    };
    const target = fieldMap[field];
    if (!target) return;
    if (state.settings.copyConfirm) {
      confirmWithin("copy-" + entry.id + "-" + field, "再次点击复制" + target.label, () =>
        copyToClipboard(target.value, "已复制"),
      );
    } else {
      copyToClipboard(target.value, "已复制");
    }
    touchActivity();
  });
});

toggleReadPassword?.addEventListener("click", (event) => {
  event.stopPropagation();
  state.readPasswordVisible = !state.readPasswordVisible;
  renderReadView(getActiveEntry());
  touchActivity();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((node) => node.classList.remove("chip-active"));
    chip.classList.add("chip-active");
    state.activeFilter = chip.textContent.trim();
    renderEntries();
    touchActivity();
  });
});

tagFilterSelect?.addEventListener("change", () => {
  state.activeTagFilter = tagFilterSelect.value;
  renderEntries();
  touchActivity();
});

priorityFilterSelect?.addEventListener("change", () => {
  state.activePriorityFilter = priorityFilterSelect.value;
  renderEntries();
  touchActivity();
});

topSyncStatus?.addEventListener("click", () => {
  mergeWebdavNow();
});

[autoLockMinutes, clipboardClearSeconds, cloudCheckMinutes, passwordLengthSetting, copyConfirmSetting, welcomeSetting, backupExportSetting].forEach((node) => {
  node?.addEventListener("change", async () => {
    state.settings = normalizeSettings({
      autoLockMinutes: autoLockMinutes?.value,
      clipboardClearSeconds: clipboardClearSeconds?.value,
      cloudCheckMinutes: cloudCheckMinutes?.value,
      passwordLength: passwordLengthSetting?.value,
      copyConfirm: copyConfirmSetting?.checked,
      welcomeOnStart: welcomeSetting?.checked,
      backupBeforeExport: backupExportSetting?.checked,
      folders: state.settings?.folders,
    });
    syncSettingsForm();
    await refreshVaultAfterMutation("设置已保存");
    scheduleCloudSyncCheck();
    touchActivity();
  });
});

document.querySelectorAll(".nav-item").forEach((nav) => {
  nav.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((node) => node.classList.remove("nav-active"));
    nav.classList.add("nav-active");
  });
});

document.querySelectorAll("[data-window-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.windowAction;
    if (action === "close") window.vault?.closeWindow?.();
    if (action === "minimize") window.vault?.minimizeWindow?.();
    if (action === "maximize") window.vault?.toggleMaximizeWindow?.();
  });
});

entryContextMenu?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-menu-action]");
  if (!button) return;
  const entry = state.entries.find((item) => item.id === state.contextEntryId);
  if (!entry) return hideEntryContextMenu();

  const action = button.dataset.menuAction;
  if (action === "edit") {
    hideEntryContextMenu();
    setActiveEntry(entry.id);
    setEditing(true);
    return;
  }
  if (action === "rename") {
    hideEntryContextMenu();
    renameContextEntry(entry);
    return;
  }
  if (action === "move-folder") {
    await moveEntryToFolder(entry, button.dataset.folderId || "");
    touchActivity();
    return;
  }
  if (action === "toggle-pin") {
    entry.pinned = !entry.pinned;
    hideEntryContextMenu();
    await persistContextEntry(entry.pinned ? "已置顶" : "已取消置顶");
    return;
  }
  if (button.dataset.priority) {
    entry.priority = normalizePriority(button.dataset.priority);
    hideEntryContextMenu();
    await persistContextEntry("优先级已更新");
  }
});

folderContextMenu?.addEventListener("click", async (event) => {
  const priorityButton = event.target.closest("[data-folder-priority]");
  if (priorityButton) {
    const folderId = state.contextFolderId;
    const nextPriority = priorityButton.dataset.folderPriority;
    hideFolderContextMenu();
    if (!getFolder(folderId) || !nextPriority) return;
    await setFolderPriority(folderId, nextPriority);
    touchActivity();
    return;
  }
  const button = event.target.closest("[data-folder-action]");
  if (!button) return;
  const folderId = state.contextFolderId;
  if (!getFolder(folderId)) return hideFolderContextMenu();

  const action = button.dataset.folderAction;
  hideFolderContextMenu();
  if (action === "rename") {
    renameContextFolder(folderId);
    touchActivity();
    return;
  }
  if (action === "delete") {
    await deleteContextFolder(folderId);
    touchActivity();
  }
});

sidebarContextMenu?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-sidebar-action]");
  if (!button) return;
  const action = button.dataset.sidebarAction;
  hideSidebarContextMenu();
  if (action !== "new-folder") return;
  if (!state.unlocked) {
    showToast("请先解锁保险箱");
    return;
  }
  if (isSettingsOpen()) {
    showToast("请先退出设置页");
    return;
  }
  await createFolder();
  touchActivity();
});

sidebar?.addEventListener("contextmenu", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest("[data-entry]") || target.closest("[data-folder]")) return;
  if (target.closest("input, select, button, .settings-nav")) return;
  showSidebarContextMenu(event);
});

window.addEventListener("mousemove", touchActivity, { passive: true });
window.addEventListener("pointerdown", touchActivity, { passive: true });
window.addEventListener("scroll", touchActivity, { passive: true });
window.addEventListener("keydown", (event) => {
  touchActivity();
  if (event.key === "Escape") {
    hideEntryContextMenu();
    hideFolderContextMenu();
    hideSidebarContextMenu();
  }
});
window.addEventListener("click", (event) => {
  if (entryContextMenu?.contains(event.target)) return;
  if (folderContextMenu?.contains(event.target)) return;
  if (sidebarContextMenu?.contains(event.target)) return;
  hideEntryContextMenu();
  hideFolderContextMenu();
  hideSidebarContextMenu();
});

function showMainVault(payload) {
  if (!payload?.masterPassword) {
    return;
  }
  state.masterPassword = payload.masterPassword;
  state.unlocked = true;
  resetDetailSurface();
  if (document.body.classList.contains("auth-mode")) {
    document.body.classList.remove("auth-mode");
    authScreen.classList.add("hidden");
    vaultScreen.classList.remove("hidden");
  }
  if (payload?.vault) {
    loadVaultPayload(payload.vault);
  }
  if (state.settings.welcomeOnStart) {
    clearForm();
  }
  syncPrimaryActionButton();
  syncDetailSurface();
}

window.vault?.onShowVault?.(showMainVault);

window.vault?.onVaultUpdated?.((payload) => {
  if (payload?.masterPassword) {
    state.masterPassword = payload.masterPassword;
    state.unlocked = true;
  }
  if (!state.unlocked) {
    showMainVault(payload);
    return;
  }
  if (payload?.vault) {
    loadVaultPayload(payload.vault, { preserveView: true });
  }
});

window.vault?.onClearAuth?.(() => {
  clearCloudSyncTimer();
  closeChangePasswordModal();
  clearSensitiveInputs();
  refreshRecoveryStatus();
  refreshDataKeyStatus();
});

window.vault?.onUpdateDownloadProgress?.((progress) => {
  state.updateDownloadProgress = {
    ...state.updateDownloadProgress,
    ...progress,
  };
  syncUpdateSettings();
});

window.vault?.onStatus?.((status) => {
  state.hasVaultFile = Boolean(status?.hasVault);
  state.vaultCorrupted = Boolean(status?.corrupted);
  if (status?.biometric) {
    state.biometricStatus = {
      supported: Boolean(status.biometric.supported),
      configured: Boolean(status.biometric.configured),
      corrupted: Boolean(status.biometric.corrupted),
      updatedAt: status.biometric.updatedAt || "",
      unavailableReason: status.biometric.unavailableReason || "",
    };
  }
  if (status?.dataKey) {
    state.dataKeyStatus = {
      supported: Boolean(status.dataKey.supported),
      remembered: Boolean(status.dataKey.remembered),
      sessionActive: Boolean(status.dataKey.sessionActive),
      corrupted: Boolean(status.dataKey.corrupted),
      updatedAt: status.dataKey.updatedAt || "",
      unavailableReason: status.dataKey.unavailableReason || "",
    };
  }
  updateUnlockCooldown(status?.lockedUntil);
  if (state.vaultCorrupted) {
    unlockPrimaryBtn.textContent = "无法解锁";
    authHelper.textContent = "本地保险箱文件可能损坏，请从备份文件恢复。";
  } else {
    unlockPrimaryBtn.textContent = state.hasVaultFile ? "解锁" : "创建保险箱";
    authHelper.textContent = state.hasVaultFile
      ? "输入主密码解锁；忘记密码时可使用已设置的安全问题。"
      : "首次输入主密码会创建新的加密保险箱。";
  }
  syncAuthSecondaryAction();
  syncBiometricSettings();
  syncDataKeySettings();
  refreshStatusText();
  refreshRecoveryStatus();
  syncDetailSurface();
});

queueMicrotask(() => {
  refreshAppInfo();
  initAuthState();
  syncDetailSurface();
});
