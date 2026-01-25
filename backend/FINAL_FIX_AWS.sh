#!/bin/bash
# FINAL FIX - Remove rate limiter completely and rebuild
set -e

echo "🔧 FINAL FIX - Removing Rate Limiter"
echo "===================================="

cd ~/pulsecal.web/backend || exit 1

# 1. Stop PM2
echo "⏹️  Stopping PM2..."
pm2 stop pulsecal 2>/dev/null || true
pm2 delete pulsecal 2>/dev/null || true

# 2. Delete old build
echo "🗑️  Deleting old build..."
rm -rf dist/

# 3. Pull latest code
echo "📥 Pulling latest code..."
git pull

# 4. Verify rate limiter is removed from source
echo "🔍 Verifying source code..."
if grep -q "^import.*apiRateLimiter\|^app.use(apiRateLimiter)" src/app.ts; then
    echo "❌ ERROR: Rate limiter still in source!"
    exit 1
fi
echo "✅ Rate limiter removed from source"

# 5. Rebuild
echo "🔨 Building..."
npm run build

# 6. Verify compiled code
echo "🔍 Verifying compiled code..."
if grep -E "^\s*app\.use\(apiRateLimiter\)|^\s*import.*apiRateLimiter" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//"; then
    echo "❌ ERROR: Rate limiter still in compiled code!"
    exit 1
fi
echo "✅ Rate limiter not in compiled code"

# 7. Start
echo "▶️  Starting..."
pm2 start server.js --name pulsecal
sleep 3

# 8. Check status
pm2 status pulsecal

# 9. Check logs
echo ""
echo "📋 Recent logs (should have NO rate limiter errors):"
pm2 logs pulsecal --lines 20 --nostream

echo ""
echo "✅ DONE! Rate limiter removed."

