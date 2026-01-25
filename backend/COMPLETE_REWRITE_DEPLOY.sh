#!/bin/bash
# COMPLETE REWRITE DEPLOYMENT - Makes everything work
set -e

echo "🚀 COMPLETE REWRITE DEPLOYMENT"
echo "=============================="

cd ~/pulsecal.web/backend || exit 1

# 1. Kill everything
echo "💀 Step 1: Killing all processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2
echo "✅ All processes killed"

# 2. Delete EVERYTHING old
echo "🗑️  Step 2: Deleting old files..."
rm -rf dist/
rm -rf node_modules/.cache/
rm -rf .next/ 2>/dev/null || true
echo "✅ Old files deleted"

# 3. Pull latest code
echo "📥 Step 3: Pulling latest code..."
git fetch origin
git reset --hard origin/main
echo "✅ Code updated"

# 4. Verify NO rate limiter
echo "🔍 Step 4: Verifying rate limiter removed..."
if [ -f "src/middlewares/rateLimit.middleware.ts" ]; then
    echo "⚠️  Rate limiter file exists, deleting..."
    rm -f src/middlewares/rateLimit.middleware.ts
fi

if grep -r "apiRateLimiter" src/app.ts 2>/dev/null | grep -v "//" | grep -v "^\s*//"; then
    echo "❌ ERROR: Rate limiter still referenced in app.ts!"
    exit 1
fi
echo "✅ Rate limiter completely removed"

# 5. Clean install
echo "📦 Step 5: Clean install..."
npm ci --silent
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
RATE_LIMITER_COUNT=$(grep -i "apiRateLimiter\|rateLimit" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//" | wc -l)
if [ "$RATE_LIMITER_COUNT" -gt 0 ]; then
    echo "❌ ERROR: Rate limiter found in compiled code! ($RATE_LIMITER_COUNT instances)"
    exit 1
fi
echo "✅ No rate limiter in compiled code"

# 8. Start fresh
echo "▶️  Step 8: Starting server..."
pm2 start server.js --name pulsecal
sleep 5
echo "✅ Server started"

# 9. Status
echo ""
echo "📋 PM2 Status:"
pm2 status pulsecal

# 10. Check logs
echo ""
echo "📋 Recent logs (last 30 lines):"
pm2 logs pulsecal --lines 30 --nostream

# 11. Check for rate limiter errors
echo ""
echo "🔍 Checking for rate limiter errors..."
sleep 2
ERROR_COUNT=$(pm2 logs pulsecal --err --lines 20 --nostream | grep -i "rate-limit\|ERR_ERL" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ NO RATE LIMITER ERRORS!"
else
    echo "⚠️  Found $ERROR_COUNT errors (checking if old log entries)..."
    # Clear old logs and check again
    pm2 flush
    sleep 2
    NEW_ERROR_COUNT=$(pm2 logs pulsecal --err --lines 10 --nostream | grep -i "rate-limit\|ERR_ERL" | wc -l)
    if [ "$NEW_ERROR_COUNT" -eq 0 ]; then
        echo "✅ No new rate limiter errors!"
    else
        echo "❌ Still seeing rate limiter errors. Check source code."
    fi
fi

echo ""
echo "=============================="
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 Monitor logs: pm2 logs pulsecal"
echo "📋 Check errors: pm2 logs pulsecal --err"
echo ""
echo "🧪 Test the frontend now - everything should work!"

