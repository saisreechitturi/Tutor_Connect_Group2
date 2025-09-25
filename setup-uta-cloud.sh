#!/bin/bash

# Setup script for UTA cloud deployment environment
# This script copies the UTA cloud environment files to their active locations

echo "[INFO] Setting up UTA CLOUD deployment environment..."

# Backend setup
if [ -f "backend/.env.cloud" ]; then
    cp backend/.env.cloud backend/.env
    echo "[SUCCESS] Backend: Copied .env.cloud to .env"
else
    echo "[ERROR] Backend: .env.cloud not found!"
    exit 1
fi

# Frontend setup
if [ -f "frontend/.env.cloud" ]; then
    cp frontend/.env.cloud frontend/.env.production
    echo "[SUCCESS] Frontend: Copied .env.cloud to .env.production"
else
    echo "[ERROR] Frontend: .env.cloud not found!"
    exit 1
fi

echo "[SUCCESS] UTA cloud deployment environment is ready!"
echo ""
echo "[WARNING] IMPORTANT: Update the environment files with your actual UTA cloud values:"
echo "1. Edit backend/.env with your UTA PostgreSQL credentials"
echo "2. Edit frontend/.env.production with your UTA backend URL"
echo ""
echo "Next steps:"
echo "1. Deploy database: sudo -u postgres psql -f deployment/setup-database.sql"
echo "2. Deploy backend: cd backend && ../deployment/deploy-backend.sh"
echo "3. Deploy frontend: cd frontend && ../deployment/deploy-frontend.sh"