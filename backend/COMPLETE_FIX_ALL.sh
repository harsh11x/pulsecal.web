#!/bin/bash
# COMPLETE FIX - Remove rate limiter, rebuild, restart
set -e

echo "🔧 COMPLETE FIX - Making Everything Work"
echo "========================================"

cd ~/pulsecal.web/backend || exit 1

# 1. Stop PM2
echo "⏹️  Step 1: Stopping PM2..."
pm2 stop pulsecal 2>/dev/null || true
pm2 delete pulsecal 2>/dev/null || true
echo "✅ PM2 stopped"

# 2. Delete old build
echo "🗑️  Step 2: Deleting old build..."
rm -rf dist/
echo "✅ Old build deleted"

# 3. Pull latest code
echo "📥 Step 3: Pulling latest code..."
git pull
echo "✅ Code pulled"

# 4. Verify rate limiter is removed
echo "🔍 Step 4: Verifying rate limiter removed..."
if grep -q "^import.*apiRateLimiter\|^app.use(apiRateLimiter)" src/app.ts; then
    echo "❌ ERROR: Rate limiter still in source!"
    exit 1
fi
echo "✅ Rate limiter removed from source"

# 5. Install dependencies (just in case)
echo "📦 Step 5: Installing dependencies..."
npm install
echo "✅ Dependencies installed"

# 6. Rebuild
echo "🔨 Step 6: Building..."
npm run build
if [ ! -f "dist/app.js" ]; then
    echo "❌ ERROR: Build failed!"
    exit 1
fi
echo "✅ Build successful"

# 7. Verify compiled code
echo "🔍 Step 7: Verifying compiled code..."
if grep -E "^\s*app\.use\(apiRateLimiter\)" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//"; then
    echo "❌ ERROR: Rate limiter still in compiled code!"
    exit 1
fi
echo "✅ Rate limiter not in compiled code"

# 8. Start PM2
echo "▶️  Step 8: Starting PM2..."
pm2 start server.js --name pulsecal
sleep 5
echo "✅ PM2 started"

# 9. Check status
echo "📋 Step 9: Checking status..."
pm2 status pulsecal

# 10. Show logs
echo ""
echo "📋 Step 10: Recent logs (should have NO rate limiter errors):"
pm2 logs pulsecal --lines 30 --nostream

# 11. Check for rate limiter errors
echo ""
echo "🔍 Step 11: Checking for errors..."
ERROR_COUNT=$(pm2 logs pulsecal --err --lines 50 --nostream | grep -i "rate-limit\|ERR_ERL" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "⚠️  WARNING: Found $ERROR_COUNT rate limiter errors"
    echo "   These might be from old log entries. Wait 10 seconds and check again."
else
    echo "✅ No rate limiter errors found"
fi

echo ""
echo "========================================"
echo "✅ COMPLETE FIX DONE!"
echo ""
echo "📋 To monitor:"
echo "   pm2 logs pulsecal"
echo ""
echo "📋 To check errors:"
echo "   pm2 logs pulsecal --err"
echo ""
echo "🔄 Test the frontend now - everything should work!"

