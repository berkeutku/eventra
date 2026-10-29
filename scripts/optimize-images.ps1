param(
  [string]$Folder = "public\events",
  [int]$MaxWidth = 1600,
  [int]$Quality = 80
)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root $Folder
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

Get-ChildItem -Path $target -Include *.jpg -Recurse | ForEach-Object {
  $path = $_.FullName
  $name = $_.Name
  $image = [System.Drawing.Image]::FromFile($path)
  $width = $image.Width
  $height = $image.Height
  $scale = [Math]::Min(1.0, $MaxWidth / $width)
  $newWidth = [int][Math]::Round($width * $scale)
  $newHeight = [int][Math]::Round($height * $scale)

  $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)
  $image.Dispose()

  $temp = "$path.tmp"
  $bitmap.Save($temp, $codec, $encoderParams)
  $graphics.Dispose()
  $bitmap.Dispose()
  Move-Item -Force $temp $path

  "{0}: {1}x{2} -> {3}x{4}, {5} KB" -f $name, $width, $height, $newWidth, $newHeight, [int]((Get-Item $path).Length / 1KB)
}