#!/bin/bash
# URGENT: Complete clean rebuild on AWS
# Run this on AWS: bash URGENT_FIX_AWS.sh

set -e  # Exit on error

echo "🚨 URGENT: Complete clean rebuild"
echo "================================"

cd ~/pulsecal.web/backend || { echo "❌ Backend directory not found!"; exit 1; }

# 1. Stop PM2 completely
echo ""
echo "⏹️  Step 1: Stopping PM2..."
pm2 stop pulsecal 2>/dev/null || true
pm2 delete pulsecal 2>/dev/null || true
echo "✅ PM2 stopped"

# 2. DELETE old build completely
echo ""
echo "🗑️  Step 2: Deleting old build..."
rm -rf dist/
if [ -d "dist" ]; then
    echo "❌ ERROR: dist/ still exists! Manual deletion needed"
    exit 1
fi
echo "✅ Old build deleted"

# 3. Verify source code has rate limiter disabled
echo ""
echo "🔍 Step 3: Verifying source code..."
if grep -q "app.use(apiRateLimiter)" src/app.ts; then
    echo "❌ ERROR: Rate limiter still enabled in src/app.ts!"
    echo "   Line should be commented: // app.use(apiRateLimiter);"
    exit 1
fi
echo "✅ Rate limiter is disabled in source"

# 4. Rebuild from scratch
echo ""
echo "🔨 Step 4: Building..."
npm run build
if [ ! -f "dist/app.js" ]; then
    echo "❌ ERROR: Build failed! dist/app.js not found"
    exit 1
fi
echo "✅ Build successful"

# 5. Verify compiled code doesn't use rate limiter
echo ""
echo "🔍 Step 5: Verifying compiled code..."
if grep -q "apiRateLimiter" dist/app.js; then
    echo "⚠️  WARNING: Rate limiter found in compiled code"
    echo "   This might be from imports, checking if it's actually used..."
    if grep -q "app.use.*apiRateLimiter\|app\.use\(apiRateLimiter\)" dist/app.js; then
        echo "❌ ERROR: Rate limiter is being used in compiled code!"
        exit 1
    fi
fi
echo "✅ Compiled code looks good"

# 6. Start PM2
echo ""
echo "▶️  Step 6: Starting PM2..."
pm2 start server.js --name pulsecal
sleep 2

# 7. Check if running
echo ""
echo "📋 Step 7: Checking status..."
pm2 status pulsecal

# 8. Show recent logs
echo ""
echo "📋 Recent logs (last 20 lines):"
pm2 logs pulsecal --lines 20 --nostream

echo ""
echo "================================"
echo "✅ Done! Check for rate limiter errors above"
echo ""
echo "If you see rate limiter errors, the old code is still running."
echo "Try: pm2 delete pulsecal && pm2 start server.js --name pulsecal"

