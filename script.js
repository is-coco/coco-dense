const authScreen = document.getElementById("authScreen");
const vaultScreen = document.getElementById("vaultScreen");
const unlockForm = document.getElementById("unlockForm");
const togglePassword = document.getElementById("togglePassword");
const masterPassword = document.getElementById("masterPassword");
const bioBtn = document.getElementById("bioBtn");
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
const readView = document.getElementById("readView");
const editView = document.getElementById("editView");
const emptyDetailState = document.getElementById("emptyDetailState");
const settingsView = document.getElementById("settingsView");
const detailModeLabel = document.getElementById("detailModeLabel");
const entryContextMenu = document.getElementById("entryContextMenu");
const siteValue = document.getElementById("siteValue");
const urlValue = document.getElementById("urlValue");
const accountValue = document.getElementById("accountValue");
const passwordValue = document.getElementById("passwordValue");
const toggleReadPassword = document.getElementById("toggleReadPassword");
const notesValue = document.getElementById("notesValue");
const readTags = document.getElementById("readTags");
const syncText = document.getElementById("syncText");
const syncBtn = document.getElementById("syncBtn");
const importVaultBtn = document.getElementById("importVaultBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const entryPasswordStrength = document.getElementById("entryPasswordStrength");
const priorityPicker = document.getElementById("priorityPicker");
const pinnedToggle = document.getElementById("pinnedToggle");
const autoLockMinutes = document.getElementById("autoLockMinutes");
const clipboardClearSeconds = document.getElementById("clipboardClearSeconds");
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
const forgotPasswordError = document.getElementById("forgotPasswordError");
const closeForgotPasswordBtn = document.getElementById("closeForgotPasswordBtn");
const cancelForgotPasswordBtn = document.getElementById("cancelForgotPasswordBtn");
const submitForgotPasswordBtn = document.getElementById("submitForgotPasswordBtn");
const recoveryStatusText = document.getElementById("recoveryStatusText");
const recoveryStatusPill = document.getElementById("recoveryStatusPill");
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

const PRIORITY_ORDER = {
  red: 4,
  yellow: 3,
  blue: 2,
  green: 1,
};

const PRIORITY_LABELS = {
  red: "高优先级",
  yellow: "中优先级",
  blue: "普通",
  green: "低优先级",
};

const state = {
  entries: [],
  activeId: "",
  unlocked: false,
  editing: false,
  editTags: [],
  pendingActions: {},
  readPasswordVisible: false,
  masterPassword: "",
  vaultMeta: null,
  settings: {
    autoLockMinutes: 5,
    clipboardClearSeconds: 30,
    passwordLength: 18,
    copyConfirm: true,
    welcomeOnStart: true,
    backupBeforeExport: true,
  },
  autoLockTimer: null,
  clipboardTimer: null,
  hasVaultFile: false,
  vaultCorrupted: false,
  lockedUntil: 0,
  activeFilter: "全部",
  activePriority: "green",
  contextEntryId: "",
  renamingEntryId: "",
  recoveryStatus: {
    configured: false,
    corrupted: false,
    questions: [],
    updatedAt: "",
  },
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

function normalizeSettings(settings = {}) {
  const autoLockMinutesValue = Number(settings.autoLockMinutes);
  const clipboardSecondsValue = Number(settings.clipboardClearSeconds);
  const passwordLengthValue = Number(settings.passwordLength);
  return {
    autoLockMinutes: Number.isFinite(autoLockMinutesValue) ? autoLockMinutesValue : 5,
    clipboardClearSeconds: Number.isFinite(clipboardSecondsValue) ? clipboardSecondsValue : 30,
    passwordLength: Math.min(40, Math.max(8, Number.isFinite(passwordLengthValue) ? passwordLengthValue : 18)),
    copyConfirm: settings.copyConfirm !== false,
    welcomeOnStart: settings.welcomeOnStart !== false,
    backupBeforeExport: settings.backupBeforeExport !== false,
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
    favorite: Boolean(entry?.favorite),
    pinned: Boolean(entry?.pinned),
    priority,
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
  currentMasterPassword.value = "";
  nextMasterPassword.value = "";
  confirmMasterPassword.value = "";
  entryPasswordInput.value = "";
  forgotAnswer1.value = "";
  recoveryAnswer1.value = "";
  masterPassword.type = "password";
  entryPasswordInput.type = "password";
  forgotAnswer1.type = "password";
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
  state.editing = false;
  state.readPasswordVisible = false;
  renderEntries();
  fillForm(getActiveEntry());
  syncEditorMode();
  syncEmptyDetailState();
}

function getActiveEntry() {
  if (!state.activeId) return null;
  return state.entries.find((entry) => entry.id === state.activeId) ?? null;
}

function copyToClipboard(text, successMessage) {
  const value = String(text ?? "");
  if (window.vault?.copyText) {
    return window.vault
      .copyText(value)
      .then(() => {
        showToast(successMessage);
        clearClipboardLater();
      })
      .catch(() => showToast("复制失败"));
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

  if (settingsView && !settingsView.classList.contains("hidden")) {
    closeSettingsView();
    return;
  }

  clearForm();
  setEditing(true);
  showToast("新建模式");
  touchActivity();
}

function confirmWithin(actionKey, firstMessage, onConfirm, windowMs = 3000) {
  const now = Date.now();
  if (!state.pendingActions[actionKey] || now - state.pendingActions[actionKey] > windowMs) {
    state.pendingActions[actionKey] = now;
    showToast(firstMessage);
    return;
  }

  delete state.pendingActions[actionKey];
  onConfirm();
}

function makeId(site) {
  return `${site || "entry"}-${Date.now().toString(36)}`;
}

function getVaultPayload() {
  return {
    version: 1,
    createdAt: state.vaultMeta?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entries: state.entries,
    settings: state.settings,
  };
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

function isSettingsOpen() {
  return Boolean(settingsView && !settingsView.classList.contains("hidden"));
}

function syncSettingsModeClass() {
  content?.classList.toggle("settings-mode", isSettingsOpen());
}

function resetDetailSurface() {
  settingsView?.classList.add("hidden");
  content?.classList.remove("settings-mode");
  state.editing = false;
  state.readPasswordVisible = false;
  cancelEditBtn?.classList.add("hidden");
  generatePasswordBtn?.classList.add("hidden");
}

function syncSettingsForm() {
  if (autoLockMinutes) autoLockMinutes.value = String(state.settings.autoLockMinutes);
  if (clipboardClearSeconds) clipboardClearSeconds.value = String(state.settings.clipboardClearSeconds);
  if (passwordLengthSetting) passwordLengthSetting.value = String(state.settings.passwordLength);
  if (copyConfirmSetting) copyConfirmSetting.checked = Boolean(state.settings.copyConfirm);
  if (welcomeSetting) welcomeSetting.checked = Boolean(state.settings.welcomeOnStart);
  if (backupExportSetting) backupExportSetting.checked = Boolean(state.settings.backupBeforeExport);
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

function syncDetailMode() {
  const editing = state.editing;
  readView.classList.toggle("hidden", editing);
  editView.classList.toggle("hidden", !editing);
  settingsView?.classList.add("hidden");
  cancelEditBtn.classList.toggle("hidden", !editing);
  generatePasswordBtn.classList.toggle("hidden", !editing);
  openUrlBtn?.classList.toggle("hidden", editing);
  editEntryBtn.textContent = editing ? "查看" : "编辑";
  detailModeLabel.textContent = editing ? "编辑条目" : "查看详情";
  if (editing) {
    siteInput.focus({ preventScroll: true });
  }
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
  forgotPasswordError.textContent = "";
  forgotPasswordError.classList.add("hidden");
  forgotPasswordForm.classList.toggle("hidden", !state.recoveryStatus.configured);
  forgotPasswordUnavailable.classList.toggle("hidden", state.recoveryStatus.configured);
  if (state.recoveryStatus.configured) {
    forgotQuestion1.textContent = state.recoveryStatus.questions?.[0] || "安全问题";
  }
  forgotPasswordModal.classList.remove("hidden");
  forgotPasswordModal.setAttribute("aria-hidden", "false");
  (state.recoveryStatus.configured ? forgotAnswer1 : closeForgotPasswordBtn).focus({ preventScroll: true });
}

function closeForgotPasswordModal() {
  forgotPasswordModal.classList.add("hidden");
  forgotPasswordModal.setAttribute("aria-hidden", "true");
  forgotPasswordForm.reset();
  forgotPasswordError.textContent = "";
  forgotPasswordError.classList.add("hidden");
}

function showForgotPasswordError(message) {
  forgotPasswordError.textContent = message;
  forgotPasswordError.classList.remove("hidden");
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

syncRecoverySettings = function patchedSyncRecoverySettings() {
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
  const question = status.questions?.[0];
  if (question && recoveryQuestion1) recoveryQuestion1.value = question;
};

openForgotPasswordModal = function patchedOpenForgotPasswordModal() {
  if (state.vaultCorrupted) {
    showToast("本地保险箱损坏，无法找回");
    return;
  }
  forgotPasswordError.textContent = "";
  forgotPasswordError.classList.add("hidden");
  forgotPasswordUnavailable.classList.toggle("hidden", state.recoveryStatus.configured);
  forgotPasswordForm.classList.toggle("hidden", !state.recoveryStatus.configured);
  if (state.recoveryStatus.configured) {
    forgotQuestion1.textContent = state.recoveryStatus.questions?.[0] || "安全问题";
  }
  forgotPasswordModal.classList.remove("hidden");
  forgotPasswordModal.setAttribute("aria-hidden", "false");
  (state.recoveryStatus.configured ? forgotAnswer1 : closeForgotPasswordBtn).focus({ preventScroll: true });
};

saveRecoverySettings = async function patchedSaveRecoverySettings(event) {
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
};

recoverAndUnlock = async function patchedRecoverAndUnlock(event) {
  event?.preventDefault();
  const answers = [forgotAnswer1.value];
  if (!answers[0].trim()) {
    showForgotPasswordError("请填写答案");
    return;
  }

  submitForgotPasswordBtn.disabled = true;
  submitForgotPasswordBtn.textContent = "正在验证";
  const result = await window.vault?.recoverWithAnswers?.(answers);
  submitForgotPasswordBtn.disabled = false;
  submitForgotPasswordBtn.textContent = "验证并解锁";
  if (!result?.ok) {
    showForgotPasswordError(result?.error || "验证失败");
    return;
  }

  state.unlocked = true;
  state.masterPassword = result.masterPassword;
  closeForgotPasswordModal();
  masterPassword.value = "";
  window.vault?.showVault?.();
  state.editing = false;
  loadVaultPayload(result.vault);
  showToast("已通过安全问题解锁");
  touchActivity();
};

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

function placeEntryContextMenu(x, y) {
  if (!entryContextMenu) return;
  entryContextMenu.classList.remove("hidden");
  entryContextMenu.setAttribute("aria-hidden", "false");
  const rect = entryContextMenu.getBoundingClientRect();
  const margin = 10;
  const left = Math.min(x, window.innerWidth - rect.width - margin);
  const top = Math.min(y, window.innerHeight - rect.height - margin);
  entryContextMenu.style.left = `${Math.max(margin, left)}px`;
  entryContextMenu.style.top = `${Math.max(margin, top)}px`;
}

function showEntryContextMenu(event, entry) {
  if (!entryContextMenu || !entry) return;
  event.preventDefault();
  event.stopPropagation();
  state.contextEntryId = entry.id;
  setActiveEntry(entry.id);

  const pinLabel = entryContextMenu.querySelector('[data-menu-action="toggle-pin"] .menu-label');
  const favoriteLabel = entryContextMenu.querySelector('[data-menu-action="toggle-favorite"] .menu-label');
  if (pinLabel) pinLabel.textContent = entry.pinned ? "取消置顶" : "置顶";
  if (favoriteLabel) favoriteLabel.textContent = entry.favorite ? "取消收藏" : "收藏";
  entryContextMenu.querySelectorAll("[data-priority]").forEach((button) => {
    button.classList.toggle("active", button.dataset.priority === normalizePriority(entry.priority));
  });
  placeEntryContextMenu(event.clientX, event.clientY);
}

async function persistContextEntry(message = "已更新") {
  renderEntries();
  const entry = getActiveEntry();
  if (entry) {
    fillForm(entry);
  }
  if (await persistVault()) {
    showToast(message);
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
  await persistContextEntry("名称已修改");
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
  const answers = [forgotAnswer1.value];
  if (!answers[0].trim()) {
    showForgotPasswordError("请填写答案");
    return;
  }

  submitForgotPasswordBtn.disabled = true;
  submitForgotPasswordBtn.textContent = "正在验证";
  const result = await window.vault?.recoverWithAnswers?.(answers);
  submitForgotPasswordBtn.disabled = false;
  submitForgotPasswordBtn.textContent = "验证并解锁";
  if (!result?.ok) {
    showForgotPasswordError(result?.error || "验证失败");
    return;
  }

  state.unlocked = true;
  state.masterPassword = result.masterPassword;
  closeForgotPasswordModal();
  masterPassword.value = "";
  window.vault?.showVault?.();
  state.editing = false;
  loadVaultPayload(result.vault);
  showToast("已通过安全问题解锁");
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
  const result = await window.vault?.importVaultFile?.(password);
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
  const payload = getVaultPayload();
  const result = await window.vault?.saveVault?.(state.masterPassword, payload);
  if (!result?.ok) {
    showToast("保存失败");
    return false;
  }
  state.vaultMeta = {
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
  state.hasVaultFile = true;
  return true;
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

function loadVaultPayload(payload) {
  resetDetailSurface();
  state.entries = Array.isArray(payload?.entries) ? payload.entries.map(normalizeEntry) : [];
  state.settings = normalizeSettings(payload?.settings);
  state.vaultMeta = {
    createdAt: payload?.createdAt || new Date().toISOString(),
    updatedAt: payload?.updatedAt || new Date().toISOString(),
  };
  state.activeId = "";
  applyPriority("green");
  syncSettingsForm();
  renderEntries();
  clearForm();
  state.editing = false;
  refreshStatusText();
  syncDetailMode();
  syncEmptyDetailState();
  touchActivity();
}

const originalLoadVaultPayload = loadVaultPayload;
loadVaultPayload = function patchedLoadVaultPayload(payload) {
  originalLoadVaultPayload(payload);
  refreshRecoveryStatus();
};

async function initAuthState() {
  const status = await window.vault?.getStatus?.();
  state.hasVaultFile = Boolean(status?.hasVault);
  state.vaultCorrupted = Boolean(status?.corrupted);
  await refreshRecoveryStatus();
  if (state.vaultCorrupted) {
    unlockPrimaryBtn.textContent = "无法解锁";
    authHelper.textContent = "本地保险箱文件可能损坏，请从备份文件恢复。";
  } else {
    unlockPrimaryBtn.textContent = state.hasVaultFile ? "解锁" : "创建保险箱";
    authHelper.textContent = state.hasVaultFile
      ? "输入主密码解锁；忘记密码时可使用已设置的安全问题。"
      : "首次输入主密码会创建新的加密保险箱。";
  }
  refreshStatusText();
}

function renderEntries() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = sortEntries(state.entries.filter((entry) => {
    if (state.activeFilter === "收藏" && !entry.favorite) return false;
    if (state.activeFilter === "最近" && !entry.lastUsedAt) return false;
    if (!query) return true;
    const haystack = buildSearchIndex(entry);
    const queryInitials = window.vault?.toPinyinInitials?.(searchInput.value.trim()) || "";
    return haystack.includes(query) || (queryInitials && haystack.includes(queryInitials));
  }));

  vaultList.querySelectorAll("[data-entry]").forEach((node) => node.remove());

  emptyState.classList.toggle("hidden", filtered.length > 0);

  filtered.forEach((entry) => {
    const priority = normalizePriority(entry.priority);
    const isRenaming = state.renamingEntryId === entry.id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `vault-item${entry.id === state.activeId ? " active" : ""}`;
    button.setAttribute("role", "listitem");
    button.dataset.entry = entry.id;
    const safeSite = String(entry.site || "").replace(/"/g, "&quot;");
    const nameHtml = isRenaming
      ? `<input class="rename-input" data-rename-input="${entry.id}" value="${safeSite}" aria-label="修改名称" />`
      : `<strong>${entry.site}</strong>`;
    const badgeClass = entry.pinned ? " pin" : entry.favorite ? " warn" : ` priority-${priority}`;
    const badgeText = entry.pinned ? "置顶" : entry.favorite ? "收藏" : PRIORITY_LABELS[priority];
    button.innerHTML = `
      <div class="vault-item-row">
        <span class="priority-dot ${priority}"></span>
        <div class="item-main">
          ${nameHtml}
          <span>${entry.account}</span>
        </div>
      </div>
      <span class="badge${badgeClass}">${badgeText}</span>
    `;
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
    vaultList.insertBefore(button, emptyState);
  });
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
  state.editing = false;
  state.activePriority = "green";
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
  editEntryBtn.textContent = "查看";
  syncPriorityPicker();
  syncPinnedToggle();
  syncPrimaryActionButton();
  syncEmptyDetailState();
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
    token.innerHTML = `<span>${tag}</span>`;
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
  favoriteEntryBtn.textContent = entry.favorite ? "取消收藏" : "收藏";
  syncEmptyDetailState();
}

function refreshStatusText() {
  const count = state.entries.length;
  if (!state.unlocked) {
    syncText.textContent = "等待解锁保险箱";
    return;
  }
  syncText.textContent = count
    ? `已加载 ${count} 个条目，本地加密 vault 已解锁`
    : "当前没有条目，可直接新增";
}

function syncReadPasswordToggle() {
  toggleReadPassword.setAttribute("aria-label", state.readPasswordVisible ? "隐藏密码" : "显示密码");
  toggleReadPassword.setAttribute("aria-pressed", String(state.readPasswordVisible));
  toggleReadPassword.querySelector(".eye-open")?.classList.toggle("hidden", state.readPasswordVisible);
  toggleReadPassword.querySelector(".eye-close")?.classList.toggle("hidden", !state.readPasswordVisible);
}

function syncEditorMode() {
  syncDetailMode();
  const editing = state.editing;
  const settingsOpen = settingsView && !settingsView.classList.contains("hidden");
  cancelEditBtn.classList.toggle("hidden", !editing);
  generatePasswordBtn.classList.toggle("hidden", !editing);
  openUrlBtn?.classList.toggle("hidden", editing || settingsOpen);
  editEntryBtn.textContent = settingsOpen ? "返回" : editing ? "查看" : "编辑";
  detailModeLabel.textContent = settingsOpen ? "设置" : editing ? "编辑条目" : "查看详情";
  syncPrimaryActionButton();
  if (editing) siteInput.focus({ preventScroll: true });
  syncEmptyDetailState();
}

function syncEmptyDetailState() {
  if (!emptyDetailState) return;
  const hasSelection = Boolean(state.activeId && state.entries.some((entry) => entry.id === state.activeId));
  const settingsOpen = settingsView && !settingsView.classList.contains("hidden");
  const showEmpty = !settingsOpen && !hasSelection && !state.editing;
  content?.classList.toggle("empty-detail-mode", showEmpty);
  emptyDetailState.classList.toggle("hidden", !showEmpty);
  readView.classList.toggle("hidden", showEmpty || state.editing || settingsOpen);
  editView.classList.toggle("hidden", !state.editing || settingsOpen);
  openUrlBtn?.classList.toggle("hidden", showEmpty || state.editing || settingsOpen);
  favoriteEntryBtn?.classList.toggle("hidden", showEmpty || settingsOpen);
  deleteEntryBtn?.classList.toggle("hidden", showEmpty || settingsOpen);
}

function setEditing(nextEditing) {
  state.editing = nextEditing;
  syncEditorMode();
}

function openSettingsView() {
  state.editing = false;
  renderEntries();
  settingsView?.classList.remove("hidden");
  syncSettingsModeClass();
  emptyDetailState?.classList.add("hidden");
  readView.classList.add("hidden");
  editView.classList.add("hidden");
  cancelEditBtn.classList.add("hidden");
  generatePasswordBtn.classList.add("hidden");
  openUrlBtn?.classList.add("hidden");
  favoriteEntryBtn?.classList.add("hidden");
  deleteEntryBtn?.classList.add("hidden");
  content?.classList.remove("empty-detail-mode");
  detailModeLabel.textContent = "设置";
  editEntryBtn.textContent = "返回";
  syncPrimaryActionButton();
  syncSettingsForm();
}

function closeSettingsView() {
  settingsView?.classList.add("hidden");
  syncSettingsModeClass();
  syncEditorMode();
  syncEmptyDetailState();
  if (state.activeId) {
    renderEntries();
    fillForm(getActiveEntry());
  } else {
    renderEntries();
    clearForm();
  }
}

async function saveSettings() {
  state.settings = normalizeSettings({
    autoLockMinutes: autoLockMinutes?.value,
    clipboardClearSeconds: clipboardClearSeconds?.value,
    passwordLength: passwordLengthSetting?.value,
    copyConfirm: copyConfirmSetting?.checked,
    welcomeOnStart: welcomeSetting?.checked,
    backupBeforeExport: backupExportSetting?.checked,
  });
  syncSettingsForm();
  touchActivity();
  await refreshVaultAfterMutation("设置已保存");
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
    pinned: getActiveEntry()?.pinned || pinnedToggle?.getAttribute("aria-pressed") === "true",
    priority: normalizePriority(state.activePriority),
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
  state.editing = false;
  syncEditorMode();
  await refreshVaultAfterMutation("条目已保存");
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
  state.editing = false;
  loadVaultPayload(result.vault);
  showToast(result.needsSetup ? "已创建保险箱" : "已解锁保险箱");
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

bioBtn.addEventListener("click", openForgotPasswordModal);

newEntryBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  handlePrimaryAction();
});

sidebar?.addEventListener("click", (event) => {
  if (event.target.closest("button, input, textarea, select, label, .vault-item")) return;
  if (!state.activeId && !state.editing) return;
  clearForm();
  setEditing(false);
  touchActivity();
});

editEntryBtn.addEventListener("click", () => {
  if (settingsView && !settingsView.classList.contains("hidden")) {
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
  openSettingsView();
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

favoriteEntryBtn.addEventListener("click", async () => {
  const entry = getActiveEntry();
  if (!entry) return showToast("当前没有条目");
  entry.favorite = !entry.favorite;
  renderEntries();
  renderReadView(entry);
  if (await persistVault()) {
    showToast(entry.favorite ? "已收藏" : "已取消收藏");
  }
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
    showToast("当前条目没有网址");
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
  openForgotPasswordModal();
});

syncBtn?.addEventListener("click", async () => {
  if (!state.unlocked || !state.masterPassword) {
    showToast("请先解锁保险箱");
    return;
  }
  if (state.settings.backupBeforeExport) {
    const backup = await window.vault?.createBackup?.("before-export");
    if (!backup?.ok) {
      showToast(backup?.error || "自动备份失败");
      return;
    }
  }
  const result = await window.vault?.exportVaultFile?.(state.masterPassword, getVaultPayload());
  if (result?.ok) {
    showToast("已备份并导出加密文件");
    touchActivity();
  } else if (!result?.canceled) {
    showToast("导出失败");
  }
});

clearAllEntriesBtn?.addEventListener("click", () => {
  if (!state.entries.length) {
    showToast("当前没有密码可清空");
    return;
  }
  confirmWithin("clear-all-entries", "再次点击清空全部密码", async () => {
    state.entries = [];
    state.activeId = "";
    state.editing = false;
    state.editTags = [];
    state.readPasswordVisible = false;
    state.renamingEntryId = "";
    state.contextEntryId = "";
    hideEntryContextMenu();
    clearForm();
    renderEntries();
    syncEmptyDetailState();
    if (await persistVault()) {
      showToast("已清空全部密码");
    }
    touchActivity();
  });
});

deleteEntryBtn.addEventListener("click", () => {
  if (!state.activeId) return showToast("当前没有可删除的条目");
  const entry = getActiveEntry();
  const deleteMessage = "再次点击删除「" + (entry?.site || "当前条目") + "」";
  confirmWithin("delete-" + state.activeId, deleteMessage, () => {
    state.entries = state.entries.filter((item) => item.id !== state.activeId);
    state.activeId = state.entries[0]?.id ?? "";
    renderEntries();
    if (state.activeId) {
      fillForm(getActiveEntry());
    } else {
      clearForm();
    }
    persistVault().then((ok) => ok && showToast("已删除")).catch(() => showToast("保存失败"));
    touchActivity();
  });
});

searchInput.addEventListener("input", () => {
  renderEntries();
  touchActivity();
});
tagsInput.addEventListener("input", () => {
  const value = tagsInput.value;
  if (!/[、/|;；,\s]/.test(value)) return;
  parseTags(value).forEach(addEditTag);
  tagsInput.value = "";
  touchActivity();
});
tagsInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  parseTags(tagsInput.value).forEach(addEditTag);
  tagsInput.value = "";
  touchActivity();
});

tagsInput.addEventListener("blur", () => {
  const value = tagsInput.value.trim();
  if (!value) return;
  parseTags(value).forEach(addEditTag);
  tagsInput.value = "";
});

priorityPicker?.addEventListener("click", (event) => {
  const button = event.target.closest(".priority-choice");
  if (!button) return;
  applyPriority(button.dataset.priority);
  touchActivity();
});

pinnedToggle?.addEventListener("click", () => {
  const nextPinned = pinnedToggle.getAttribute("aria-pressed") !== "true";
  pinnedToggle.setAttribute("aria-pressed", String(nextPinned));
  pinnedToggle.querySelector("span:last-child").textContent = nextPinned ? "已置顶" : "不置顶";
  const entry = getActiveEntry();
  if (entry) {
    entry.pinned = nextPinned;
    renderEntries();
    persistVault().catch(() => showToast("保存失败"));
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

[autoLockMinutes, clipboardClearSeconds, passwordLengthSetting, copyConfirmSetting, welcomeSetting, backupExportSetting].forEach((node) => {
  node?.addEventListener("change", async () => {
    state.settings = normalizeSettings({
      autoLockMinutes: autoLockMinutes?.value,
      clipboardClearSeconds: clipboardClearSeconds?.value,
      passwordLength: passwordLengthSetting?.value,
      copyConfirm: copyConfirmSetting?.checked,
      welcomeOnStart: welcomeSetting?.checked,
      backupBeforeExport: backupExportSetting?.checked,
    });
    syncSettingsForm();
    await refreshVaultAfterMutation("设置已保存");
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
  if (action === "toggle-pin") {
    entry.pinned = !entry.pinned;
    hideEntryContextMenu();
    await persistContextEntry(entry.pinned ? "已置顶" : "已取消置顶");
    return;
  }
  if (action === "toggle-favorite") {
    entry.favorite = !entry.favorite;
    hideEntryContextMenu();
    await persistContextEntry(entry.favorite ? "已收藏" : "已取消收藏");
    return;
  }
  if (button.dataset.priority) {
    entry.priority = normalizePriority(button.dataset.priority);
    hideEntryContextMenu();
    await persistContextEntry("优先级已更新");
  }
});

window.addEventListener("mousemove", touchActivity, { passive: true });
window.addEventListener("pointerdown", touchActivity, { passive: true });
window.addEventListener("scroll", touchActivity, { passive: true });
window.addEventListener("keydown", (event) => {
  touchActivity();
  if (event.key === "Escape") hideEntryContextMenu();
});
window.addEventListener("click", (event) => {
  if (entryContextMenu?.contains(event.target)) return;
  hideEntryContextMenu();
});

function showMainVault(payload) {
  if (payload?.masterPassword) {
    state.masterPassword = payload.masterPassword;
    state.unlocked = true;
  }
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
    syncEmptyDetailState();
  }
  syncPrimaryActionButton();
  syncEmptyDetailState();
}

window.vault?.onShowVault?.(showMainVault);

window.vault?.onClearAuth?.(() => {
  closeChangePasswordModal();
  clearSensitiveInputs();
  refreshRecoveryStatus();
});

window.vault?.onStatus?.((status) => {
  state.hasVaultFile = Boolean(status?.hasVault);
  state.vaultCorrupted = Boolean(status?.corrupted);
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
  refreshStatusText();
  refreshRecoveryStatus();
  syncEmptyDetailState();
});

queueMicrotask(() => {
  initAuthState();
  syncEmptyDetailState();
});









