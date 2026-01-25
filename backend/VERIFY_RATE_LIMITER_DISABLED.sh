#!/bin/bash
# Quick verification script - checks if rate limiter is disabled
# Run this on AWS: bash VERIFY_RATE_LIMITER_DISABLED.sh

cd ~/pulsecal.web/backend || exit 1

echo "🔍 Checking if rate limiter is disabled..."
echo ""

# Check source code
echo "📄 Source code (src/app.ts):"
if grep -q "^// import.*apiRateLimiter\|^//.*app.use(apiRateLimiter)" src/app.ts; then
    echo "✅ Rate limiter is commented out in source"
else
    echo "❌ Rate limiter might be enabled in source!"
    grep -n "apiRateLimiter" src/app.ts | head -5
fi

echo ""
echo "📦 Compiled code (dist/app.js):"
# Check for actual uncommented usage
ACTIVE_USAGE=$(grep -E "app\.use\(apiRateLimiter\)|app\.use\(.*apiRateLimiter" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//" | head -1)
if [ -z "$ACTIVE_USAGE" ]; then
    echo "✅ No active rate limiter usage found in compiled code"
else
    echo "❌ Found active rate limiter usage:"
    echo "$ACTIVE_USAGE"
fi

# Check for imports
ACTIVE_IMPORT=$(grep -E "import.*apiRateLimiter|require.*apiRateLimiter" dist/app.js 2>/dev/null | grep -v "//" | grep -v "^\s*//" | head -1)
if [ -z "$ACTIVE_IMPORT" ]; then
    echo "✅ No active rate limiter import found"
else
    echo "❌ Found active rate limiter import:"
    echo "$ACTIVE_IMPORT"
fi

echo ""
echo "📋 PM2 Status:"
pm2 status pulsecal

echo ""
echo "💡 If rate limiter is still active, run: bash COMPLETE_FIX_RATE_LIMITER.sh"

