# PowerShell script for setting up local development environment
# Run this script: .\setup-local.ps1

Write-Host "[INFO] Setting up LOCAL development environment..." -ForegroundColor Green

# Backend setup
if (Test-Path "backend\.env.local") {
    Copy-Item "backend\.env.local" "backend\.env" -Force
    Write-Host "[SUCCESS] Backend: Copied .env.local to .env" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Backend: .env.local not found!" -ForegroundColor Red
    exit 1
}

# Frontend setup  
if (Test-Path "frontend\.env.local") {
    Write-Host "[SUCCESS] Frontend: .env.local is ready for use" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Frontend: .env.local not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] Local development environment is ready!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure PostgreSQL is running locally"
Write-Host "2. Update database credentials in backend\.env if needed"
Write-Host "3. Start the backend: cd backend; npm run dev"
Write-Host "4. Start the frontend: cd frontend; npm start"
Write-Host ""
Write-Host "The frontend will automatically use .env.local for development" -ForegroundColor Gray