# handoff 에셋 전처리
#
# 문제: 투명 픽셀(A=0) 아래에 회색/녹색 RGB가 남아 있어, 축소할 때 보간이
#       그 색을 끌어와 가장자리로 번진다. (PROGRESS.md 8장에 기록된 것과 동일)
# 해결: 완전 투명 픽셀의 RGB를 ink(#111111)로 통일 → 투명 여백 크롭 → 리사이즈.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\Downloads\handoff\assets"
$dst = "C:\Users\Administrator\vocadeck\assets\illustrations"
New-Item -ItemType Directory -Force -Path $dst | Out-Null

# 표시 크기의 약 3배(레티나 여유). 이름 => 한 변 목표 픽셀
$targets = @{
  'dog-stage-1'      = 256; 'dog-stage-2' = 256; 'dog-stage-3' = 256; 'dog-stage-4' = 256
  'dog-stage-5'      = 256; 'dog-stage-6' = 256; 'dog-stage-7' = 256; 'dog-stage-8' = 256
  'dog-action-stand' = 256; 'dog-action-sit' = 256; 'dog-action-bow' = 256
  'dog-action-bow-2' = 256; 'dog-action-sleep' = 256
  'toy-ball'         = 64;  'toy-bone' = 64;  'toy-rope' = 64
  'toy-frisbee'      = 64;  'toy-duck' = 64;  'toy-plush' = 64
  'icon-note'        = 56;  'icon-stats' = 56; 'icon-settings' = 56
  'empty-notebook'   = 420; 'empty-flashcards' = 176; 'complete-badge' = 264
}

function Convert-Asset($file, $targetSide) {
  $bmp = New-Object System.Drawing.Bitmap($file.FullName)
  # 32bppArgb 로 정규화해서 바이트 접근을 일정하게 만든다.
  $work = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g0 = [System.Drawing.Graphics]::FromImage($work)
  $g0.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
  $g0.Dispose(); $bmp.Dispose()

  $rect = New-Object System.Drawing.Rectangle(0, 0, $work.Width, $work.Height)
  $data = $work.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $len = [Math]::Abs($data.Stride) * $work.Height
  $buf = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $len)

  # BGRA 순서. 투명 픽셀 RGB를 ink 로 덮고, 동시에 불투명 영역 bbox 를 구한다.
  $minX = $work.Width; $minY = $work.Height; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $work.Height; $y++) {
    $row = $y * $data.Stride
    for ($x = 0; $x -lt $work.Width; $x++) {
      $i = $row + $x * 4
      if ($buf[$i + 3] -eq 0) {
        $buf[$i] = 17; $buf[$i + 1] = 17; $buf[$i + 2] = 17
      } else {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  [System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $len)
  $work.UnlockBits($data)

  if ($maxX -lt 0) { $minX = 0; $minY = 0; $maxX = $work.Width - 1; $maxY = $work.Height - 1 }

  # 정사각 크롭 박스 (가운데 정렬) — 가로세로 비율을 유지하려고 긴 변에 맞춘다.
  $w = $maxX - $minX + 1
  $h = $maxY - $minY + 1
  $side = [Math]::Max($w, $h)
  $pad = [int]([Math]::Round($side * 0.02))   # 잘림 방지용 아주 얇은 여백
  $side = $side + $pad * 2
  $cx = $minX + $w / 2.0
  $cy = $minY + $h / 2.0
  $sx = $cx - $side / 2.0
  $sy = $cy - $side / 2.0

  $out = New-Object System.Drawing.Bitmap($targetSide, $targetSide, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(0, 17, 17, 17))
  $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetSide, $targetSide)
  $g.DrawImage($work, $destRect, [single]$sx, [single]$sy, [single]$side, [single]$side, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()

  $outPath = Join-Path $dst ($file.BaseName + ".png")
  $out.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose(); $work.Dispose()

  $newLen = (Get-Item $outPath).Length
  "{0,-22} {1,9} -> {2,7}  ({3}px)" -f $file.BaseName, $file.Length, $newLen, $targetSide
}

foreach ($f in (Get-ChildItem $src -Filter *.png | Sort-Object Name)) {
  if ($targets.ContainsKey($f.BaseName)) {
    Convert-Asset $f $targets[$f.BaseName]
  }
}

# 앱 아이콘은 흰 배경 1024 정사각 그대로 쓴다 (크롭/투명 처리 대상 아님).
Copy-Item (Join-Path $src "app-icon.png") (Join-Path $dst "app-icon.png") -Force
"app-icon.png 복사 완료"
