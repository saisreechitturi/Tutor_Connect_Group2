#!/bin/bash

# Setup script for local development environment
# This script copies the local environment files to their active locations

echo "[INFO] Setting up LOCAL development environment..."

# Backend setup
if [ -f "backend/.env.local" ]; then
    cp backend/.env.local backend/.env
    echo "[SUCCESS] Backend: Copied .env.local to .env"
else
    echo "[ERROR] Backend: .env.local not found!"
    exit 1
fi

# Frontend setup  
if [ -f "frontend/.env.local" ]; then
    cp frontend/.env.local frontend/.env.local
    echo "[SUCCESS] Frontend: .env.local is ready for use"
else
    echo "[ERROR] Frontend: .env.local not found!"
    exit 1
fi

echo "[SUCCESS] Local development environment is ready!"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running locally"
echo "2. Update database credentials in backend/.env if needed"
echo "3. Start the backend: cd backend && npm run dev"
echo "4. Start the frontend: cd frontend && npm start"
echo ""
echo "The frontend will automatically use .env.local for development"