Add-Type -AssemblyName System.Drawing

# Arka plan rengini değiştirmek istersen yalnızca bu satırı düzenle.
$backgroundHex = "#fff8f0"

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "public\logo-mark.png"
$outDir = Join-Path $root "public\icons"
$background = [System.Drawing.ColorTranslator]::FromHtml($backgroundHex)

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$logo = [System.Drawing.Image]::FromFile($source)

function New-Icon([int]$size, [double]$logoRatio, [string]$name) {
  $bitmap = New-Object System.Drawing.Bitmap($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear($background)

  $box = $size * $logoRatio
  $scale = [Math]::Min($box / $logo.Width, $box / $logo.Height)
  $width = $logo.Width * $scale
  $height = $logo.Height * $scale
  $x = ($size - $width) / 2
  $y = ($size - $height) / 2
  $graphics.DrawImage($logo, [single]$x, [single]$y, [single]$width, [single]$height)

  $target = Join-Path $outDir $name
  $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
  Write-Output "Üretildi: $target"
}

New-Icon 192 0.7 "icon-192.png"
New-Icon 512 0.7 "icon-512.png"
New-Icon 512 0.55 "icon-maskable-512.png"
New-Icon 180 0.7 "apple-touch-icon.png"

$logo.Dispose()