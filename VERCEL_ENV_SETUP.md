# Vercel Environment Variables Setup

## CRITICAL: Fix Mixed Content Errors

Your frontend is HTTPS but trying to connect to HTTP backend. This causes **Mixed Content** errors.

## Solution: Set Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add these variables:

```
BACKEND_URL=https://your-backend-domain.com
```

OR if your backend is behind a load balancer with HTTPS:

```
BACKEND_URL=http://13.205.127.21:3001
```

OR if you have a domain for backend:

```
BACKEND_URL=https://api.pulsecal.com
```

## Current Issue

- Frontend: `https://www.pulsecal.com` (HTTPS)
- Backend: `http://13.205.127.21:3001` (HTTP)
- Result: Browser blocks requests (Mixed Content)

## Fix Options

### Option 1: Use HTTPS Backend (Recommended)
Set up SSL certificate on your backend server and use HTTPS URL.

### Option 2: Use Next.js Proxy (Current Setup)
The proxy route (`/api/v1/[...path]`) should handle this, but it needs `BACKEND_URL` env var set correctly.

### Option 3: Use Load Balancer with HTTPS
If you have AWS ALB with SSL, use that HTTPS endpoint.

## After Setting Environment Variables

1. Redeploy frontend on Vercel
2. Test - mixed content errors should be gone

