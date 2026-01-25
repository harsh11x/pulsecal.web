# AWS Deployment Instructions

## Quick Fix for Rate Limiter Errors

The server is crashing because of rate limiter configuration. Follow these steps:

### 1. Pull Latest Code
```bash
cd ~/pulsecal.web/backend
git pull origin main  # or your branch name
```

### 2. Rebuild the Backend
```bash
npm run build
```

### 3. Restart PM2
```bash
pm2 restart pulsecal
```

### 4. Check Logs
```bash
pm2 logs pulsecal --lines 50
```

You should see:
- ✅ Server running on 0.0.0.0:3001
- ✅ No rate limiter errors
- ✅ Requests appearing in logs when you use the frontend

## If Still Not Working

### Check if Requests Are Reaching Server

Test directly:
```bash
curl -X GET http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Check Frontend Proxy

The frontend uses `/api/v1` which proxies to your backend. Make sure:
1. Frontend is deployed with `BACKEND_URL=http://13.205.127.21:3001` environment variable
2. Or frontend uses the Next.js proxy at `/api/v1/...`

### Verify Environment Variables

On AWS server, check:
```bash
cd ~/pulsecal.web/backend
cat .env | grep CORS_ORIGIN
```

Should show:
```
CORS_ORIGIN=https://www.pulsecal.com,https://pulsecal.com
```

## Permanent Fix

After confirming server works, re-enable rate limiter in `backend/src/app.ts`:
```typescript
app.use(apiRateLimiter);
```

Then rebuild and restart.

