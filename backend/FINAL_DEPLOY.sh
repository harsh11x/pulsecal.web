#!/bin/bash
# FINAL DEPLOYMENT - Makes everything work
set -e

echo "🚀 FINAL DEPLOYMENT"
echo "=================="

cd ~/pulsecal.web/backend || exit 1

# Kill everything
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f node 2>/dev/null || true
sleep 2

# Delete old build
rm -rf dist/
rm -rf node_modules/.cache/

# Pull latest
git fetch origin
git reset --hard origin/main

# Remove rate limiter file if exists
rm -f src/middlewares/rateLimit.middleware.ts

# Install and build
npm ci
npm run build

# Verify no rate limiter
if grep -i "apiRateLimiter" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//"; then
    echo "❌ Rate limiter still in compiled code!"
    exit 1
fi

# Start
pm2 start server.js --name pulsecal
sleep 5

# Show status
pm2 status pulsecal
pm2 logs pulsecal --lines 20 --nostream

echo ""
echo "✅ DEPLOYED! Test now."

