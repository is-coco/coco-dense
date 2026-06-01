Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$assets = Join-Path $root 'assets'
$source = Join-Path $assets 'app-icon-source.png'
if (-not (Test-Path $source)) { throw 'Missing app-icon-source.png' }

function New-ScaledBitmap([int]$size) {
  $src = [System.Drawing.Image]::FromFile($source)
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $margin = [Math]::Max(0, [Math]::Round($size * 0.12))
  $dest = New-Object System.Drawing.Rectangle $margin, $margin, ($size - 2 * $margin), ($size - 2 * $margin)
  $g.DrawImage($src, $dest)
  $g.Dispose()
  $src.Dispose()
  return $bmp
}

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$pngItems = @()
foreach ($size in $sizes) {
  $bmp = New-ScaledBitmap $size
  $pngPath = Join-Path $assets "app-icon-$size.png"
  $bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bytes = [System.IO.File]::ReadAllBytes($pngPath)
  $pngItems += [pscustomobject]@{ Size = $size; Bytes = $bytes }
  if ($size -eq 256) {
    $bmp.Save((Join-Path $assets 'app-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  }
  $bmp.Dispose()
}

$icoPath = Join-Path $assets 'app-icon.ico'
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([UInt16]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]$pngItems.Count)
$offset = 6 + (16 * $pngItems.Count)
foreach ($item in $pngItems) {
  $dim = if ($item.Size -eq 256) { 0 } else { $item.Size }
  $bw.Write([byte]$dim)
  $bw.Write([byte]$dim)
  $bw.Write([byte]0)
  $bw.Write([byte]0)
  $bw.Write([UInt16]1)
  $bw.Write([UInt16]32)
  $bw.Write([UInt32]$item.Bytes.Length)
  $bw.Write([UInt32]$offset)
  $offset += $item.Bytes.Length
}
foreach ($item in $pngItems) {
  $bw.Write($item.Bytes)
}
$bw.Close()
$fs.Close()

Write-Host 'Rebuilt icon assets from source image.'
