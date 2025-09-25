# PowerShell script for setting up UTA cloud deployment environment
# Run this script: .\setup-uta-cloud.ps1

Write-Host "[INFO] Setting up UTA CLOUD deployment environment..." -ForegroundColor Green

# Backend setup
if (Test-Path "backend\.env.cloud") {
    Copy-Item "backend\.env.cloud" "backend\.env" -Force
    Write-Host "[SUCCESS] Backend: Copied .env.cloud to .env" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Backend: .env.cloud not found!" -ForegroundColor Red
    exit 1
}

# Frontend setup
if (Test-Path "frontend\.env.cloud") {
    Copy-Item "frontend\.env.cloud" "frontend\.env.production" -Force
    Write-Host "[SUCCESS] Frontend: Copied .env.cloud to .env.production" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Frontend: .env.cloud not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] UTA cloud deployment environment is ready!" -ForegroundColor Yellow
Write-Host ""
Write-Host "[WARNING] IMPORTANT: Update the environment files with your actual UTA cloud values:" -ForegroundColor Yellow
Write-Host "1. Edit backend\.env with your UTA PostgreSQL credentials"
Write-Host "2. Edit frontend\.env.production with your UTA backend URL"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy database: Run PostgreSQL setup script on UTA server"
Write-Host "2. Deploy backend: cd backend; ..\deployment\deploy-backend.sh"
Write-Host "3. Deploy frontend: cd frontend; ..\deployment\deploy-frontend.sh"