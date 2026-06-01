$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string]$ElectronDir
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$electronExe = Join-Path $ElectronDir "electron.exe"

if (-not (Test-Path $electronExe)) {
  throw "找不到 electron.exe：$electronExe"
}

$env:ELECTRON_OVERRIDE_DIST_PATH = $ElectronDir
$env:ELECTRON_CACHE = Join-Path $root ".electron-cache"
$env:ELECTRON_BUILDER_CACHE = Join-Path $root ".electron-builder-cache"

Push-Location $root
try {
  & ".\node_modules\.bin\electron-builder.cmd" --win portable
}
finally {
  Pop-Location
}
