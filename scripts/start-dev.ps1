$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $project "backend"
$frontendWsl = "/home/cyberbount/UDTT_K23A/api_local/local-lab-ai/frontend"

$venvPython = Join-Path $project ".venv\Scripts\python.exe"
$wslProject = "/home/cyberbount/UDTT_K23A/api_local/local-lab-ai"
$wslPython = "$wslProject/.venv/bin/python"

try {
    Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 | Out-Null
    Write-Host "Ollama: OK" -ForegroundColor Green
} catch {
    Write-Host "Ollama chua chay. Mo Ollama app hoac chay: ollama serve" -ForegroundColor Yellow
}

$backendCheck = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $backendCheck) {
    Start-Process wsl.exe -WindowStyle Hidden -ArgumentList @(
        "-d", "Ubuntu-E",
        "--cd", $wslProject,
        "bash", "-lc", "$wslPython -m uvicorn app.main:app --app-dir backend --reload --port 8000"
    ) | Out-Null
    Write-Host "FastAPI dang khoi dong tren http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "FastAPI: dang chay tren http://localhost:8000" -ForegroundColor Green
}

$frontendCheck = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $frontendCheck) {
    Start-Process wsl.exe -ArgumentList @(
        "-d", "Ubuntu-E",
        "--cd", $frontendWsl,
        "npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"
    ) | Out-Null
    Write-Host "Frontend dang khoi dong tren http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "Frontend: dang chay tren http://localhost:5173" -ForegroundColor Green
}

Start-Sleep -Seconds 3
Write-Host ""
Write-Host "Mo trinh duyet: http://localhost:5173/login" -ForegroundColor Cyan
Write-Host "API docs:        http://localhost:8000/docs" -ForegroundColor Cyan
