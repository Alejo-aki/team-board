$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEAM BOARD - INICIO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Levantando PostgreSQL, backend y frontend..." -ForegroundColor Yellow
docker compose up -d --build

Write-Host "`n[2/3] Instalando dependencias y arrancando backend..." -ForegroundColor Yellow
docker compose exec -d backend sh -c "npm install && npm run dev"

Write-Host "`n[3/3] Servicios disponibles:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5173"
Write-Host "  Backend:  http://localhost:3000"
Write-Host "  Database: localhost:5432"

Write-Host "`nBackend y frontend estan ejecutandose en Docker." -ForegroundColor Green
Write-Host "Para Lambda/SAM ejecuta: .\scripts\start-lambda.ps1" -ForegroundColor Green

