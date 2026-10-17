$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$env:OLLAMA_MODELS = Join-Path $taskRoot 'models'
$env:OLLAMA_HOST = '127.0.0.1:11435'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
$env:OLLAMA_CONTEXT_LENGTH = '4096'
$env:OLLAMA_KEEP_ALIVE = '10m'
$env:OLLAMA_VULKAN = '0'
$process = Start-Process -FilePath (Join-Path $taskRoot 'runtime\ollama.exe') -ArgumentList 'serve' -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskRoot 'server.stdout.log') -RedirectStandardError (Join-Path $taskRoot 'server.stderr.log')
$process.Id | Set-Content -LiteralPath (Join-Path $taskRoot 'server.pid')
Write-Output "Local Ollama started: PID=$($process.Id), endpoint=http://127.0.0.1:11435"
