# 本机一键启动：Copilot 服务 + 网站，开好以后打开浏览器的行程页。
# 用法（在仓库根目录双击 start.cmd，或者在 PowerShell 里）：
#   powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1            # 平常用：免费的云端模型优先，本机模型兜底
#   powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -LocalModel # 只用本机 Qwen3.5 4B（不调任何云端 API）
#   powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Stop       # 关掉这个脚本开的东西（双击 stop.cmd 也行）
# 网站和 Copilot 各开一个窗口，日志都在窗口里；关掉窗口就停了。
param(
  [switch]$LocalModel,
  [switch]$Stop,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$state = Join-Path $root '.local-run'
$pidFile = Join-Path $state 'pids.txt'
New-Item -ItemType Directory -Force $state | Out-Null

function Say($text) { Write-Host "  $text" }
function Listening($port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}
function Fetch($url) {
  try { return Invoke-RestMethod -Uri $url -TimeoutSec 3 } catch { return $null }
}

# ---------- 关掉 ----------
if ($Stop) {
  if (Test-Path $pidFile) {
    foreach ($line in Get-Content $pidFile) {
      $parts = $line -split ' ', 2
      if (Get-Process -Id $parts[0] -ErrorAction SilentlyContinue) {
        taskkill /T /F /PID $parts[0] | Out-Null
        Say "已关掉：$($parts[1])"
      }
    }
    Remove-Item $pidFile
  } else {
    Say '没有找到这个脚本开过的东西。'
  }
  exit 0
}

Write-Host ''
Write-Host '  NPS Guide · 本机启动' -ForegroundColor Yellow
Write-Host ''

# ---------- 检查工具 ----------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw '找不到 Node.js（要 24 版），先装：https://nodejs.org/' }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw '找不到 Python（3.11 以上），先装：https://www.python.org/' }

if (-not (Test-Path (Join-Path $root 'node_modules'))) {
  Say '第一次运行：安装网站的依赖（npm install，几分钟）……'
  Push-Location $root; npm install; Pop-Location
}
# Windows PowerShell 5.1 里把外部程序的报错重定向会被当成脚本出错，这一句先放宽
$ErrorActionPreference = 'Continue'
python -c "import fastapi, uvicorn" 2>$null
$missing = $LASTEXITCODE -ne 0
$ErrorActionPreference = 'Stop'
if ($missing) {
  Say '第一次运行：安装 Copilot 的依赖（python -m pip install -e copilot[api]）……'
  python -m pip install -e "$root\copilot[api]"
}
# 在 git worktree（.claude/worktrees/<名字>）里跑时，主仓库也算（Copilot 会去那里找 key）
$mainRoot = $root
if ((Split-Path -Leaf (Split-Path -Parent $root)) -eq 'worktrees') {
  $mainRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $root))
}
if (-not (Test-Path (Join-Path $root '.env.local')) -and -not (Test-Path (Join-Path $mainRoot '.env.local'))) {
  Say '没有 .env.local：Copilot 只能用本机模型；想用免费的云端模型，照 .env.example 填上 key。'
}

$started = @()

# ---------- 本机模型（Ollama） ----------
# 平常是云端模型都出错时的最后一个；-LocalModel 时只用它
$ollamaUrl = $null
if (Listening 11435) { $ollamaUrl = 'http://127.0.0.1:11435' }
elseif (Listening 11434) { $ollamaUrl = 'http://127.0.0.1:11434' }
else {
  # 仓库主人电脑上的便携版；在 git worktree 里跑时它在主仓库
  foreach ($dir in @((Join-Path $root 'experiments\local-model-validation'), (Join-Path $mainRoot 'experiments\local-model-validation'))) {
    if (Test-Path (Join-Path $dir 'runtime\ollama.exe')) {
      Say '启动本机模型服务（便携版 Ollama，端口 11435）……'
      # 不能用管道接它的输出：Ollama 会继承管道，管道一直不关，这里就一直等
      Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $dir 'start-local.ps1') -WindowStyle Hidden -Wait
      $ollamaPid = Get-Content (Join-Path $dir 'server.pid')
      $started += "$ollamaPid 本机模型服务（Ollama）"
      $ollamaUrl = 'http://127.0.0.1:11435'
      break
    }
  }
}
if ($ollamaUrl) { Say "本机模型：$ollamaUrl" }
elseif ($LocalModel) { throw '-LocalModel 要本机开着 Ollama（11434 或 11435 端口），没找到。' }
else { Say '本机模型：没开（只用云端模型，云端都出错时这一句会失败）' }

