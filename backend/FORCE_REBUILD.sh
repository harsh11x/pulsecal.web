#!/bin/bash
# Force complete rebuild and restart on AWS
# Run this on AWS server: bash FORCE_REBUILD.sh

echo "🔄 Force rebuilding backend..."

cd ~/pulsecal.web/backend || exit 1

# 1. Stop PM2
echo "⏹️  Stopping PM2..."
pm2 stop pulsecal

# 2. Delete old build
echo "🗑️  Deleting old build..."
rm -rf dist/

# 3. Clear node_modules cache (optional but helps)
echo "🧹 Clearing cache..."
npm cache clean --force

# 4. Rebuild
echo "🔨 Building..."
npm run build

# 5. Verify build
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist/ folder not found"
    exit 1
fi

echo "✅ Build successful"

# 6. Start PM2
echo "▶️  Starting PM2..."
pm2 start server.js --name pulsecal

# 7. Show logs
echo "📋 Recent logs:"
pm2 logs pulsecal --lines 30 --nostream

echo ""
echo "✅ Done! Check logs with: pm2 logs pulsecal"

