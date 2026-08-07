# 앱 아이콘 생성 (assets/illustrations/app-icon.png → assets/images/*)
#
# 왜 스크립트로 두는가:
#   원본 아이콘은 "노트 위에 강아지 + 단어짝꿍 글자 + 네모 액자" 한 장이다.
#   안드로이드 어댑티브 아이콘은 108dp 중 가운데 원만 항상 보이므로 그대로 쓰면
#   액자가 잘리고, 통째로 줄이면 글자가 런처 크기(48dp)에서 뭉개진다.
#   그래서 런처용으로는 강아지만 뽑아 크게 배치한다.
#
#   배경에 옅은 괘선이 깔려 있어 단순 크롭으로는 선이 딸려온다. 밝기로 잉크만
#   골라내고 나머지는 투명으로 만든다. 이때 투명 픽셀까지 RGB를 ink로 통일해야
#   축소할 때 가장자리에 회색이 번지지 않는다 (PROGRESS 8장에서 이미 겪은 문제).
#
# 실행: powershell -ExecutionPolicy Bypass -File handoff\prep-app-icon.ps1
#
# 주의: 이 파일은 반드시 **UTF-8 BOM** 으로 저장해야 한다.
#   Windows PowerShell 5.1 은 BOM 이 없으면 .ps1 을 ANSI(CP949)로 읽는다. 그러면
#   한글 주석이 깨지면서 마지막 글자가 줄바꿈까지 삼켜, 바로 다음 줄이 주석 안으로
#   빨려들어가 조용히 실행되지 않는다 (실제로 $ART_BOX 정의가 이렇게 사라졌다).
#   커밋 메시지는 BOM 을 붙이면 안 되는 것과 정반대이니 헷갈리지 말 것.

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root 'assets\illustrations\app-icon.png'
$out  = Join-Path $root 'assets\images'

$CANVAS = 1024

# 원본에서 잰 위치
$DOG_BOX = @{ x = 420; y = 292; w = 184; h = 248 }   # 강아지만
$ART_BOX = @{ x = 107; y =  96; w = 810; h = 832 }   # 액자 포함 전체

# 런처 아이콘: 강아지 높이를 캔버스의 53%로. 대각선이 안전영역 원(지름 66.6%)
# 안에 들어가야 어떤 런처 마스크에서도 안 잘린다.
$DOG_RATIO = 0.53
# 스플래시/iOS 용: 원형 마스크가 없어 잘리지 않는다. 가장자리만 띄운다.
$ART_RATIO = 0.68

