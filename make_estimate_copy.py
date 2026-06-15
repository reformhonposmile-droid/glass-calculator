from pathlib import Path

downloads = Path.home() / "Downloads"
source = max(
    (p for p in downloads.glob("index_*.html") if 80000 < p.stat().st_size < 90000),
    key=lambda p: p.stat().st_mtime,
)

output = Path(
    r"C:\Users\izawa-glass8\Documents\Codex\2026-06-04\files-mentioned-by-the-user-index\outputs\estimate_app.html"
)

html = source.read_text(encoding="utf-8")
html = html.replace("ガラス価格表", "ガラス修理計算ソフト")
html = html.replace("繧ｬ繝ｩ繧ｹ萓｡譬ｼ陦ｨ", "ガラス修理計算ソフト")
output.write_text(html, encoding="utf-8")

print(f"{source} -> {output} ({output.stat().st_size} bytes)")
