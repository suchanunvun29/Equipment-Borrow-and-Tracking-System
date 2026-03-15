Add-Type -AssemblyName System.Drawing

$outDir = Join-Path (Get-Location) 'docs/diagrams'
if (-not (Test-Path $outDir)) { New-Item -Path $outDir -ItemType Directory -Force | Out-Null }

function New-Color([string]$hex) {
    [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Get-FontName {
    $preferred = @('Leelawadee UI', 'Tahoma', 'Leelawadee', 'Angsana New')
    $installed = (New-Object System.Drawing.Text.InstalledFontCollection).Families | Select-Object -ExpandProperty Name
    foreach ($name in $preferred) {
        if ($installed -contains $name) { return $name }
    }
    return 'Microsoft Sans Serif'
}

$FontName = Get-FontName

function New-RoundRectPath {
    param(
        [double]$X,
        [double]$Y,
        [double]$Width,
        [double]$Height,
        [double]$Radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = [double]($Radius * 2)
    $path.AddArc([single]$X, [single]$Y, [single]$d, [single]$d, 180, 90)
    $path.AddArc([single]($X + $Width - $d), [single]$Y, [single]$d, [single]$d, 270, 90)
    $path.AddArc([single]($X + $Width - $d), [single]($Y + $Height - $d), [single]$d, [single]$d, 0, 90)
    $path.AddArc([single]$X, [single]($Y + $Height - $d), [single]$d, [single]$d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-CenteredText {
    param(
        $Graphics,
        [string]$Text,
        $Font,
        $Brush,
        [double]$X,
        [double]$Y,
        [double]$Width,
        [double]$Height
    )
    $rect = [System.Drawing.RectangleF]::new([single]$X, [single]$Y, [single]$Width, [single]$Height)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $sf.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
    $Graphics.DrawString($Text, $Font, $Brush, $rect, $sf)
    $sf.Dispose()
}

function Draw-RoundedBox {
    param(
        $Graphics,
        [double]$CenterX,
        [double]$CenterY,
        [double]$Width,
        [double]$Height,
        [string]$Text,
        [System.Drawing.Color]$Fill,
        $Font
    )
    $x = $CenterX - ($Width / 2)
    $y = $CenterY - ($Height / 2)
    $path = New-RoundRectPath -X $x -Y $y -Width $Width -Height $Height -Radius 18
    $fillBrush = [System.Drawing.SolidBrush]::new($Fill)
    $pen = [System.Drawing.Pen]::new((New-Color '#334155'), 3)
    $textBrush = [System.Drawing.SolidBrush]::new((New-Color '#0f172a'))
    $Graphics.FillPath($fillBrush, $path)
    $Graphics.DrawPath($pen, $path)
    Draw-CenteredText -Graphics $Graphics -Text $Text -Font $Font -Brush $textBrush -X $x -Y $y -Width $Width -Height $Height
    $fillBrush.Dispose(); $pen.Dispose(); $textBrush.Dispose(); $path.Dispose()
    return @{ x = $x; y = $y; w = $Width; h = $Height; cx = $CenterX; cy = $CenterY }
}

function Draw-EllipseBox {
    param(
        $Graphics,
        [double]$CenterX,
        [double]$CenterY,
        [double]$Width,
        [double]$Height,
        [string]$Text,
        [System.Drawing.Color]$Fill,
        $Font
    )
    $x = $CenterX - ($Width / 2)
    $y = $CenterY - ($Height / 2)
    $fillBrush = [System.Drawing.SolidBrush]::new($Fill)
    $pen = [System.Drawing.Pen]::new((New-Color '#334155'), 3)
    $textBrush = [System.Drawing.SolidBrush]::new((New-Color '#0f172a'))
    $Graphics.FillEllipse($fillBrush, [single]$x, [single]$y, [single]$Width, [single]$Height)
    $Graphics.DrawEllipse($pen, [single]$x, [single]$y, [single]$Width, [single]$Height)
    Draw-CenteredText -Graphics $Graphics -Text $Text -Font $Font -Brush $textBrush -X $x -Y $y -Width $Width -Height $Height
    $fillBrush.Dispose(); $pen.Dispose(); $textBrush.Dispose()
    return @{ x = $x; y = $y; w = $Width; h = $Height; cx = $CenterX; cy = $CenterY }
}

function Draw-Diamond {
    param(
        $Graphics,
        [double]$CenterX,
        [double]$CenterY,
        [double]$Width,
        [double]$Height,
        [string]$Text,
        [System.Drawing.Color]$Fill,
        $Font
    )
    [System.Drawing.PointF[]]$pts = @(
        [System.Drawing.PointF]::new([single]$CenterX, [single]($CenterY - ($Height / 2))),
        [System.Drawing.PointF]::new([single]($CenterX + ($Width / 2)), [single]$CenterY),
        [System.Drawing.PointF]::new([single]$CenterX, [single]($CenterY + ($Height / 2))),
        [System.Drawing.PointF]::new([single]($CenterX - ($Width / 2)), [single]$CenterY)
    )
    $fillBrush = [System.Drawing.SolidBrush]::new($Fill)
    $pen = [System.Drawing.Pen]::new((New-Color '#334155'), 3)
    $textBrush = [System.Drawing.SolidBrush]::new((New-Color '#0f172a'))
    $Graphics.FillPolygon($fillBrush, $pts)
    $Graphics.DrawPolygon($pen, $pts)
    Draw-CenteredText -Graphics $Graphics -Text $Text -Font $Font -Brush $textBrush -X ($CenterX - $Width/2) -Y ($CenterY - $Height/2) -Width $Width -Height $Height
    $fillBrush.Dispose(); $pen.Dispose(); $textBrush.Dispose()
    return @{ x = ($CenterX - $Width/2); y = ($CenterY - $Height/2); w = $Width; h = $Height; cx = $CenterX; cy = $CenterY }
}

function Draw-Arrow {
    param(
        $Graphics,
        [double]$X1,
        [double]$Y1,
        [double]$X2,
        [double]$Y2,
        [string]$Label = '',
        [double]$LabelDX = 0,
        [double]$LabelDY = 0,
        $LabelFont
    )
    $pen = [System.Drawing.Pen]::new((New-Color '#374151'), 4)
    $cap = [System.Drawing.Drawing2D.AdjustableArrowCap]::new(6, 8, $true)
    $pen.CustomEndCap = $cap
    $Graphics.DrawLine($pen, [single]$X1, [single]$Y1, [single]$X2, [single]$Y2)

    if ($Label -and $Label.Trim().Length -gt 0) {
        $txtBrush = [System.Drawing.SolidBrush]::new((New-Color '#1f2937'))
        $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
        $bPen = [System.Drawing.Pen]::new((New-Color '#cbd5e1'), 1)
        $mx = (($X1 + $X2) / 2) + $LabelDX
        $my = (($Y1 + $Y2) / 2) + $LabelDY
        $size = $Graphics.MeasureString($Label, $LabelFont)
        $w = [math]::Ceiling($size.Width + 16)
        $h = [math]::Ceiling($size.Height + 8)
        $x = $mx - ($w / 2)
        $y = $my - ($h / 2)
        $path = New-RoundRectPath -X $x -Y $y -Width $w -Height $h -Radius 8
        $Graphics.FillPath($bgBrush, $path)
        $Graphics.DrawPath($bPen, $path)
        Draw-CenteredText -Graphics $Graphics -Text $Label -Font $LabelFont -Brush $txtBrush -X $x -Y $y -Width $w -Height $h
        $txtBrush.Dispose(); $bgBrush.Dispose(); $bPen.Dispose(); $path.Dispose()
    }

    $cap.Dispose(); $pen.Dispose()
}

function New-Canvas {
    param([int]$Width, [int]$Height)
    $bmp = [System.Drawing.Bitmap]::new($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    return @{ bmp = $bmp; g = $g }
}

function Save-Canvas {
    param($Canvas, [string]$Path)
    $Canvas.bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $Canvas.g.Dispose()
    $Canvas.bmp.Dispose()
}

# -------- Flowchart --------
$flowCanvas = New-Canvas -Width 2800 -Height 1820
$g = $flowCanvas.g
$g.Clear((New-Color '#f8fafc'))

$titleFont = [System.Drawing.Font]::new($FontName, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$nodeFont = [System.Drawing.Font]::new($FontName, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$labelFont = [System.Drawing.Font]::new($FontName, 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$titleBrush = [System.Drawing.SolidBrush]::new((New-Color '#0b2545'))
Draw-CenteredText -Graphics $g -Text 'Flowchart: ระบบยืม-คืนอุปกรณ์' -Font $titleFont -Brush $titleBrush -X 0 -Y 12 -Width 2800 -Height 80

Draw-EllipseBox -Graphics $g -CenterX 1400 -CenterY 140 -Width 280 -Height 88 -Text 'เริ่มต้น' -Fill (New-Color '#dbeafe') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 1400 -CenterY 280 -Width 420 -Height 100 -Text 'ลงทะเบียน / Login' -Fill (New-Color '#e0f2fe') -Font $nodeFont | Out-Null
Draw-Diamond -Graphics $g -CenterX 1400 -CenterY 430 -Width 380 -Height 170 -Text "บทบาทผู้ใช้`n(Admin / Staff)" -Fill (New-Color '#ffedd5') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 800 -CenterY 590 -Width 360 -Height 100 -Text 'เลือกอุปกรณ์' -Fill (New-Color '#dcfce7') -Font $nodeFont | Out-Null
Draw-Diamond -Graphics $g -CenterX 800 -CenterY 770 -Width 360 -Height 170 -Text 'available_qty > 0 ?' -Fill (New-Color '#ffedd5') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 550 -CenterY 960 -Width 360 -Height 110 -Text 'แจ้ง: ไม่มีอุปกรณ์ว่าง' -Fill (New-Color '#fee2e2') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 1050 -CenterY 960 -Width 360 -Height 120 -Text "สร้างคำขอยืม`nstatus = pending" -Fill (New-Color '#dcfce7') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 2000 -CenterY 590 -Width 360 -Height 110 -Text 'Admin ตรวจสอบคำขอ' -Fill (New-Color '#e0e7ff') -Font $nodeFont | Out-Null
Draw-Diamond -Graphics $g -CenterX 2000 -CenterY 770 -Width 330 -Height 160 -Text 'อนุมัติ?' -Fill (New-Color '#ffedd5') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 1750 -CenterY 960 -Width 360 -Height 120 -Text "status = approved`navailable_qty--" -Fill (New-Color '#dbeafe') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 2250 -CenterY 960 -Width 360 -Height 110 -Text 'status = rejected' -Fill (New-Color '#fee2e2') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 1750 -CenterY 1140 -Width 300 -Height 100 -Text 'ทำรายการคืน' -Fill (New-Color '#dbeafe') -Font $nodeFont | Out-Null
Draw-Diamond -Graphics $g -CenterX 1750 -CenterY 1310 -Width 360 -Height 165 -Text 'สาเหตุการคืน' -Fill (New-Color '#ffedd5') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 1500 -CenterY 1490 -Width 360 -Height 130 -Text "normal / resigned`nstatus = returned`navailable_qty++" -Fill (New-Color '#dcfce7') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 2000 -CenterY 1490 -Width 360 -Height 130 -Text "broken`nstatus = returned`nไม่เพิ่มสต็อก" -Fill (New-Color '#fef3c7') -Font $nodeFont | Out-Null
Draw-RoundedBox -Graphics $g -CenterX 1750 -CenterY 1660 -Width 300 -Height 100 -Text 'บันทึกรายงาน' -Fill (New-Color '#e0e7ff') -Font $nodeFont | Out-Null
Draw-EllipseBox -Graphics $g -CenterX 1400 -CenterY 1760 -Width 260 -Height 88 -Text 'จบ' -Fill (New-Color '#dbeafe') -Font $nodeFont | Out-Null

Draw-Arrow -Graphics $g -X1 1400 -Y1 184 -X2 1400 -Y2 230 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1400 -Y1 330 -X2 1400 -Y2 350 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1240 -Y1 470 -X2 930 -Y2 545 -Label 'Staff' -LabelDX -20 -LabelDY -18 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1560 -Y1 470 -X2 1860 -Y2 545 -Label 'Admin' -LabelDX 30 -LabelDY -18 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 800 -Y1 640 -X2 800 -Y2 685 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 700 -Y1 830 -X2 605 -Y2 905 -Label 'ไม่' -LabelDX -20 -LabelDY -6 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 900 -Y1 830 -X2 995 -Y2 905 -Label 'มี' -LabelDX 20 -LabelDY -6 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1210 -Y1 960 -X2 1820 -Y2 590 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 2000 -Y1 645 -X2 2000 -Y2 690 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1910 -Y1 835 -X2 1815 -Y2 905 -Label 'อนุมัติ' -LabelDX -5 -LabelDY -8 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 2090 -Y1 835 -X2 2185 -Y2 905 -Label 'ไม่อนุมัติ' -LabelDX 10 -LabelDY -8 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1750 -Y1 1020 -X2 1750 -Y2 1090 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1750 -Y1 1190 -X2 1750 -Y2 1228 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1670 -Y1 1370 -X2 1550 -Y2 1425 -Label 'normal / resigned' -LabelDX -20 -LabelDY -10 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1830 -Y1 1370 -X2 1950 -Y2 1425 -Label 'broken' -LabelDX 20 -LabelDY -10 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 2250 -Y1 1015 -X2 1790 -Y2 1608 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1500 -Y1 1555 -X2 1700 -Y2 1608 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 2000 -Y1 1555 -X2 1800 -Y2 1608 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 550 -Y1 1015 -X2 1320 -Y2 1730 -LabelFont $labelFont
Draw-Arrow -Graphics $g -X1 1700 -Y1 1710 -X2 1530 -Y2 1742 -LabelFont $labelFont

$flowPath = Join-Path $outDir 'flowchart-equipment-borrow.png'
Save-Canvas -Canvas $flowCanvas -Path $flowPath
$titleFont.Dispose(); $nodeFont.Dispose(); $labelFont.Dispose(); $titleBrush.Dispose()

# -------- ER Diagram --------
$erCanvas = New-Canvas -Width 2600 -Height 1700
$g2 = $erCanvas.g
$g2.Clear((New-Color '#f9fafb'))

$titleFont2 = [System.Drawing.Font]::new($FontName, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$entityTitleFont = [System.Drawing.Font]::new($FontName, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$entityFont = [System.Drawing.Font]::new($FontName, 20, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$titleBrush2 = [System.Drawing.SolidBrush]::new((New-Color '#0b2545'))
Draw-CenteredText -Graphics $g2 -Text 'ER Diagram: ระบบยืม-คืนอุปกรณ์' -Font $titleFont2 -Brush $titleBrush2 -X 0 -Y 12 -Width 2600 -Height 80

function Draw-Entity {
    param(
        $Graphics,
        [double]$X,
        [double]$Y,
        [double]$Width,
        [double]$Height,
        [string]$Title,
        [string[]]$Fields,
        $TitleFont,
        $FieldFont
    )
    $pen = [System.Drawing.Pen]::new((New-Color '#4b5563'), 3)
    $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $headBrush = [System.Drawing.SolidBrush]::new((New-Color '#dbeafe'))
    $txtBrush = [System.Drawing.SolidBrush]::new((New-Color '#111827'))

    $bodyPath = New-RoundRectPath -X $X -Y $Y -Width $Width -Height $Height -Radius 14
    $Graphics.FillPath($bgBrush, $bodyPath)
    $Graphics.DrawPath($pen, $bodyPath)

    $headerPath = New-RoundRectPath -X $X -Y $Y -Width $Width -Height 56 -Radius 14
    $Graphics.FillPath($headBrush, $headerPath)
    $Graphics.DrawPath($pen, $headerPath)

    Draw-CenteredText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $txtBrush -X $X -Y $Y -Width $Width -Height 56

    $lineY = [double]($Y + 70)
    foreach ($field in $Fields) {
        $Graphics.DrawString($field, $FieldFont, $txtBrush, [System.Drawing.PointF]::new([single]($X + 16), [single]$lineY))
        $lineY += 28
    }

    $pen.Dispose(); $bgBrush.Dispose(); $headBrush.Dispose(); $txtBrush.Dispose(); $bodyPath.Dispose(); $headerPath.Dispose()
    return @{ x = $X; y = $Y; w = $Width; h = $Height; cx = ($X + $Width/2); cy = ($Y + $Height/2) }
}

function Draw-Relation {
    param(
        $Graphics,
        [double]$X1,
        [double]$Y1,
        [double]$X2,
        [double]$Y2,
        [string]$Label,
        [string]$Card1 = '1',
        [string]$Card2 = 'N',
        $Font
    )
    $pen = [System.Drawing.Pen]::new((New-Color '#374151'), 4)
    $txtBrush = [System.Drawing.SolidBrush]::new((New-Color '#1f2937'))
    $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $borderPen = [System.Drawing.Pen]::new((New-Color '#d1d5db'), 1)

    $Graphics.DrawLine($pen, [single]$X1, [single]$Y1, [single]$X2, [single]$Y2)
    $Graphics.DrawString($Card1, $Font, $txtBrush, [System.Drawing.PointF]::new([single]($X1 - 12), [single]($Y1 - 28)))
    $Graphics.DrawString($Card2, $Font, $txtBrush, [System.Drawing.PointF]::new([single]($X2 - 12), [single]($Y2 - 28)))

    $mx = ($X1 + $X2) / 2
    $my = ($Y1 + $Y2) / 2
    $size = $Graphics.MeasureString($Label, $Font)
    $w = [math]::Ceiling($size.Width + 16)
    $h = [math]::Ceiling($size.Height + 8)
    $x = $mx - ($w / 2)
    $y = $my - ($h / 2)
    $path = New-RoundRectPath -X $x -Y $y -Width $w -Height $h -Radius 8
    $Graphics.FillPath($bgBrush, $path)
    $Graphics.DrawPath($borderPen, $path)
    Draw-CenteredText -Graphics $Graphics -Text $Label -Font $Font -Brush $txtBrush -X $x -Y $y -Width $w -Height $h

    $pen.Dispose(); $txtBrush.Dispose(); $bgBrush.Dispose(); $borderPen.Dispose(); $path.Dispose()
}

$users = Draw-Entity -Graphics $g2 -X 120 -Y 270 -Width 560 -Height 410 -Title 'USERS' -Fields @(
    'PK id : uuid','username : string','password : string','full_name : string','employee_code : string',
    'department : string','role : string','is_active : bool','created_at : datetime','updated_at : datetime'
) -TitleFont $entityTitleFont -FieldFont $entityFont

$categories = Draw-Entity -Graphics $g2 -X 900 -Y 200 -Width 560 -Height 240 -Title 'EQUIPMENT_CATEGORIES' -Fields @(
    'PK id : uuid','name : string','description : text','created_at : datetime'
) -TitleFont $entityTitleFont -FieldFont $entityFont

$equipment = Draw-Entity -Graphics $g2 -X 900 -Y 530 -Width 560 -Height 360 -Title 'EQUIPMENT' -Fields @(
    'PK id : uuid','code : string','name : string','FK category_id -> categories.id','model : string',
    'total_quantity : int','available_qty : int','status : string','description : text'
) -TitleFont $entityTitleFont -FieldFont $entityFont

$borrow = Draw-Entity -Graphics $g2 -X 1740 -Y 430 -Width 700 -Height 420 -Title 'BORROW_REQUESTS' -Fields @(
    'PK id : uuid','request_code : string','FK borrower_id -> users.id','FK equipment_id -> equipment.id',
    'borrow_date : date','expected_return : date','status : string','FK approved_by -> users.id',
    'approved_at : datetime','notes : text'
) -TitleFont $entityTitleFont -FieldFont $entityFont

$return = Draw-Entity -Graphics $g2 -X 1740 -Y 980 -Width 700 -Height 320 -Title 'RETURN_RECORDS' -Fields @(
    'PK id : uuid','FK borrow_id -> borrow_requests.id','FK returned_by -> users.id','FK approved_by -> users.id',
    'return_date : date','return_reason : string','condition_note : text'
) -TitleFont $entityTitleFont -FieldFont $entityFont

Draw-Relation -Graphics $g2 -X1 $categories.cx -Y1 ($categories.y + $categories.h) -X2 $equipment.cx -Y2 $equipment.y -Label 'category_id' -Card1 '1' -Card2 'N' -Font $entityFont
Draw-Relation -Graphics $g2 -X1 ($users.x + $users.w) -Y1 ($users.y + $users.h/2) -X2 $borrow.x -Y2 ($borrow.y + 130) -Label 'borrower_id' -Card1 '1' -Card2 'N' -Font $entityFont
Draw-Relation -Graphics $g2 -X1 ($users.x + $users.w) -Y1 ($users.y + 170) -X2 $borrow.x -Y2 ($borrow.y + 265) -Label 'approved_by' -Card1 '1' -Card2 'N' -Font $entityFont
Draw-Relation -Graphics $g2 -X1 ($equipment.x + $equipment.w) -Y1 ($equipment.y + $equipment.h/2) -X2 $borrow.x -Y2 ($borrow.y + $borrow.h/2) -Label 'equipment_id' -Card1 '1' -Card2 'N' -Font $entityFont
Draw-Relation -Graphics $g2 -X1 $borrow.cx -Y1 ($borrow.y + $borrow.h) -X2 $return.cx -Y2 $return.y -Label 'borrow_id' -Card1 '1' -Card2 '0..1' -Font $entityFont
Draw-Relation -Graphics $g2 -X1 ($users.x + $users.w) -Y1 ($users.y + 330) -X2 $return.x -Y2 ($return.y + 160) -Label 'returned_by / approved_by' -Card1 '1' -Card2 'N' -Font $entityFont

$legendPen = [System.Drawing.Pen]::new((New-Color '#94a3b8'), 2)
$legendBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$legendTxt = [System.Drawing.SolidBrush]::new((New-Color '#1f2937'))
$legendPath = New-RoundRectPath -X 120 -Y 1470 -Width 980 -Height 150 -Radius 12
$g2.FillPath($legendBrush, $legendPath)
$g2.DrawPath($legendPen, $legendPath)
$g2.DrawString('Legend', $entityTitleFont, $legendTxt, [System.Drawing.PointF]::new(140,1490))
$g2.DrawString('1 = one, N = many, 0..1 = optional one', $entityFont, $legendTxt, [System.Drawing.PointF]::new(140,1540))
$legendPen.Dispose(); $legendBrush.Dispose(); $legendTxt.Dispose(); $legendPath.Dispose()

$erPath = Join-Path $outDir 'er-diagram-equipment-borrow.png'
Save-Canvas -Canvas $erCanvas -Path $erPath

$titleFont2.Dispose(); $entityTitleFont.Dispose(); $entityFont.Dispose(); $titleBrush2.Dispose()

Write-Output "Font used: $FontName"
Write-Output $flowPath
Write-Output $erPath
