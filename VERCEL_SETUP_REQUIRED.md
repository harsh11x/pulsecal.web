# VERCEL ENVIRONMENT VARIABLES - REQUIRED

The frontend on Vercel MUST have these environment variables set. Without them, the proxy will fail with 500 errors.

## Required Variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `BACKEND_URL` | `http://13.205.127.21:3000` | Backend server URL (server-side only) |
| `NEXT_PUBLIC_API_URL` | `/api/v1` | Frontend API base URL (uses proxy) |

## Important Notes

1. **`BACKEND_URL`** - This is used by the Next.js API routes (server-side) to proxy requests to AWS
2. **`NEXT_PUBLIC_API_URL`** - This is used by the frontend to make API calls through the proxy

## After Setting Variables

1. Click "Save" in Vercel
2. Go to "Deployments" 
3. Click the three dots on the latest deployment
4. Click "Redeploy" → "Redeploy"

## Testing

After redeploying, visit:

```
https://www.pulsecal.com/api/test-backend
```

This will show:
- What backend URL is configured
- If the connection to AWS is working
- Any error messages

## Common Issues

### Issue: 500 errors, backend logs show no requests
**Cause**: `BACKEND_URL` not set in Vercel
**Fix**: Add the environment variable and redeploy

### Issue: Mixed content errors
**Cause**: Frontend (HTTPS) trying to connect to backend (HTTP)
**Fix**: The proxy handles this - frontend calls `/api/v1` which proxies to HTTP backend

### Issue: CORS errors
**Cause**: Direct browser requests to backend
**Fix**: All requests should go through `/api/v1` proxy, not directly to backend

