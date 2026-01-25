#!/bin/bash
# Check backend logs for 500 errors
# Run this on AWS: bash CHECK_500_ERRORS.sh

echo "🔍 Checking backend logs for 500 errors..."
echo ""

cd ~/pulsecal.web/backend || exit 1

# Check error logs
echo "📋 Recent error logs (last 50 lines):"
pm2 logs pulsecal --err --lines 50 --nostream | grep -i "error\|500\|exception" | tail -20

echo ""
echo "📋 All recent logs (last 30 lines):"
pm2 logs pulsecal --lines 30 --nostream

echo ""
echo "💡 To see live logs: pm2 logs pulsecal"
echo "💡 To see only errors: pm2 logs pulsecal --err"

