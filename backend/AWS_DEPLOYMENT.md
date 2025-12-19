# AWS Deployment Guide for PulseCal Backend

This guide will help you deploy the PulseCal backend to AWS.

## Prerequisites

- AWS Account
- PostgreSQL database (AWS RDS recommended)
- Redis instance (AWS ElastiCache recommended)
- Firebase project with Authentication enabled
- Domain name (optional, for custom domain)

## Deployment Options

### Option 1: AWS EC2 (Recommended for full control)

#### Step 1: Launch EC2 Instance

1. Go to EC2 Console → Launch Instance
2. Choose Amazon Linux 2 or Ubuntu Server
3. Instance type: t3.medium or larger (for production)
4. Configure security group:
   - Port 22 (SSH)
   - Port 3001 (HTTP) - or use Application Load Balancer
   - Port 443 (HTTPS) - if using SSL directly

#### Step 2: Connect to EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

#### Step 3: Install Dependencies

```bash
# Update system
sudo yum update -y  # For Amazon Linux
# or
sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL client (if needed)
sudo yum install postgresql -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 4: Clone and Setup Project

```bash
# Clone your repository
git clone https://github.com/your-username/pulsecal.git
cd pulsecal/backend

# Install dependencies
npm install

# Build the project
npm run build
```

#### Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
# Copy contents from .env.example and fill in your values
```

**Important Environment Variables:**
- `DATABASE_URL`: Your RDS PostgreSQL connection string
- `REDIS_HOST`: Your ElastiCache Redis endpoint
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Your Firebase service account JSON (as string)
- `CORS_ORIGIN`: Your Vercel frontend URL (e.g., `https://pulsecal.vercel.app`)

#### Step 6: Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

#### Step 7: Start Server with PM2

```bash
# Start the server
pm2 start server.js --name pulsecal-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Step 8: Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo yum install nginx -y  # Amazon Linux
# or
sudo apt install nginx -y  # Ubuntu

# Configure Nginx
sudo nano /etc/nginx/conf.d/pulsecal.conf
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 9: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### Option 2: AWS Elastic Beanstalk (Easier deployment)

#### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade
```

#### Step 2: Initialize Elastic Beanstalk

```bash
cd backend
eb init -p node.js-18 pulsecal-backend
```

#### Step 3: Create Environment

```bash
eb create pulsecal-backend-env
```

#### Step 4: Configure Environment Variables

```bash
eb setenv \
  DATABASE_URL=your-database-url \
  REDIS_HOST=your-redis-host \
  FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}' \
  CORS_ORIGIN=https://your-app.vercel.app \
  NODE_ENV=production
```

#### Step 5: Deploy

```bash
npm run build
eb deploy
```

### Option 3: AWS Lambda + API Gateway (Serverless)

For serverless deployment, you'll need to use a framework like Serverless Framework or AWS SAM. This requires additional configuration.

## Database Setup (AWS RDS)

1. Create RDS PostgreSQL instance
2. Configure security group to allow access from your EC2/EB instance
3. Get connection string: `postgresql://user:password@rds-endpoint:5432/pulsecal`
4. Update `DATABASE_URL` in your `.env`

## Redis Setup (AWS ElastiCache)

1. Create ElastiCache Redis cluster
2. Configure security group
3. Get endpoint and update `REDIS_HOST` in your `.env`

## Firebase Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Copy the JSON content and set it as `FIREBASE_SERVICE_ACCOUNT_KEY` in your `.env` (as a string)
4. Enable Authentication in Firebase Console
5. Configure sign-in methods (Email/Password, Google, etc.)

## Monitoring & Logs

### PM2 Monitoring

```bash
# View logs
pm2 logs pulsecal-backend

# Monitor
pm2 monit

# View status
pm2 status
```

### CloudWatch (AWS)

Set up CloudWatch Logs for centralized logging:

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

## Health Check Endpoint

Your backend includes a health check endpoint:
- `GET /health` - Returns server status

Use this for load balancer health checks.

## Security Best Practices

1. **Never commit `.env` file** - Use environment variables
2. **Use Security Groups** - Restrict access to necessary ports only
3. **Enable HTTPS** - Use SSL/TLS certificates
4. **Regular Updates** - Keep system and dependencies updated
5. **Backup Database** - Enable automated RDS backups
6. **Monitor Logs** - Set up CloudWatch alerts

## Troubleshooting

### Server won't start
- Check environment variables are set correctly
- Verify database connection
- Check Redis connection
- Review logs: `pm2 logs` or `eb logs`

### Database connection errors
- Verify security group allows connection
- Check database credentials
- Ensure database exists and is accessible

### CORS errors
- Verify `CORS_ORIGIN` matches your Vercel frontend URL exactly
- Check Nginx/load balancer headers

## Connecting Frontend (Vercel)

In your Vercel frontend, update the API URL:

```env
NEXT_PUBLIC_API_URL=https://your-aws-backend-url.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-aws-backend-url.com
```

## Cost Optimization

- Use t3.small for development
- Use Reserved Instances for production
- Enable RDS automated backups
- Use ElastiCache for Redis (cheaper than EC2 Redis)

## Support

For issues, check:
- PM2 logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/error.log`
- Application logs: Check your logging configuration

