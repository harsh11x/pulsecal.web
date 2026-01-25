#!/bin/bash
# COMPLETE fix for rate limiter - removes old code and rebuilds
# Run this on AWS: bash COMPLETE_FIX_RATE_LIMITER.sh

set -e  # Exit on error

echo "🔧 COMPLETE Rate Limiter Fix"
echo "============================"

cd ~/pulsecal.web/backend || { echo "❌ Backend directory not found!"; exit 1; }

# 1. Stop PM2 completely
echo ""
echo "⏹️  Step 1: Stopping PM2..."
pm2 stop pulsecal 2>/dev/null || true
pm2 delete pulsecal 2>/dev/null || true
echo "✅ PM2 stopped"

# 2. DELETE dist folder completely
echo ""
echo "🗑️  Step 2: Deleting old build..."
rm -rf dist/
if [ -d "dist" ]; then
    echo "❌ ERROR: dist/ still exists! Manual deletion needed"
    exit 1
fi
echo "✅ Old build deleted"

# 3. Verify source code
echo ""
echo "🔍 Step 3: Verifying source code..."
if grep -q "^app.use(apiRateLimiter)" src/app.ts; then
    echo "❌ ERROR: Rate limiter still enabled in src/app.ts!"
    exit 1
fi
if grep -q "^// app.use(apiRateLimiter)" src/app.ts; then
    echo "✅ Rate limiter is commented out in source"
else
    echo "⚠️  WARNING: Rate limiter line not found in source"
fi

# 4. Pull latest code (if using git)
echo ""
echo "📥 Step 4: Pulling latest code..."
if [ -d ".git" ]; then
    git pull || echo "⚠️  Git pull failed, continuing..."
else
    echo "⚠️  Not a git repo, skipping pull"
fi

# 5. Rebuild from scratch
echo ""
echo "🔨 Step 5: Building..."
npm run build
if [ ! -f "dist/app.js" ]; then
    echo "❌ ERROR: Build failed! dist/app.js not found"
    exit 1
fi
echo "✅ Build successful"

# 6. Verify compiled code
echo ""
echo "🔍 Step 6: Verifying compiled code..."
# Check for actual usage (not comments) - look for uncommented app.use with apiRateLimiter
if grep -E "^\s*app\.use\(apiRateLimiter\)|^\s*app\.use\(.*apiRateLimiter" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//"; then
    echo "❌ ERROR: Rate limiter is being used in compiled code!"
    echo "   This means the source code still has it enabled"
    exit 1
fi
# Also check if apiRateLimiter is imported (not commented)
if grep -E "^\s*import.*apiRateLimiter|^\s*const.*apiRateLimiter.*=.*require" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//"; then
    echo "❌ ERROR: Rate limiter is imported in compiled code!"
    exit 1
fi
echo "✅ Compiled code looks good (rate limiter not active)"

# 7. Start PM2
echo ""
echo "▶️  Step 7: Starting PM2..."
pm2 start server.js --name pulsecal
sleep 3

# 8. Check status
echo ""
echo "📋 Step 8: Checking status..."
pm2 status pulsecal

# 9. Show recent logs
echo ""
echo "📋 Step 9: Recent logs (last 30 lines):"
pm2 logs pulsecal --lines 30 --nostream

# 10. Check for rate limiter errors
echo ""
echo "🔍 Step 10: Checking for rate limiter errors..."
ERROR_COUNT=$(pm2 logs pulsecal --err --lines 50 --nostream | grep -i "rate-limit\|ERR_ERL" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "⚠️  WARNING: Found $ERROR_COUNT rate limiter errors in logs"
    echo "   This might be from old log entries. Wait a few seconds and check again."
else
    echo "✅ No rate limiter errors found"
fi

echo ""
echo "============================"
echo "✅ Done!"
echo ""
echo "📋 To monitor logs:"
echo "   pm2 logs pulsecal"
echo ""
echo "📋 To check for errors:"
echo "   pm2 logs pulsecal --err"
echo ""
echo "🔄 If you still see rate limiter errors:"
echo "   1. Wait 10 seconds"
echo "   2. Make a request from frontend"
echo "   3. Check logs again: pm2 logs pulsecal --err --lines 20"

