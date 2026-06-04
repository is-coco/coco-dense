"use strict";

const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { Readable, Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");

const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/is-coco/coco-dense/releases/latest";
const GITHUB_DOWNLOAD_MIRRORS = [
  "https://ghfast.top/",
  "https://ghproxy.cn/",
];

let currentDownloadController = null;
let currentDownloadFilePath = null;
let downloadCancelledByUser = false;

function validateExternalUrl(targetUrl) {
  try {
    const parsed = new URL(String(targetUrl ?? "").trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: "只允许打开 http 或 https 链接" };
    }
    return { ok: true, href: parsed.href };
  } catch {
    return { ok: false, error: "网址格式无效" };
  }
}

function normalizeVersion(version) {
  return String(version ?? "").trim().replace(/^v/i, "").split("-")[0];
}

function compareVersions(currentVersion, nextVersion) {
  const currentParts = normalizeVersion(currentVersion).split(".").map((part) => Number(part) || 0);
  const nextParts = normalizeVersion(nextVersion).split(".").map((part) => Number(part) || 0);
  const length = Math.max(currentParts.length, nextParts.length);
  for (let index = 0; index < length; index += 1) {
    const current = currentParts[index] || 0;
    const next = nextParts[index] || 0;
    if (next > current) return 1;
    if (next < current) return -1;
  }
  return 0;
}

function selectReleaseAsset(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "darwin") {
    const dmgAssets = assets.filter((asset) => /\.dmg$/i.test(asset?.name || ""));
    return (
      dmgAssets.find((asset) => arch === "arm64" && /arm64/i.test(asset.name || "")) ||
      dmgAssets[0] ||
      assets.find((asset) => /\.zip$/i.test(asset?.name || ""))
    );
  }
  if (platform === "win32") {
    const exeAssets = assets.filter((asset) => /\.exe$/i.test(asset?.name || ""));
    return (
      exeAssets.find((asset) => /[-_]Setup\.exe$/i.test(asset.name || "")) ||
      exeAssets.find((asset) => /[-_]installer\.exe$/i.test(asset.name || "")) ||
      exeAssets[0] ||
      null
    );
  }
  return null;
}

async function fetchLatestRelease() {
  const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Coco-Dense-Updater",
    },
  });
  if (!response.ok) {
    return { ok: false, error: `检查更新失败：${response.status}` };
  }
  return { ok: true, release: await response.json() };
}

function normalizeReleaseInfo(release) {
  const currentVersion = app.getVersion();
  const latestVersion = String(release?.tag_name || release?.name || "").replace(/^v/i, "");
  const asset = selectReleaseAsset(release);
  return {
    currentVersion,
    latestVersion,
    updateAvailable: compareVersions(currentVersion, latestVersion) > 0,
    releaseName: release?.name || release?.tag_name || "",
    releaseUrl: release?.html_url || "https://github.com/is-coco/coco-dense/releases",
    notes: release?.body || "",
    assetName: asset?.name || "",
    assetUrl: asset?.browser_download_url || "",
    assetSize: Number(asset?.size) || 0,
    platform: process.platform,
    arch: process.arch,
  };
}

function safeDownloadName(name) {
  return String(name || "Coco-Dense-update")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, ".")
    .slice(0, 160);
}

