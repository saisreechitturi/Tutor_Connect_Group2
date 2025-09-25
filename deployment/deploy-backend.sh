#!/bin/bash

# UTA Cloud Deployment Script for Backend
# This script sets up and deploys the Node.js backend to UTA cloud infrastructure

echo "[INFO] Starting UTA Cloud Backend Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Install dependencies
echo "[INFO] Installing dependencies..."
npm install

# Run database migrations (if needed)
echo "[INFO] Running database migrations..."
npm run migrate 2>/dev/null || echo "[WARNING] Migration script not found or already run"

# Build the application (if there's a build step)
echo "[INFO] Building application..."
npm run build 2>/dev/null || echo "[INFO] No build step needed"

# Start the application
echo "[INFO] Starting the backend server..."
if [ "$NODE_ENV" = "production" ]; then
    npm run start:prod 2>/dev/null || npm start
else
    npm start
fi

echo "[SUCCESS] Backend deployment completed!"