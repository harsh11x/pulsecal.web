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

# Fix common Supabase URL mistakes (@ in password) then validate
echo "🔧 Checking .env database URLs..."
npm run fix:env || true
echo "🔍 Validating .env and database connection..."
npm run verify:env

# Verify no rate limiter
if grep -i "apiRateLimiter" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//"; then
    echo "❌ Rate limiter still in compiled code!"
    exit 1
fi

# Start (reload env from .env)
pm2 delete pulsecal 2>/dev/null || true
pm2 start server.js --name pulsecal --update-env
pm2 save
sleep 5

# Show status
pm2 status pulsecal
pm2 logs pulsecal --lines 20 --nostream

echo "🔍 Health check..."
if curl -sf http://localhost:3001/health > /dev/null; then
  curl -s http://localhost:3001/health
  echo ""
  echo "✅ DEPLOYED! Backend is healthy on port 3001."
else
  echo "❌ Backend not responding on :3001. Check: pm2 logs pulsecal"
  exit 1
fi

