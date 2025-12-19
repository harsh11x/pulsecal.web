# AWS Deployment Guide for PulseCal Backend

## Quick Start

Your `server.js` file is now completely self-contained and ready for AWS deployment!

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL Database** (AWS RDS recommended)
3. **Redis** (optional, for Socket.IO scaling - AWS ElastiCache recommended)
4. **Firebase Admin SDK** credentials

## Environment Variables

Set these environment variables on your AWS instance:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
API_VERSION=v1
CORS_ORIGIN=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # JSON string

# Redis (Optional - for Socket.IO scaling)
REDIS_HOST=your-redis-host.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## AWS Deployment Steps

### Option 1: EC2 Instance

1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS
   - t3.medium or larger recommended
   - Configure security group to allow:
     - Port 3001 (or your chosen port) from your frontend
     - Port 22 (SSH)

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PostgreSQL Client (if needed)**
   ```bash
   sudo apt-get install postgresql-client
   ```

4. **Clone/Upload Your Code**
   ```bash
   cd /home/ubuntu
   git clone your-repo-url
   cd pulsecal/backend
   ```

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Set Environment Variables**
   ```bash
   # Create .env file or use AWS Systems Manager Parameter Store
   nano .env
   # Paste all environment variables
   ```

7. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

8. **Start Server with PM2 (Recommended)**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name pulsecal-backend
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

9. **Configure Nginx (Reverse Proxy)**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/pulsecal
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pulsecal /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 2: AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   cd backend
   eb init -p node.js pulsecal-backend
   ```

3. **Create Environment**
   ```bash
   eb create pulsecal-production
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv DATABASE_URL=... FIREBASE_PROJECT_ID=... CORS_ORIGIN=...
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

### Option 3: AWS ECS (Docker)

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3001
   CMD ["node", "server.js"]
   ```

2. **Build and Push to ECR**
   ```bash
   docker build -t pulsecal-backend .
   # Push to ECR and deploy via ECS
   ```

## Health Check

After deployment, verify the server is running:

```bash
curl http://your-server:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-12-20T..."}
```

## API Endpoints

All endpoints are prefixed with `/api/v1`:

- `GET /health` - Health check
- `GET /api/v1/doctors/search` - Search doctors
- `GET /api/v1/doctors/analytics` - Doctor analytics
- `GET /api/v1/appointments` - Get appointments
- `POST /api/v1/appointments` - Create appointment
- `PUT /api/v1/appointments/:id` - Update appointment
- `PUT /api/v1/payments/:id/status` - Update payment
- `GET /api/v1/receptionists/stats` - Receptionist stats
- `GET /api/v1/auth/profile` - Get user profile

## Socket.IO Connection

Frontend should connect to:
```
https://your-domain.com/notifications
```

With authentication:
```javascript
const socket = io('https://your-domain.com/notifications', {
  auth: {
    token: firebaseAuthToken
  }
});
```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs pulsecal-backend
```

### CloudWatch (AWS)
- Set up CloudWatch Logs for application logs
- Create alarms for error rates
- Monitor CPU and memory usage

## Troubleshooting

1. **Server won't start**
   - Check environment variables are set
   - Verify database connection
   - Check port is not in use: `lsof -i :3001`

2. **Database connection errors**
   - Verify DATABASE_URL is correct
   - Check security groups allow connection
   - Verify database is accessible

3. **Socket.IO not working**
   - Check CORS_ORIGIN is set correctly
   - Verify WebSocket support in load balancer
   - Check Redis connection (if using)

4. **Firebase errors**
   - Verify FIREBASE_SERVICE_ACCOUNT_KEY is valid JSON
   - Check FIREBASE_PROJECT_ID matches

## Security Checklist

- [ ] Use HTTPS (SSL certificate)
- [ ] Set secure CORS_ORIGIN
- [ ] Use environment variables (not hardcoded)
- [ ] Enable database SSL
- [ ] Use strong passwords
- [ ] Set up firewall rules
- [ ] Enable CloudWatch logging
- [ ] Set up backup strategy
- [ ] Use IAM roles (not access keys)

## Scaling

For high traffic:
1. Use AWS Application Load Balancer
2. Deploy multiple instances
3. Enable Redis for Socket.IO scaling
4. Use RDS with read replicas
5. Enable CloudFront CDN

## Support

For issues, check:
- Server logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/error.log`
- Database logs: AWS RDS console

