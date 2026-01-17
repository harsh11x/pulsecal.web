#!/bin/bash

# PulseCal AWS Backend Deployment Script
# This script automates the entire backend deployment process on AWS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_HOST="13.205.127.21"
AWS_USER="ubuntu"
SSH_KEY_PATH="~/.ssh/your-key.pem"  # UPDATE THIS with your actual SSH key path
BACKEND_DIR="~/pulsecal.web/backend"

echo -e "${GREEN}🚀 Starting PulseCal Backend Deployment to AWS...${NC}\n"

# Function to run commands on AWS
run_on_aws() {
    ssh -i "$SSH_KEY_PATH" "$AWS_USER@$AWS_HOST" "$1"
}

echo -e "${YELLOW}📦 Step 1: Pulling latest code from GitHub...${NC}"
run_on_aws "cd $BACKEND_DIR && git pull origin main"

echo -e "${YELLOW}📥 Step 2: Installing dependencies...${NC}"
run_on_aws "cd $BACKEND_DIR && npm install --production"

echo -e "${YELLOW}🔧 Step 3: Generating Prisma client...${NC}"
run_on_aws "cd $BACKEND_DIR && npx prisma generate"

echo -e "${YELLOW}🏗️  Step 4: Building TypeScript...${NC}"
run_on_aws "cd $BACKEND_DIR && npm run build"

echo -e "${YELLOW}🔄 Step 5: Restarting backend server...${NC}"
# Check if PM2 is installed and use it, otherwise use nohup
if run_on_aws "command -v pm2 &> /dev/null"; then
    echo "Using PM2 to restart server..."
    run_on_aws "cd $BACKEND_DIR && pm2 restart pulsecal-backend || pm2 start npm --name pulsecal-backend -- start"
    run_on_aws "pm2 save"
    echo -e "${GREEN}✅ Server restarted with PM2${NC}"
else
    echo "PM2 not found, using nohup..."
    run_on_aws "cd $BACKEND_DIR && pkill -f 'node server.js' || true"
    run_on_aws "cd $BACKEND_DIR && nohup npm start > backend.log 2>&1 &"
    echo -e "${GREEN}✅ Server started with nohup${NC}"
fi

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}\n"

# Show server status
echo -e "${YELLOW}📊 Server Status:${NC}"
if run_on_aws "command -v pm2 &> /dev/null"; then
    run_on_aws "pm2 status"
else
    run_on_aws "ps aux | grep 'node server.js' | grep -v grep || echo 'Server process not found'"
fi

echo -e "\n${GREEN}✅ Backend is now running on AWS!${NC}"
echo -e "${YELLOW}📝 Check logs with: ssh -i $SSH_KEY_PATH $AWS_USER@$AWS_HOST 'pm2 logs pulsecal-backend'${NC}"
