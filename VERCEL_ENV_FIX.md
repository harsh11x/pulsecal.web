# Fix Vercel Environment Variables

## Current Problem
Mixed content errors because HTTP URLs are exposed to the browser.

## Solution: Update These Variables

### ✅ KEEP (Correct):
- `NEXT_PUBLIC_API_URL` = `/api/v1` ✅
- `BACKEND_URL` = `http://13.205.127.21:3001` ✅ (server-side only, OK)

### ❌ DELETE (Causing Mixed Content):
- `NEXT_PUBLIC_SOCKET_URL` - DELETE this variable
- `NEXT_PUBLIC_BACKEND_URL` - DELETE this variable

## Why?

1. **`NEXT_PUBLIC_*` variables are exposed to the browser**
   - If they contain HTTP URLs, browser blocks them (mixed content)
   - Frontend is HTTPS, so it can't load HTTP resources

2. **Socket connections will use relative path**
   - The socket service code automatically uses `/api/v1` if no HTTP URL is found
   - This goes through Next.js proxy (server-side), avoiding mixed content

3. **API calls already work**
   - `NEXT_PUBLIC_API_URL=/api/v1` is correct
   - Goes through proxy at `app/api/v1/[...path]/route.ts`
   - Proxy uses `BACKEND_URL` (server-side) to connect to backend

## Steps:

1. Go to Vercel → Settings → Environment Variables
2. Delete `NEXT_PUBLIC_SOCKET_URL`
3. Delete `NEXT_PUBLIC_BACKEND_URL`
4. Click "Redeploy" button
5. Wait for deployment to complete
6. Test - mixed content errors should be gone!

## Final Environment Variables:

```
NEXT_PUBLIC_API_URL=/api/v1
BACKEND_URL=http://13.205.127.21:3001
```

That's it! The proxy handles everything server-side.

