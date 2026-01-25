#!/bin/bash
# Check what's causing 500 errors
echo "🔍 Checking backend logs for 500 errors..."
echo ""

cd ~/pulsecal.web/backend || exit 1

echo "📋 Recent error logs:"
pm2 logs pulsecal --err --lines 100 --nostream | tail -50

echo ""
echo "📋 Recent output logs (look for actual errors):"
pm2 logs pulsecal --lines 100 --nostream | grep -i "error\|exception\|failed\|500" | tail -30

echo ""
echo "💡 To see live logs: pm2 logs pulsecal"
echo "💡 To see only errors: pm2 logs pulsecal --err"
