$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$parent = Split-Path -Parent $root
$sourcePath = Get-ChildItem -LiteralPath $parent -Filter '*.html' | Where-Object { $_.Name -like '*Pit Wall*' } | Select-Object -First 1 -ExpandProperty FullName

$publicCss = Join-Path $root 'public/css'
$publicJs = Join-Path $root 'public/js'
$publicAssets = Join-Path $root 'public/assets'
$publicIcons = Join-Path $root 'public/icons'

New-Item -ItemType Directory -Force -Path $publicCss, $publicJs, $publicAssets, $publicIcons | Out-Null

$source = Get-Content -LiteralPath $sourcePath -Raw -Encoding utf8

$styleStart = $source.IndexOf('<style>')
$styleEnd = $source.IndexOf('</style>', $styleStart)
if ($styleStart -lt 0 -or $styleEnd -lt 0) { throw 'Could not find inline style block.' }
$styleContent = $source.Substring($styleStart + 7, $styleEnd - ($styleStart + 7))

$source = $source.Substring(0, $styleStart) + '<link rel="stylesheet" href="./css/style.css">' + $source.Substring($styleEnd + 8)
$source = $source -replace 'href="\.\/sachin&#39;s Pit Wall · Live F1 2026 Dashboard_files\/css2"', 'href="./css/style2.css"'
$source = $source -replace 'src="\.\/sachin&#39;s Pit Wall · Live F1 2026 Dashboard_files\/upi-qr\.png"', 'src="./assets/upi-qr.png"'
$source = $source -replace 'src="\.\/sachin&#39;s Pit Wall · Live F1 2026 Dashboard_files\/saved_resource\.html"', 'src="./assets/saved_resource.html"'

$marker = '// safety: if fetch never returns, kill splash after 4 s'
$markerIndex = $source.IndexOf($marker)
if ($markerIndex -lt 0) { throw 'Could not find the main app script marker.' }
$scriptStart = $source.LastIndexOf('<script>', $markerIndex)
$scriptEnd = $source.IndexOf('</script>', $markerIndex)
if ($scriptStart -lt 0 -or $scriptEnd -lt 0) { throw 'Could not find the main app script boundaries.' }
$scriptContent = $source.Substring($scriptStart + 8, $scriptEnd - ($scriptStart + 8))

$finalHtml = $source.Substring(0, $scriptStart) + '<script defer src="./js/app.js"></script>' + "`r`n</body>`r`n</html>`r`n"

$finalHtml = $finalHtml.Replace("<title>sachin's Pit Wall · Live F1 2026 Dashboard</title>", '<title>Pit Wall · Live F1 2026 Dashboard</title>')
$finalHtml = $finalHtml.Replace('href="./sachin&#39;s Pit Wall · Live F1 2026 Dashboard_files/css2"', 'href="./css/style2.css"')
$finalHtml = $finalHtml.Replace('src="./sachin&#39;s Pit Wall · Live F1 2026 Dashboard_files/upi-qr.png"', 'src="./assets/upi-qr.png"')
$finalHtml = $finalHtml.Replace('src="./sachin&#39;s Pit Wall · Live F1 2026 Dashboard_files/saved_resource.html"', 'src="./assets/saved_resource.html"')
$finalHtml = $finalHtml.Replace('Hey <em>sachin</em>, enjoying your wall?', 'Hey there, enjoying Pit Wall?')
$finalHtml = $finalHtml.Replace('Good evening, sachin', 'Good evening')
$finalHtml = $finalHtml.Replace("sachin's", 'Pit Wall')
$finalHtml = $finalHtml.Replace('For sachin · Lights out and away we go', 'Lights out and away we go')
$finalHtml = [regex]::Replace($finalHtml, '(?s)\s*<!-- COLOPHON FOOTER · the build, the data, the changelog -->.*?<div class="footer-wrap">', "`r`n    <div class=\"footer-wrap\">")

Set-Content -LiteralPath (Join-Path $publicCss 'style.css') -Value $styleContent -Encoding utf8
Set-Content -LiteralPath (Join-Path $publicJs 'app.js') -Value $scriptContent -Encoding utf8
Set-Content -LiteralPath (Join-Path $publicCss 'style2.css') -Value (Get-Content -LiteralPath (Join-Path $parent 'css2') -Raw -Encoding utf8) -Encoding utf8
Copy-Item -LiteralPath (Join-Path $parent 'upi-qr.png') -Destination (Join-Path $publicAssets 'upi-qr.png') -Force
Set-Content -LiteralPath (Join-Path $publicAssets 'saved_resource.html') -Value (Get-Content -LiteralPath (Join-Path $parent 'saved_resource.html') -Raw -Encoding utf8) -Encoding utf8
Set-Content -LiteralPath (Join-Path $publicIcons '.gitkeep') -Value '' -Encoding utf8
Set-Content -LiteralPath (Join-Path $publicCss '.gitkeep') -Value '' -Encoding utf8
Set-Content -LiteralPath (Join-Path $publicJs '.gitkeep') -Value '' -Encoding utf8
Set-Content -LiteralPath (Join-Path $root 'public/index.html') -Value $finalHtml -Encoding utf8
Write-Output 'migrated'
