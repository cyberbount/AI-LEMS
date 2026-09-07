$ErrorActionPreference = "SilentlyContinue"

Get-NetTCPConnection -LocalPort 8000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Get-NetTCPConnection -LocalPort 5173 -State Listen | ForEach-Object { wsl.exe -- bash -lc "fuser -k 5173/tcp" }

Write-Host "Da dung FastAPI va Vite." -ForegroundColor Green
