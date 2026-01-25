# URGENT: Deploy Updated Code to AWS

## The Problem
The rate limiter is still enabled on AWS and blocking ALL requests. You need to deploy the updated code.

## Steps to Fix (Run on AWS Server)

```bash
# 1. Go to backend directory
cd ~/pulsecal.web/backend

# 2. Pull latest code (if using git)
git pull origin main
# OR manually copy the updated files from your local machine

# 3. Make sure you have the latest code:
# - backend/src/app.ts (rate limiter should be commented out)
# - backend/src/middlewares/rateLimit.middleware.ts (with trustProxy: true)

# 4. Rebuild the TypeScript code
npm run build

# 5. Verify build succeeded (should see no errors)
ls -la dist/

# 6. Restart PM2
pm2 restart pulsecal

# 7. Check logs - should see NO rate limiter errors
pm2 logs pulsecal --lines 50
```

## What to Look For

After restart, you should see:
- ✅ "Server running on 0.0.0.0:3001"
- ✅ NO rate limiter errors
- ✅ When you use frontend, requests should appear in logs

## If You Don't Have Git

If you're not using git, you need to manually copy these files to AWS:

1. `backend/src/app.ts` - Make sure rate limiter is commented out
2. `backend/src/middlewares/rateLimit.middleware.ts` - Should have `trustProxy: true`
3. `backend/src/config/socket.ts` - Should have proper CORS config
4. `backend/server.js` - Should have port 3001

Then run `npm run build` and `pm2 restart pulsecal`