async function downloadReleaseAsset(assetUrl, assetName, assetSize = 0, onProgress = () => {}) {
  const parsed = new URL(String(assetUrl || ""));
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com") {
    return { ok: false, error: "更新地址无效" };
  }

  const filePath = path.join(app.getPath("downloads"), safeDownloadName(assetName));
  const totalBytes = Number(assetSize) || 0;

  let loadUpdateProxy;
  try {
    const updaterState = require("./updater-state");
    loadUpdateProxy = updaterState.loadUpdateProxy;
  } catch {
    loadUpdateProxy = () => "";
  }
  const proxyUrl = loadUpdateProxy();

  const downloadUrls = [];
  if (proxyUrl) {
    downloadUrls.push(proxyUrl + parsed.href);
  }
  downloadUrls.push(parsed.href);
  for (const mirror of GITHUB_DOWNLOAD_MIRRORS) {
    if (!proxyUrl || mirror !== proxyUrl) {
      downloadUrls.push(mirror + parsed.href);
    }
  }

  let lastError = null;
  downloadCancelledByUser = false;
  currentDownloadFilePath = filePath;
  for (let attempt = 0; attempt < downloadUrls.length; attempt++) {
    const url = downloadUrls[attempt];
    const isMirror = attempt > 0;
    try {
      onProgress({
        stage: "connecting",
        downloadedBytes: 0,
        totalBytes,
        source: isMirror ? "镜像加速" : "GitHub 直连",
      });

      const controller = new AbortController();
      currentDownloadController = controller;
      const timeoutMs = isMirror ? 120000 : 20000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let response;
      try {
        response = await fetch(url, {
          headers: { "User-Agent": "Coco-Dense-Updater" },
          signal: controller.signal,
          redirect: "follow",
        });
      } catch (fetchErr) {
        clearTimeout(timeout);
        if (fetchErr?.name === "AbortError") {
          if (downloadCancelledByUser) {
            onProgress({ stage: "cancelled", downloadedBytes: 0, totalBytes });
            currentDownloadController = null;
            currentDownloadFilePath = null;
            return { ok: false, error: "下载已取消", cancelled: true };
          }
          lastError = new Error(isMirror ? "镜像下载超时" : "直连超时，尝试镜像加速");
          continue;
        }
        throw fetchErr;
      }
      clearTimeout(timeout);

      if (!response.ok || !response.body) {
        lastError = new Error(`下载失败: ${response.status}`);
        if (!isMirror) continue;
        return { ok: false, error: lastError.message };
      }

      let downloadedBytes = 0;
      let lastProgressAt = 0;
      const startedAt = Date.now();
      let abortedBySpeed = false;

      const progressStream = new Transform({
        transform(chunk, _encoding, callback) {
          downloadedBytes += chunk.length;
          const now = Date.now();
          if (now - lastProgressAt > 120 || (totalBytes && downloadedBytes >= totalBytes)) {
            lastProgressAt = now;
            const elapsed = now - startedAt;
            const speed = elapsed > 0 ? (downloadedBytes / elapsed) * 1000 : 0;
            if (!isMirror && attempt === 0 && elapsed > 10000 && speed < 50000) {
              abortedBySpeed = true;
              controller.abort();
              callback(new Error("SPEED_TOO_SLOW"));
              return;
            }
            onProgress({
              stage: "downloading",
              downloadedBytes,
              totalBytes,
              elapsedMs: elapsed,
              source: isMirror ? "镜像加速" : "GitHub 直连",
            });
          }
          callback(null, chunk);
        },
      });

      try {
        await pipeline(Readable.fromWeb(response.body), progressStream, fs.createWriteStream(filePath));
      } catch (pipeErr) {
        if (downloadCancelledByUser) {
          onProgress({ stage: "cancelled", downloadedBytes, totalBytes });
          currentDownloadController = null;
          currentDownloadFilePath = null;
          return { ok: false, error: "下载已取消", cancelled: true };
        }
        if (pipeErr?.message === "SPEED_TOO_SLOW" || abortedBySpeed) {
          lastError = new Error("直连速度过慢，正在切换镜像加速");
          continue;
        }
        throw pipeErr;
      }

      onProgress({
        stage: "downloaded",
        downloadedBytes,
        totalBytes: downloadedBytes,
        elapsedMs: Date.now() - startedAt,
        filePath,
        source: isMirror ? "镜像加速" : "GitHub 直连",
      });
      currentDownloadController = null;
      currentDownloadFilePath = null;
      return { ok: true, filePath, source: isMirror ? "mirror" : "direct" };
    } catch (err) {
      if (downloadCancelledByUser) {
        currentDownloadController = null;
        currentDownloadFilePath = null;
        return { ok: false, error: "下载已取消", cancelled: true };
      }
      lastError = err;
      if (!isMirror) continue;
      currentDownloadController = null;
      currentDownloadFilePath = null;
      return { ok: false, error: err?.message || "下载失败" };
    }
  }
  currentDownloadController = null;
  currentDownloadFilePath = null;
  return { ok: false, error: lastError?.message || "下载失败" };
}

function cancelCurrentDownload() {
  downloadCancelledByUser = true;
  if (currentDownloadController) {
    try { currentDownloadController.abort(); } catch { /* ignore */ }
  }
}

function getCurrentDownloadFilePath() {
  return currentDownloadFilePath;
}

function getUpdaterConstants() {
  return { GITHUB_LATEST_RELEASE_URL, GITHUB_DOWNLOAD_MIRRORS };
}

module.exports = {
  GITHUB_LATEST_RELEASE_URL,
  GITHUB_DOWNLOAD_MIRRORS,
  validateExternalUrl,
  normalizeVersion,
  compareVersions,
  selectReleaseAsset,
  fetchLatestRelease,
  normalizeReleaseInfo,
  safeDownloadName,
  downloadReleaseAsset,
  cancelCurrentDownload,
  getCurrentDownloadFilePath,
  getUpdaterConstants,
};
