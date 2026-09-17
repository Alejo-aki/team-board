$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEAM BOARD - LAMBDA / SAM" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Construyendo Lambda dentro de Docker..." -ForegroundColor Yellow
sam build --use-container --template-file infra/sam/template.yaml

Write-Host "`n[2/2] Iniciando SAM en el puerto 3001..." -ForegroundColor Yellow

sam local start-api `
  --template-file .aws-sam/build/template.yaml `
  --docker-network team-board_default `
  --port 3001
