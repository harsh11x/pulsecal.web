#!/bin/bash

echo "=========================================="
echo "CHECKING BACKEND LOGS FOR 500 ERRORS"
echo "=========================================="

# Check error logs for actual 500 errors
echo ""
echo "--- Checking for 500 errors in last 50 lines ---"
pm2 logs pulsecal --err --lines 50 | grep -A 10 -B 5 "500\|Error\|error\|Exception\|TypeError\|ReferenceError" || echo "No obvious errors found in last 50 lines"

echo ""
echo "--- Checking output logs for recent requests ---"
pm2 logs pulsecal --out --lines 30 | tail -30

echo ""
echo "=========================================="
echo "FORCING COMPLETE REBUILD AND RESTART"
echo "=========================================="

# Kill all PM2 processes
echo "1. Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# Remove old build
echo "2. Removing old build..."
rm -rf dist/
rm -rf node_modules/.cache/

# Pull latest code
echo "3. Pulling latest code..."
cd ~/pulsecal.web/backend
git pull origin main

# Verify rate limiter is removed
echo "4. Verifying rate limiter removal..."
if grep -r "rateLimit\|apiRateLimiter" src/ --include="*.ts" | grep -v "//.*rateLimit"; then
    echo "⚠️  WARNING: Rate limiter still found in source code!"
else
    echo "✅ Rate limiter removed from source"
fi

# Clean install
echo "5. Running clean install..."
npm ci

# Build
echo "6. Building TypeScript..."
npm run build

# Check if build succeeded
if [ ! -f "dist/server.js" ]; then
    echo "❌ BUILD FAILED - dist/server.js not found!"
    exit 1
fi

# Verify rate limiter is not in compiled code
echo "7. Verifying rate limiter not in compiled code..."
if grep -r "rateLimit\|apiRateLimiter" dist/ --include="*.js" | grep -v "//.*rateLimit" | grep -v "node_modules"; then
    echo "⚠️  WARNING: Rate limiter found in compiled code!"
    echo "Checking which files..."
    grep -r "rateLimit\|apiRateLimiter" dist/ --include="*.js" | grep -v "node_modules" | head -5
else
    echo "✅ Rate limiter not in compiled code"
fi

# Start server
echo "8. Starting server..."
pm2 start dist/server.js --name pulsecal

# Wait a moment
sleep 3

# Check status
echo ""
echo "9. Checking PM2 status..."
pm2 status

# Show recent logs
echo ""
echo "10. Recent logs (last 20 lines)..."
pm2 logs pulsecal --lines 20 --nostream

echo ""
echo "=========================================="
echo "DONE! Check logs with: pm2 logs pulsecal"
echo "=========================================="

