# Complete AWS Backend Environment Variables

## Set These in Your AWS Server `.env` File

Location: `~/pulsecal.web/backend/.env`

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
API_VERSION=v1

# CORS - Allow your frontend domains
CORS_ORIGIN=https://pulsecal.com,https://www.pulsecal.com,http://localhost:3000

# Security
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Firebase Admin SDK
FIREBASE_PROJECT_ID=pulsecal-72bb4
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Database
DATABASE_URL=your-postgres-connection-string
DIRECT_URL=your-direct-postgres-connection-string

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Razorpay (if using)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# Calendly (if using)
CALENDLY_CLIENT_ID=your-client-id
CALENDLY_CLIENT_SECRET=your-secret
CALENDLY_REDIRECT_URI=https://www.pulsecal.com/api/v1/auth/calendly/callback
```

## Important Notes:

1. **NO rate limiter variables needed** - Rate limiter is completely removed
2. **CORS_ORIGIN** must include your frontend domains
3. **PORT** should be 3001
4. After updating `.env`, restart PM2: `pm2 restart pulsecal`

