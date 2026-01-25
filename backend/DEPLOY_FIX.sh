#!/bin/bash

echo "=========================================="
echo "DEPLOYING LATEST FIXES"
echo "=========================================="

# Stop server
echo "1. Stopping server..."
pm2 stop pulsecal
pm2 delete pulsecal

# Clean
echo "2. Cleaning old build..."
rm -rf dist/
rm -rf node_modules/.cache/

# Pull latest
echo "3. Pulling latest code..."
git pull origin main

# Install
echo "4. Installing dependencies..."
npm ci

# Build
echo "5. Building..."
npm run build

# Check build
if [ ! -f "dist/server.js" ]; then
    echo "❌ BUILD FAILED!"
    exit 1
fi

# Start
echo "6. Starting server..."
pm2 start dist/server.js --name pulsecal

# Wait
sleep 3

# Show status
echo ""
echo "7. Server status:"
pm2 status

# Show recent logs
echo ""
echo "8. Recent logs:"
pm2 logs pulsecal --lines 20 --nostream

echo ""
echo "=========================================="
echo "DONE! Now test the frontend and watch logs:"
echo "pm2 logs pulsecal --lines 0"
echo "=========================================="

