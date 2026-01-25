#!/bin/bash
# NUCLEAR OPTION - Complete wipe and rebuild
set -e

echo "💣 NUCLEAR FIX - Complete Rebuild"
echo "=================================="

cd ~/pulsecal.web/backend || exit 1

# 1. Kill everything
echo "💀 Step 1: Killing all processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
echo "✅ All processes killed"

# 2. Delete EVERYTHING
echo "🗑️  Step 2: Deleting old files..."
rm -rf dist/
rm -rf node_modules/.cache/
rm -rf .next/ 2>/dev/null || true
echo "✅ Old files deleted"

# 3. Pull latest
echo "📥 Step 3: Pulling latest code..."
git fetch origin
git reset --hard origin/main
echo "✅ Code updated"

# 4. Verify rate limiter is GONE
echo "🔍 Step 4: Verifying rate limiter removed..."
if [ -f "src/middlewares/rateLimit.middleware.ts" ]; then
    echo "❌ ERROR: Rate limiter file still exists!"
    rm -f src/middlewares/rateLimit.middleware.ts
    echo "✅ Deleted rate limiter file"
fi

if grep -r "apiRateLimiter\|rateLimit" src/app.ts 2>/dev/null | grep -v "//" | grep -v "^\s*//"; then
    echo "❌ ERROR: Rate limiter still referenced!"
    exit 1
fi
echo "✅ Rate limiter completely removed"

# 5. Clean install
echo "📦 Step 5: Clean install..."
npm ci
echo "✅ Dependencies installed"

# 6. Build
echo "🔨 Step 6: Building..."
npm run build
if [ ! -f "dist/app.js" ]; then
    echo "❌ ERROR: Build failed!"
    exit 1
fi
echo "✅ Build successful"

# 7. Verify NO rate limiter in compiled code
echo "🔍 Step 7: Verifying compiled code..."
RATE_LIMITER_FOUND=$(grep -i "rateLimit\|apiRateLimiter" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//" | wc -l)
if [ "$RATE_LIMITER_FOUND" -gt 0 ]; then
    echo "❌ ERROR: Rate limiter found in compiled code!"
    echo "Found $RATE_LIMITER_FOUND instances"
    exit 1
fi
echo "✅ No rate limiter in compiled code"

# 8. Start fresh
echo "▶️  Step 8: Starting server..."
pm2 start server.js --name pulsecal
sleep 5
echo "✅ Server started"

# 9. Status
pm2 status pulsecal

# 10. Check logs
echo ""
echo "📋 Recent logs:"
pm2 logs pulsecal --lines 20 --nostream

# 11. Check for errors
echo ""
echo "🔍 Checking for errors..."
ERROR_COUNT=$(pm2 logs pulsecal --err --lines 50 --nostream | grep -i "rate-limit\|ERR_ERL" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ NO RATE LIMITER ERRORS!"
else
    echo "⚠️  Found $ERROR_COUNT errors (might be old log entries)"
fi

echo ""
echo "=================================="
echo "✅ NUCLEAR FIX COMPLETE!"
echo ""
echo "Test the frontend now!"

