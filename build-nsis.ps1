$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$electronDist = Join-Path $root "node_modules\electron\dist"
$distRoot = Join-Path $root "dist"
$tmpDir = Join-Path $distRoot "_nsis-build-tmp"
$resources = Join-Path $tmpDir "resources\app"
$iconPath = Join-Path $root "assets\app-icon.ico"
$rceditExe = Join-Path $root "node_modules\rcedit\bin\rcedit-x64.exe"

if (-not (Test-Path (Join-Path $electronDist "electron.exe"))) {
  throw "Electron runtime is missing. Run npm install first."
}

# Clean temp
if (Test-Path $tmpDir) {
  Remove-Item -Recurse -Force $tmpDir
}

# Create resources dir
New-Item -ItemType Directory -Path $resources | Out-Null

# Copy Electron runtime
Copy-Item -Recurse -Force (Join-Path $electronDist "*") $tmpDir

# Remove bundled asar
$asarPath = Join-Path $tmpDir "resources\app.asar"
if (Test-Path $asarPath) {
  Remove-Item -Force $asarPath
}

# Copy app files
$appFiles = @(
  "index.html",
  "styles.css",
  "script.js",
  "main.js",
  "preload.js",
  "package.json",
  "README.md"
)

foreach ($file in $appFiles) {
  Copy-Item -Force (Join-Path $root $file) $resources
}

Copy-Item -Recurse -Force (Join-Path $root "assets") (Join-Path $resources "assets")

# Copy pinyin-pro module
$pinyinModule = Join-Path $root "node_modules\pinyin-pro"
if (Test-Path $pinyinModule) {
  $moduleTarget = Join-Path $resources "node_modules\pinyin-pro"
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $moduleTarget) | Out-Null
  Copy-Item -Recurse -Force $pinyinModule $moduleTarget
}

# Rename electron.exe to Coco Dense.exe
Rename-Item -LiteralPath (Join-Path $tmpDir "electron.exe") -NewName "Coco Dense.exe"

# Embed icon using rcedit
if ((Test-Path $rceditExe) -and (Test-Path $iconPath)) {
  Write-Host "Embedding icon..."
  & $rceditExe (Join-Path $tmpDir "Coco Dense.exe") --set-icon $iconPath | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "rcedit failed, icon may not be embedded"
  } else {
    Write-Host "Icon embedded successfully"
  }
} else {
  Write-Warning "rcedit or icon not found, skipping icon embedding"
}

# Copy to win-unpacked (required by electron-builder NSIS)
$stableDir = Join-Path $distRoot "win-unpacked"
if (Test-Path $stableDir) {
  Remove-Item -LiteralPath $stableDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stableDir | Out-Null
Copy-Item -Recurse -Force -Path (Join-Path $tmpDir "*") -Destination $stableDir

# Run electron-builder NSIS from the prepared directory
Push-Location $root
try {
  $env:ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES = "true"
  & ".\node_modules\.bin\electron-builder.cmd" --win nsis --publish never --prepackaged $stableDir
} finally {
  Pop-Location
}

# Clean up temp
if (Test-Path $tmpDir) {
  Remove-Item -Recurse -Force $tmpDir
}

Write-Host "Build complete. Check dist/ for the installer."
