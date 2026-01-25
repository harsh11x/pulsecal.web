# Environment Variables Setup Guide

## Backend .env File (AWS Server)

**Location:** `~/pulsecal.web/backend/.env`

**Important:** The backend `.env` file should NOT contain `NEXT_PUBLIC_*` variables. Those are for the frontend only.

### Required Variables:

```bash
# Server
NODE_ENV=production
PORT=3001
API_VERSION=v1
CORS_ORIGIN=https://pulsecal.com,https://www.pulsecal.com,http://localhost:3000

# Security
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Firebase
FIREBASE_PROJECT_ID=pulsecal-72bb4
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Razorpay
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# Optional: Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Frontend Environment Variables (Vercel/Netlify)

**Location:** Your frontend deployment platform's environment variables settings

### Required Variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_BACKEND_URL=http://13.205.127.21:3001
NEXT_PUBLIC_SOCKET_URL=/api/v1

# Firebase (if needed)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pulsecal-72bb4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pulsecal-72bb4
# ... other Firebase config
```

### Important Notes:

1. **`NEXT_PUBLIC_API_URL`** should be `/api/v1` (relative path) - this goes through Next.js proxy
2. **`NEXT_PUBLIC_BACKEND_URL`** is used by the Next.js proxy to forward requests - should be `http://13.205.127.21:3001`
3. **`NEXT_PUBLIC_SOCKET_URL`** should be `/api/v1` (relative path) for Socket.IO

## Current Issue

Your backend `.env` has frontend variables. Remove these from backend `.env`:

```bash
# REMOVE THESE FROM BACKEND .env:
NEXT_PUBLIC_BACKEND_URL=http://13.205.127.21:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://13.205.127.21:3001/api/v1
NEXT_PUBLIC_API_URL=http://13.205.127.21:3001/api/v1
```

These should only be in your **frontend deployment** (Vercel/Netlify).

## Fix Your Backend .env

Edit `~/pulsecal.web/backend/.env` and remove the `NEXT_PUBLIC_*` lines:

```bash
# Remove these lines:
# NEXT_PUBLIC_BACKEND_URL=http://13.205.127.21:3001/api/v1
# NEXT_PUBLIC_SOCKET_URL=http://13.205.127.21:3001/api/v1
# NEXT_PUBLIC_API_URL=http://13.205.127.21:3001/api/v1
```

Then restart:
```bash
pm2 restart pulsecal
```

