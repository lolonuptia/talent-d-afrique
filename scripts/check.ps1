$root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "=== Verification backend (Ruff) ===" -ForegroundColor Cyan
Set-Location "$root\backend"
.\.venv\Scripts\Activate.ps1
ruff check app
ruff format app --check

Write-Host ""
Write-Host "=== Verification frontend (ESLint) ===" -ForegroundColor Cyan
Set-Location "$root\frontend"
npm run lint

Set-Location $root
Write-Host ""
Write-Host "Verification terminee." -ForegroundColor Green
