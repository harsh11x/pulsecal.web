# Complete Vercel Environment Variables Setup

## Set These in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### Required Variables (Production):

```bash
# API Configuration - Use relative paths to avoid mixed content
NEXT_PUBLIC_API_URL=/api/v1

# Backend URL for server-side proxy (server-side only, won't cause mixed content)
BACKEND_URL=http://13.205.127.21:3000
```

### DO NOT SET THESE (They cause mixed content errors):

❌ `NEXT_PUBLIC_BACKEND_URL` - DELETE if exists
❌ `NEXT_PUBLIC_SOCKET_URL` - DELETE if exists

### Firebase Variables (if needed):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pulsecal-72bb4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pulsecal-72bb4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pulsecal-72bb4.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Database Variables (if needed):

```bash
DATABASE_URL=your-database-url
DIRECT_URL=your-direct-database-url
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key
```

## How It Works:

1. Frontend makes request to `/api/v1/auth/profile` (relative path)
2. Next.js proxy (`app/api/v1/[...path]/route.ts`) receives it server-side
3. Proxy forwards to `BACKEND_URL/api/v1/auth/profile` (server-side, no mixed content)
4. Backend processes and returns response
5. Proxy returns response to frontend

## After Setting Variables:

1. Click **"Redeploy"** in Vercel
2. Wait for deployment to complete
3. Test - mixed content errors should be gone!

