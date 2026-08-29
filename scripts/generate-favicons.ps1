param(
  [string]$Source = '.\assets\images\sri-bharathi-symbol.png'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$workspace = (Resolve-Path -LiteralPath '.').Path
$sourcePath = (Resolve-Path -LiteralPath $Source).Path
if (-not $sourcePath.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Source image must be inside the workspace.'
}

function New-SquareLogo([int]$Size) {
  $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
  try {
    $canvas = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $available = $Size
      $scale = [Math]::Min($available / $sourceImage.Width, $available / $sourceImage.Height)
      $width = [Math]::Round($sourceImage.Width * $scale)
      $height = [Math]::Round($sourceImage.Height * $scale)
      $x = [Math]::Round(($Size - $width) / 2)
      $y = [Math]::Round(($Size - $height) / 2)
      $graphics.DrawImage($sourceImage, $x, $y, $width, $height)
      return $canvas
    } finally {
      $graphics.Dispose()
    }
  } finally {
    $sourceImage.Dispose()
  }
}

$favicon32 = New-SquareLogo 32
try { $favicon32.Save((Join-Path $workspace 'assets\favicon-32.png'), [System.Drawing.Imaging.ImageFormat]::Png) } finally { $favicon32.Dispose() }

$apple = New-SquareLogo 180
try { $apple.Save((Join-Path $workspace 'assets\apple-touch-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png) } finally { $apple.Dispose() }

$iconBitmap = New-SquareLogo 64
try {
  $icon = [System.Drawing.Icon]::FromHandle($iconBitmap.GetHicon())
  try {
    $stream = [System.IO.File]::Create((Join-Path $workspace 'favicon.ico'))
    try { $icon.Save($stream) } finally { $stream.Dispose() }
  } finally { $icon.Dispose() }
} finally { $iconBitmap.Dispose() }

Write-Output 'Generated favicon.ico, favicon-32.png and apple-touch-icon.png from the supplied Sri Bharathi symbol.'
