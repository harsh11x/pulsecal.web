# AWS Server Setup Guide

## Environment Variables Required

Set these in your AWS environment (EC2, ECS, or wherever you're running):

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
LISTEN_HOST=0.0.0.0  # Listen on all interfaces for AWS

# Frontend URL (for CORS and Socket.IO)
CORS_ORIGIN=https://www.pulsecal.com,https://pulsecal.com
FRONTEND_URL=https://www.pulsecal.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis (optional but recommended)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Optional: SSL Certificates (if running HTTPS directly)
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt
```

## Running the Server

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```

   Or with PM2:
   ```bash
   pm2 start server.js --name pulsecal
   ```

## HTTPS Configuration

### Option 1: SSL Termination at Load Balancer (Recommended)
- Configure your AWS Application Load Balancer (ALB) with SSL certificate
- Point ALB to your EC2 instance on port 3001 (HTTP)
- Server will run HTTP but receive HTTPS requests through ALB
- Set `CORS_ORIGIN` to your HTTPS frontend URL

### Option 2: Direct HTTPS on Server
- Place SSL certificates on server
- Set `SSL_KEY_PATH` and `SSL_CERT_PATH` environment variables
- Server will run HTTPS directly

## Socket.IO Configuration

Socket.IO is automatically configured to:
- Accept connections from your frontend domain
- Use WebSocket and polling transports
- Authenticate using Firebase tokens
- Work behind load balancers

## Testing

1. **Health Check:**
   ```bash
   curl http://your-server-ip:3001/health
   ```

2. **Check CORS:**
   ```bash
   curl -H "Origin: https://www.pulsecal.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization" \
        -X OPTIONS \
        http://your-server-ip:3001/api/v1/health
   ```

## Troubleshooting

### Socket.IO not connecting
- Check `CORS_ORIGIN` includes your frontend URL
- Verify load balancer allows WebSocket upgrades
- Check firewall allows port 3001

### CORS errors
- Ensure `CORS_ORIGIN` environment variable is set correctly
- Include both `https://www.pulsecal.com` and `https://pulsecal.com` if needed

### Mixed content errors
- Frontend must use HTTPS
- Backend must either:
  - Use HTTPS directly (with SSL certificates)
  - Or be behind HTTPS load balancer

## PM2 Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'pulsecal',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

Then run:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # For auto-start on reboot
```

