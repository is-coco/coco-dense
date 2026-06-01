$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$electronDist = Join-Path $root "node_modules\electron\dist"
$distRoot = Join-Path $root "dist"
$outDir = Join-Path $distRoot ("Coco Dense-win32-x64-new-" + (Get-Date -Format "HHmmss"))
$stableDir = Join-Path $distRoot "Coco Dense-win32-x64"
$tmpDir = Join-Path $distRoot "_coco-dense-tmp"
$resources = Join-Path $tmpDir "resources\app"
$rceditExe = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA "electron-builder\Cache\winCodeSign") -Recurse -Filter "rcedit-x64.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
$iconPath = Join-Path $root "assets\app-icon.ico"

if (-not (Test-Path (Join-Path $electronDist "electron.exe"))) {
  throw "Electron runtime is missing. Run npm install first."
}

$targetExe = Join-Path $stableDir "Coco Dense.exe"
Get-Process -Name "Coco Dense" -ErrorAction SilentlyContinue |
  Where-Object {
    try {
      $_.Path -and ([System.IO.Path]::GetFullPath($_.Path) -eq [System.IO.Path]::GetFullPath($targetExe))
    }
    catch {
      $false
    }
  } |
  Stop-Process -Force -ErrorAction SilentlyContinue

if (Test-Path $tmpDir) {
  Remove-Item -Recurse -Force $tmpDir
}

New-Item -ItemType Directory -Path $resources | Out-Null

Copy-Item -Recurse -Force (Join-Path $electronDist "*") $tmpDir

# Remove the bundled app.asar so the unpacked app folder is always the source of truth.
$asarPath = Join-Path $tmpDir "resources\app.asar"
if (Test-Path $asarPath) {
  Remove-Item -Force $asarPath
}

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

$pinyinModule = Join-Path $root "node_modules\pinyin-pro"
if (Test-Path $pinyinModule) {
  $moduleTarget = Join-Path $resources "node_modules\pinyin-pro"
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $moduleTarget) | Out-Null
  Copy-Item -Recurse -Force $pinyinModule $moduleTarget
}

Rename-Item -LiteralPath (Join-Path $tmpDir "electron.exe") -NewName "Coco Dense.exe"
if ($rceditExe -and (Test-Path $iconPath)) {
  & $rceditExe (Join-Path $tmpDir "Coco Dense.exe") --set-icon $iconPath | Out-Null
}

Move-Item -Force $tmpDir $outDir

if (Test-Path $stableDir) {
  $resolvedStable = [System.IO.Path]::GetFullPath($stableDir)
  $resolvedDist = [System.IO.Path]::GetFullPath($distRoot)
  if (
    -not $resolvedStable.StartsWith($resolvedDist, [System.StringComparison]::OrdinalIgnoreCase) -or
    (Split-Path -Leaf $resolvedStable) -ne "Coco Dense-win32-x64"
  ) {
    throw "Refusing to remove unexpected stable directory: $resolvedStable"
  }
  Remove-Item -LiteralPath $stableDir -Recurse -Force
}

New-Item -ItemType Directory -Path $stableDir | Out-Null
Copy-Item -Recurse -Force -Path (Join-Path $outDir "*") -Destination $stableDir

Write-Host "Built app:"
Write-Host (Join-Path $outDir "Coco Dense.exe")
Write-Host "Synced stable app:"
Write-Host (Join-Path $stableDir "Coco Dense.exe")