# ---- 원본 픽셀을 한 번만 읽어 스크립트 스코프에 둔다 ----
$srcBmp    = New-Object System.Drawing.Bitmap $src
$srcRect   = New-Object System.Drawing.Rectangle 0, 0, $srcBmp.Width, $srcBmp.Height
$srcData   = $srcBmp.LockBits($srcRect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
                              [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$srcStride = $srcData.Stride
$srcBytes  = New-Object byte[] ($srcStride * $srcBmp.Height)
[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $srcBytes.Length)
$srcBmp.UnlockBits($srcData)
$srcBmp.Dispose()

# 밝은 배경·괘선은 버리고 어두운 선만 알파로 남긴다.
# 전 픽셀의 RGB를 ink로 통일해두면 축소 보간이 알파에만 걸려 번짐이 없다.
function Extract-Ink([int]$bx, [int]$by, [int]$bw, [int]$bh) {
    $INK_FULL = 60.0    # 이보다 어두우면 완전 불투명
    $INK_NONE = 200.0   # 이보다 밝으면 완전 투명 (괘선이 여기 걸린다)

    # 진단을 넣을 일이 생기면 Write-Host 를 쓸 것.
    # Write-Output 은 함수 반환값 파이프라인에 섞여 배열이 되어버린다.
    $bmp  = New-Object System.Drawing.Bitmap $bw, $bh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $rect = New-Object System.Drawing.Rectangle 0, 0, $bw, $bh
    $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly,
                          [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $dst  = New-Object byte[] ($data.Stride * $bh)

    for ($y = 0; $y -lt $bh; $y++) {
        $sRow = ($by + $y) * $srcStride
        $dRow = $y * $data.Stride
        for ($x = 0; $x -lt $bw; $x++) {
            $s = $sRow + ($bx + $x) * 4
            $d = $dRow + $x * 4
            $alpha = 0
            if ($srcBytes[$s + 3] -ge 128) {
                $lum = ($srcBytes[$s] + $srcBytes[$s + 1] + $srcBytes[$s + 2]) / 3.0
                if ($lum -le $INK_FULL) { $alpha = 255 }
                elseif ($lum -lt $INK_NONE) {
                    $alpha = [int](255.0 * ($INK_NONE - $lum) / ($INK_NONE - $INK_FULL))
                }
            }
            $dst[$d]     = 17           # B
            $dst[$d + 1] = 17           # G
            $dst[$d + 2] = 17           # R
            $dst[$d + 3] = [byte]$alpha
        }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($dst, 0, $data.Scan0, $dst.Length)
    $bmp.UnlockBits($data)
    $bmp
}

function Save-Centered([System.Drawing.Bitmap]$img, [double]$ratio, [bool]$opaque, [string]$name) {
    $h = [int][Math]::Round($CANVAS * $ratio)
    $w = [int][Math]::Round($img.Width * ($h / [double]$img.Height))
    $x = [int][Math]::Round(($CANVAS - $w) / 2.0)
    $y = [int][Math]::Round(($CANVAS - $h) / 2.0)

    $canvas = New-Object System.Drawing.Bitmap $CANVAS, $CANVAS, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    if ($opaque) { $g.Clear([System.Drawing.Color]::White) }
    else         { $g.Clear([System.Drawing.Color]::FromArgb(0, 17, 17, 17)) }
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle $x, $y, $w, $h))
    $g.Dispose()

    $canvas.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()

    $diag = [int][Math]::Sqrt($w * $w + $h * $h)
    Write-Output ("{0,-32} {1,4}x{2,-4} at ({3,3},{4,3})  diag {5}  safe<=682" -f $name, $w, $h, $x, $y, $diag)
}

# 추출을 먼저 끝낸다. 1024x1024 캔버스를 여러 장 만들고 난 뒤에 큰 비트맵을
# 할당하면 GDI+ 가 "Parameter is not valid" 로 실패한다.
$dogInk = [System.Drawing.Bitmap](Extract-Ink $DOG_BOX.x $DOG_BOX.y $DOG_BOX.w $DOG_BOX.h)
$artInk = [System.Drawing.Bitmap](Extract-Ink $ART_BOX.x $ART_BOX.y $ART_BOX.w $ART_BOX.h)

# ---- 런처 아이콘 (전경 + 모노크롬) — 강아지만 ----
Save-Centered $dogInk $DOG_RATIO $false 'android-icon-foreground.png'
Save-Centered $dogInk $DOG_RATIO $false 'android-icon-monochrome.png'

# ---- 웹 파비콘 ----
$fav = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$fg  = [System.Drawing.Graphics]::FromImage($fav)
$fg.Clear([System.Drawing.Color]::FromArgb(0, 17, 17, 17))
$fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$fg.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$favH = 56
$favW = [int][Math]::Round($dogInk.Width * ($favH / [double]$dogInk.Height))
$fg.DrawImage($dogInk, (New-Object System.Drawing.Rectangle ([int]((64 - $favW) / 2)), 4, $favW, $favH))
$fg.Dispose()
$fav.Save((Join-Path $out 'favicon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$fav.Dispose()
Write-Output ("{0,-32} {1,4}x{2}" -f 'favicon.png', $favW, $favH)
$dogInk.Dispose()

# ---- 스플래시 / iOS — 액자와 글자까지 전부 ----
Save-Centered $artInk $ART_RATIO $true 'app-icon.png'
$artInk.Dispose()
