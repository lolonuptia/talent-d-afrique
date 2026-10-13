$root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "Demarrage du backend (FastAPI)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"

Start-Sleep -Seconds 2

Write-Host "Demarrage du frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "Backend  : http://localhost:8000" -ForegroundColor Green
Write-Host "Docs API : http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Deux nouvelles fenetres se sont ouvertes. Ferme-les pour arreter les serveurs." -ForegroundColor Yellow
