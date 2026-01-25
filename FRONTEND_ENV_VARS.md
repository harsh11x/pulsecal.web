# Frontend Environment Variables (Vercel/Netlify)

## Set These in Your Frontend Deployment Platform

Go to your Vercel/Netlify dashboard → Project Settings → Environment Variables

### Required Variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_BACKEND_URL=http://13.205.127.21:3001
NEXT_PUBLIC_SOCKET_URL=/api/v1
```

### Important Notes:

1. **`NEXT_PUBLIC_API_URL`** = `/api/v1` (relative path)
   - Frontend uses this as base URL for API calls
   - Goes through Next.js proxy at `/api/v1/[...path]`

2. **`NEXT_PUBLIC_BACKEND_URL`** = `http://13.205.127.21:3001` (no `/api/v1`)
   - Used by Next.js proxy to forward requests to backend
   - The proxy adds `/api/v1` automatically

3. **`NEXT_PUBLIC_SOCKET_URL`** = `/api/v1` (relative path)
   - Socket.IO connects through Next.js proxy
   - Avoids mixed content issues

### Firebase Variables (if needed):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pulsecal-72bb4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pulsecal-72bb4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pulsecal-72bb4.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## How It Works:

1. Frontend makes request to `/api/v1/auth/profile`
2. Next.js proxy (`app/api/v1/[...path]/route.ts`) receives it
3. Proxy forwards to `http://13.205.127.21:3001/api/v1/auth/profile`
4. Backend processes and returns response
5. Proxy returns response to frontend

This setup:
- ✅ Avoids CORS issues
- ✅ Hides backend URL from client
- ✅ Works with HTTPS frontend + HTTP backend
- ✅ Allows easy backend URL changes

