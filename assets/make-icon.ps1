Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$assets = Join-Path $root 'assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null

function New-VaultIconBitmap([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $scale = $size / 256.0
  $outer = New-Object System.Drawing.RectangleF (18*$scale), (18*$scale), (220*$scale), (220*$scale)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $radius = 58*$scale
  $path.AddArc($outer.X, $outer.Y, $radius, $radius, 180, 90)
  $path.AddArc($outer.Right - $radius, $outer.Y, $radius, $radius, 270, 90)
  $path.AddArc($outer.Right - $radius, $outer.Bottom - $radius, $radius, $radius, 0, 90)
  $path.AddArc($outer.X, $outer.Bottom - $radius, $radius, $radius, 90, 90)
  $path.CloseFigure()

  $shadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(32, 35, 55, 80))
  $g.TranslateTransform(0, 8*$scale)
  $g.FillPath($shadow, $path)
  $g.ResetTransform()

  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $outer, ([System.Drawing.Color]::FromArgb(255, 248, 251, 255)), ([System.Drawing.Color]::FromArgb(255, 218, 232, 248)), 45
  $g.FillPath($bgBrush, $path)
  $border = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 196, 210, 228)), (2.2*$scale)
  $g.DrawPath($border, $path)

  $accentRect = New-Object System.Drawing.RectangleF (70*$scale), (62*$scale), (116*$scale), (150*$scale)
  $accent = New-Object System.Drawing.Drawing2D.LinearGradientBrush $accentRect, ([System.Drawing.Color]::FromArgb(255, 0, 122, 255)), ([System.Drawing.Color]::FromArgb(255, 89, 167, 255)), 90
  $lockBody = New-Object System.Drawing.RectangleF (64*$scale), (104*$scale), (128*$scale), (88*$scale)
  $bodyPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $bodyRadius = 26*$scale
  $bodyPath.AddArc($lockBody.X, $lockBody.Y, $bodyRadius, $bodyRadius, 180, 90)
  $bodyPath.AddArc($lockBody.Right - $bodyRadius, $lockBody.Y, $bodyRadius, $bodyRadius, 270, 90)
  $bodyPath.AddArc($lockBody.Right - $bodyRadius, $lockBody.Bottom - $bodyRadius, $bodyRadius, $bodyRadius, 0, 90)
  $bodyPath.AddArc($lockBody.X, $lockBody.Bottom - $bodyRadius, $bodyRadius, $bodyRadius, 90, 90)
  $bodyPath.CloseFigure()
  $g.FillPath($accent, $bodyPath)

  $shacklePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 0, 99, 210)), (16*$scale)
  $shacklePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $shacklePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawArc($shacklePen, (82*$scale), (55*$scale), (92*$scale), (96*$scale), 205, 130)

  $shine = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 255, 255, 255))
  $g.FillEllipse($shine, (92*$scale), (118*$scale), (22*$scale), (16*$scale))

  $key = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 246, 250, 255))
  $g.FillEllipse($key, (116*$scale), (134*$scale), (24*$scale), (24*$scale))
  $g.FillRectangle($key, (125*$scale), (154*$scale), (6*$scale), (22*$scale))

  $g.Dispose()
  return $bmp
}

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$pngItems = @()
foreach ($size in $sizes) {
  $bmp = New-VaultIconBitmap $size
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

Write-Host "Created icon assets:"
Write-Host (Join-Path $assets 'app-icon.ico')
Write-Host (Join-Path $assets 'app-icon.png')