# ---------- Copilot 服务 ----------
$copilotPort = $null
foreach ($port in 8765, 8766, 8767) {
  if (-not (Listening $port)) { $copilotPort = $port; break }
  $health = Fetch "http://127.0.0.1:$port/health"
  if ($health -and $health.version) { $copilotPort = $port; Say "Copilot 已经开着（端口 $port，版本 $($health.version)），直接用。"; break }
}
if (-not $copilotPort) { throw '8765–8767 端口都被别的程序占了。' }
$copilotUrl = "http://127.0.0.1:$copilotPort"

if (-not (Fetch "$copilotUrl/health")) {
  $envs = "`$env:PYTHONIOENCODING='utf-8';"
  if ($ollamaUrl) { $envs += " `$env:OLLAMA_HOST_URL='$ollamaUrl';" }
  if ($LocalModel) { $envs += " `$env:COPILOT_PROVIDER='ollama';" }
  $mode = if ($LocalModel) { '只用本机模型' } else { '云端免费模型优先' }
  $command = "`$host.UI.RawUI.WindowTitle='NPS Guide · Copilot（$mode，端口 $copilotPort）'; $envs Set-Location '$root\copilot'; python -m nps_copilot serve --port $copilotPort"
  $process = Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $command -PassThru
  $started += "$($process.Id) Copilot 服务"
  Say "启动 Copilot（$mode，端口 $copilotPort）……"
}

# ---------- 网站 ----------
$siteUp = Listening 3000
if ($siteUp) {
  Say '网站已经开着（端口 3000），直接用。'
  if ($copilotPort -ne 8765) { Say "注意：开着的网站默认连 8765；Copilot 在 $copilotPort，要在 .env.local 写 COPILOT_URL=$copilotUrl 再重启网站。" }
} else {
  $command = "`$host.UI.RawUI.WindowTitle='NPS Guide · 网站（http://localhost:3000）'; `$env:COPILOT_URL='$copilotUrl'; Set-Location '$root'; npm run dev"
  $process = Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $command -PassThru
  $started += "$($process.Id) 网站"
  Say '启动网站（npm run dev，第一次打开页面要编译几十秒）……'
}

if ($started.Count) { Add-Content -Path $pidFile -Value $started -Encoding UTF8 }

# ---------- 等两个都起来 ----------
$deadline = (Get-Date).AddMinutes(3)
$copilotOk = $false; $siteOk = $false
while ((Get-Date) -lt $deadline -and -not ($copilotOk -and $siteOk)) {
  if (-not $copilotOk -and (Fetch "$copilotUrl/health")) { $copilotOk = $true; Say 'Copilot 好了。' }
  if (-not $siteOk -and (Listening 3000)) { $siteOk = $true; Say '网站好了。' }
  Start-Sleep -Milliseconds 800
}
if (-not $copilotOk) { Write-Host '  Copilot 3 分钟还没起来，看它的窗口里报了什么错。' -ForegroundColor Red }
if (-not $siteOk) { Write-Host '  网站 3 分钟还没起来，看它的窗口里报了什么错。' -ForegroundColor Red }

$page = 'http://localhost:3000/zh-Hans/plan'
Write-Host ''
Write-Host "  行程页（最上面是 Copilot 对话框）：$page" -ForegroundColor Green
Write-Host '  后台：http://localhost:3000/zh-Hans/admin    英文后台：http://localhost:3000/en/admin'
Write-Host '  关掉：双击 stop.cmd，或者直接关掉那两个窗口。'
Write-Host ''
if (-not $NoBrowser -and $siteOk) { Start-Process $page }
