$downloadDir = 'C:\Users\izawa-glass8\Downloads'
$sourceItem = Get-ChildItem -LiteralPath $downloadDir -Filter 'index_*.html' |
  Where-Object { $_.Length -gt 80000 -and $_.Length -lt 90000 } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
if (-not $sourceItem) {
  throw 'Source HTML was not found in Downloads.'
}
$source = $sourceItem.FullName
$output = 'C:\Users\izawa-glass8\Documents\Codex\2026-06-04\files-mentioned-by-the-user-index\outputs\index_float_chat.html'

$html = Get-Content -LiteralPath $source -Raw -Encoding UTF8

$chatCss = @'

<style>
.float-chat-launcher{
  position:fixed;
  right:18px;
  bottom:18px;
  z-index:9999;
  display:flex;
  align-items:center;
  gap:10px;
  min-height:52px;
  border:0;
  border-radius:999px;
  background:#7c3d58;
  color:#fff;
  padding:8px 16px 8px 10px;
  box-shadow:0 12px 32px rgba(26,26,46,.28);
  font-weight:700;
}
.float-chat-launcher img{
  width:38px;
  height:38px;
  object-fit:contain;
}
.float-chat-panel{
  position:fixed;
  right:16px;
  bottom:84px;
  z-index:9998;
  width:min(420px,calc(100vw - 32px));
  height:min(680px,calc(100dvh - 108px));
  overflow:hidden;
  border:1px solid rgba(26,26,46,.16);
  border-radius:10px;
  background:#fff;
  box-shadow:0 20px 60px rgba(26,26,46,.30);
  transform:translateY(12px);
  opacity:0;
  pointer-events:none;
  transition:opacity .18s ease,transform .18s ease;
}
.float-chat-panel.open{
  transform:translateY(0);
  opacity:1;
  pointer-events:auto;
}
.float-chat-panel iframe{
  display:block;
  width:100%;
  height:100%;
  border:0;
}
.float-chat-close{
  position:absolute;
  top:8px;
  right:8px;
  z-index:2;
  width:34px;
  height:34px;
  border:0;
  border-radius:8px;
  background:rgba(255,255,255,.92);
  color:#2a2226;
  font-size:22px;
  line-height:1;
  box-shadow:0 4px 14px rgba(42,34,38,.14);
}
@media (max-width:720px){
  .float-chat-launcher{
    right:12px;
    bottom:12px;
    min-height:48px;
    padding-right:14px;
  }
  .float-chat-panel{
    inset:0;
    width:auto;
    height:auto;
    border-radius:0;
  }
}
</style>
'@

$chatHtml = @'

<button class="float-chat-launcher" id="float-chat-launcher" type="button" aria-controls="float-chat-panel" aria-expanded="false">
  <img src="float-chat/assets/float-icon.png" alt="">
  <span>フロートに相談</span>
</button>
<section class="float-chat-panel" id="float-chat-panel" aria-label="フロート相談室">
  <button class="float-chat-close" id="float-chat-close" type="button" aria-label="チャットを閉じる">×</button>
  <iframe title="フロート相談室" src="float-chat/index.html"></iframe>
</section>
'@

$chatJs = @'

<script>
(function(){
  const launcher=document.getElementById('float-chat-launcher');
  const panel=document.getElementById('float-chat-panel');
  const close=document.getElementById('float-chat-close');
  if(!launcher||!panel||!close) return;
  function setOpen(open){
    panel.classList.toggle('open',open);
    launcher.setAttribute('aria-expanded',open?'true':'false');
  }
  launcher.addEventListener('click',()=>setOpen(!panel.classList.contains('open')));
  close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',(event)=>{
    if(event.key==='Escape') setOpen(false);
  });
})();
</script>
'@

if ($html -notmatch 'float-chat-launcher') {
  $html = $html -replace '</head>', ($chatCss + "`r`n</head>")
  $html = $html -replace '</body>', ($chatHtml + "`r`n" + $chatJs + "`r`n</body>")
}

$html = $html -replace '<title>.*?</title>', '<title>ガラス価格表 + フロート相談室</title>'
$html = $html -replace '(<meta name="apple-mobile-web-app-title" content=")[^"]*(">)', '$1ガラス価格表$2'

Set-Content -LiteralPath $output -Value $html -Encoding UTF8
