const PRIORITY_ORDER = {
  red: 4,
  yellow: 3,
  blue: 2,
  green: 1,
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

function parseTags(value) {
  return value
    .split(/[、/|;；,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
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
    avatar: String(settings.avatar || ""),
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

function makeId(site) {
  return `${site || "entry"}-${Date.now().toString(36)}`;
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

function formatEntryTagLine(value) {
  const tags = parseTags(value);
  return tags.length ? tags.join(" · ") : "无标签";
}
