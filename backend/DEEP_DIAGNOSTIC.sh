#!/bin/bash

echo "=========================================="
echo "DEEP DIAGNOSTIC - FINDING 500 ERRORS"
echo "=========================================="

# Check if server is running
echo ""
echo "1. Checking PM2 status..."
pm2 status

# Check output logs for 500 errors
echo ""
echo "2. Checking OUTPUT logs for 500 errors (last 100 lines)..."
pm2 logs pulsecal --out --lines 100 | grep -i "500\|error\|exception\|failed" | tail -30

# Check error logs
echo ""
echo "3. Checking ERROR logs (last 100 lines)..."
pm2 logs pulsecal --err --lines 100 | tail -30

# Check recent requests
echo ""
echo "4. Checking recent API requests..."
pm2 logs pulsecal --out --lines 200 | grep -E "GET|POST|PUT|DELETE|PATCH" | tail -20

# Test the endpoints directly
echo ""
echo "5. Testing /health endpoint..."
curl -s http://localhost:3001/health || echo "❌ Health check failed"

# Test auth profile endpoint (will fail without auth, but should show error)
echo ""
echo "6. Testing /api/v1/auth/profile (without auth - should show 401, not 500)..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3001/api/v1/auth/profile

# Check if server is actually receiving requests
echo ""
echo "7. Checking if server is listening on port 3001..."
netstat -tlnp | grep 3001 || ss -tlnp | grep 3001 || echo "Port 3001 not found in netstat/ss"

# Check process
echo ""
echo "8. Checking Node process..."
ps aux | grep "node.*server.js\|node.*dist/server.js" | grep -v grep

# Check if dist/server.js exists and is recent
echo ""
echo "9. Checking build files..."
if [ -f "dist/server.js" ]; then
    echo "✅ dist/server.js exists"
    ls -lh dist/server.js
    echo "Last modified: $(stat -c %y dist/server.js 2>/dev/null || stat -f %Sm dist/server.js 2>/dev/null)"
else
    echo "❌ dist/server.js NOT FOUND!"
fi

# Check for TypeScript errors in source
echo ""
echo "10. Checking for obvious code errors..."
if grep -r "console.error\|throw new Error" src/ --include="*.ts" | head -5; then
    echo "Found some error handling (this is normal)"
fi

# Check environment variables
echo ""
echo "11. Checking critical environment variables..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    grep -E "DATABASE_URL|FIREBASE|PORT|CORS" .env | sed 's/=.*/=***/' | head -5
else
    echo "❌ .env file NOT FOUND!"
fi

# Check database connection
echo ""
echo "12. Testing database connection..."
if command -v psql &> /dev/null; then
    echo "psql available, but skipping direct DB test (would need credentials)"
else
    echo "psql not available"
fi

# Show full recent logs
echo ""
echo "=========================================="
echo "FULL RECENT LOGS (last 30 lines)"
echo "=========================================="
pm2 logs pulsecal --lines 30 --nostream

echo ""
echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "If you see 500 errors in the frontend but nothing here,"
echo "the requests might not be reaching the backend."
echo ""
echo "Check:"
echo "1. Is the frontend pointing to the correct backend URL?"
echo "2. Are there CORS issues blocking requests?"
echo "3. Is a load balancer/proxy in front of the server?"

