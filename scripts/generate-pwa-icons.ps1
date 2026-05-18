param(
    [string]$OutDir = (Join-Path $PSScriptRoot '..\public\icons')
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

function New-BingoIcon {
    param(
        [int]$Size,
        [string]$OutFile,
        [bool]$Maskable = $false
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Para maskable, el safe zone es el 80% central; el resto puede recortarse.
    # Pintamos fondo azul sobre todo el canvas para que cualquier recorte siga siendo azul.
    $azulBg   = [System.Drawing.Color]::FromArgb(37, 99, 235)   # #2563eb
    $blanco   = [System.Drawing.Color]::White
    $celeste  = [System.Drawing.Color]::FromArgb(219, 234, 254) # #dbeafe
    $amarillo = [System.Drawing.Color]::FromArgb(251, 191, 36)  # #fbbf24

    $bgBrush = New-Object System.Drawing.SolidBrush $azulBg
    $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    $bgBrush.Dispose()

    # Área de dibujo: full canvas si maskable (el sistema recorta); con padding si no.
    if ($Maskable) {
        $pad = [int]($Size * 0.10)  # safe zone interior 80%
    } else {
        $pad = [int]($Size * 0.06)
    }
    $area = $Size - 2 * $pad

    # Tarjeta blanca con esquinas redondeadas
    $cardX = $pad
    $cardY = $pad
    $cardW = $area
    $cardH = $area
    $r = [int]($area * 0.10)
    $cardPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $cardPath.AddArc($cardX, $cardY, $r, $r, 180, 90)
    $cardPath.AddArc($cardX + $cardW - $r, $cardY, $r, $r, 270, 90)
    $cardPath.AddArc($cardX + $cardW - $r, $cardY + $cardH - $r, $r, $r, 0, 90)
    $cardPath.AddArc($cardX, $cardY + $cardH - $r, $r, $r, 90, 90)
    $cardPath.CloseFigure()
    $blancoBrush = New-Object System.Drawing.SolidBrush $blanco
    $g.FillPath($blancoBrush, $cardPath)
    $blancoBrush.Dispose()

    # Header azul (parte superior con BINGO)
    $headerH = [int]($cardH * 0.28)
    $headerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $headerPath.AddArc($cardX, $cardY, $r, $r, 180, 90)
    $headerPath.AddArc($cardX + $cardW - $r, $cardY, $r, $r, 270, 90)
    $headerPath.AddLine($cardX + $cardW, $cardY + $headerH, $cardX, $cardY + $headerH)
    $headerPath.CloseFigure()
    $headerBrush = New-Object System.Drawing.SolidBrush $azulBg
    $g.FillPath($headerBrush, $headerPath)
    $headerBrush.Dispose()

    # Texto BINGO en el header
    $fontSize = [single]($headerH * 0.55)
    $font = New-Object System.Drawing.Font 'Arial Black', $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $whiteBrush = New-Object System.Drawing.SolidBrush $blanco
    $textRect = New-Object System.Drawing.RectangleF $cardX, $cardY, $cardW, $headerH
    $g.DrawString('BINGO', $font, $whiteBrush, $textRect, $sf)
    $font.Dispose()
    $whiteBrush.Dispose()

    # Grilla 5x5 abajo del header
    $gridTop = $cardY + $headerH + [int]($cardH * 0.04)
    $gridLeft = $cardX + [int]($cardW * 0.05)
    $gridSize = $cardW - 2 * [int]($cardW * 0.05)
    $cells = 5
    $gap = [int]($gridSize * 0.025)
    $cell = [int](($gridSize - $gap * ($cells - 1)) / $cells)
    $gridBottom = $gridTop + $cells * $cell + ($cells - 1) * $gap
    $maxBottom = $cardY + $cardH - [int]($cardH * 0.04)
    if ($gridBottom -gt $maxBottom) {
        $cell = [int](($maxBottom - $gridTop - $gap * ($cells - 1)) / $cells)
    }

    $cellRadius = [Math]::Max(1, [int]($cell * 0.18))
    for ($row = 0; $row -lt $cells; $row++) {
        for ($col = 0; $col -lt $cells; $col++) {
            $cx = $gridLeft + $col * ($cell + $gap)
            $cy = $gridTop + $row * ($cell + $gap)
            $fill = if ($row -eq 2 -and $col -eq 2) { $amarillo } else { $celeste }
            $cellBrush = New-Object System.Drawing.SolidBrush $fill
            $cellPath = New-Object System.Drawing.Drawing2D.GraphicsPath
            $cellPath.AddArc($cx, $cy, $cellRadius, $cellRadius, 180, 90)
            $cellPath.AddArc($cx + $cell - $cellRadius, $cy, $cellRadius, $cellRadius, 270, 90)
            $cellPath.AddArc($cx + $cell - $cellRadius, $cy + $cell - $cellRadius, $cellRadius, $cellRadius, 0, 90)
            $cellPath.AddArc($cx, $cy + $cell - $cellRadius, $cellRadius, $cellRadius, 90, 90)
            $cellPath.CloseFigure()
            $g.FillPath($cellBrush, $cellPath)
            $cellBrush.Dispose()
            $cellPath.Dispose()
        }
    }

    $g.Dispose()
    $bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generado: $OutFile"
}

New-BingoIcon -Size 192 -OutFile (Join-Path $OutDir 'icon-192.png')          -Maskable $false
New-BingoIcon -Size 512 -OutFile (Join-Path $OutDir 'icon-512.png')          -Maskable $false
New-BingoIcon -Size 512 -OutFile (Join-Path $OutDir 'icon-512-maskable.png') -Maskable $true
New-BingoIcon -Size 180 -OutFile (Join-Path $PSScriptRoot '..\public\apple-touch-icon.png') -Maskable $false
