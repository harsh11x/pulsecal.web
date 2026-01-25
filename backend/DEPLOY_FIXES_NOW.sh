#!/bin/bash
# DEPLOY ALL FIXES NOW - Run this on AWS
set -e

echo "🚀 DEPLOYING ALL FIXES..."
echo "========================"

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
git pull || echo "⚠️  Git pull failed, continuing..."

# 4. Rebuild
echo "🔨 Building..."
npm run build

# 5. Start
echo "▶️  Starting..."
pm2 start server.js --name pulsecal
sleep 3

# 6. Check status
pm2 status pulsecal

# 7. Show logs
echo ""
echo "📋 Recent logs:"
pm2 logs pulsecal --lines 20 --nostream

echo ""
echo "✅ DEPLOYED! Check logs above for any errors."

