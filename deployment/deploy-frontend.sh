#!/bin/bash

# UTA Cloud Deployment Script for Frontend
# This script builds and deploys the React frontend to UTA cloud infrastructure

echo "[INFO] Starting UTA Cloud Frontend Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json not found. Make sure you're in the frontend directory."
    exit 1
fi

# Install dependencies
echo "[INFO] Installing dependencies..."
npm install

# Build the React application
echo "[INFO] Building React application for production..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "[ERROR] Build failed. No build directory found."
    exit 1
fi

echo "[SUCCESS] Build completed successfully!"
echo "[INFO] Files ready for deployment in the 'build' directory"

# If using a static web server on UTA cloud, copy files to the appropriate directory
# Uncomment and modify the following lines based on your UTA cloud setup:
# 
# echo "[INFO] Copying build files to web server directory..."
# cp -r build/* /path/to/your/uta/web/directory/
# 
# echo "[INFO] Restarting web server..."
# sudo systemctl restart apache2  # or nginx, depending on your setup

echo "[SUCCESS] Frontend deployment completed!"
echo "[INFO] Static files are ready in the 'build' directory"