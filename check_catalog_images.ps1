$catalog = 'C:\Users\izawa-glass8\Documents\Codex\2026-06-04\files-mentioned-by-the-user-index\outputs\float-chat\product-catalog.html'
$root = Split-Path -Parent $catalog
$html = Get-Content -LiteralPath $catalog -Raw -Encoding UTF8
$matches = [regex]::Matches($html, '"(catalog image/[^"]+)"')
$missing = @()
foreach ($m in $matches) {
  $rel = $m.Groups[1].Value
  $path = Join-Path $root $rel
  if (-not (Test-Path -LiteralPath $path)) {
    $missing += $rel
  }
}
if ($missing.Count) {
  $missing | Sort-Object -Unique
  exit 1
}
'OK'
