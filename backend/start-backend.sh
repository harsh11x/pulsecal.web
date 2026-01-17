#!/bin/bash

# PulseCal Backend Startup Script
# Run this script from the backend directory on AWS: ./start-backend.sh

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting PulseCal Backend Server...${NC}\n"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the backend directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
npm install --production

echo -e "${YELLOW}🔧 Step 2: Generating Prisma client...${NC}"
npx prisma generate

echo -e "${YELLOW}🏗️  Step 3: Building TypeScript...${NC}"
npm run build

echo -e "${YELLOW}🔄 Step 4: Starting server...${NC}"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "Using PM2 to manage server..."
    pm2 restart pulsecal-backend || pm2 start npm --name pulsecal-backend -- start
    pm2 save
    echo -e "${GREEN}✅ Server started with PM2${NC}"
    echo -e "\n${YELLOW}📊 Server Status:${NC}"
    pm2 status
    echo -e "\n${YELLOW}📝 View logs: pm2 logs pulsecal-backend${NC}"
else
    echo "PM2 not found, starting with nohup..."
    # Kill existing process
    pkill -f "node server.js" || true
    # Start new process
    nohup npm start > backend.log 2>&1 &
    echo -e "${GREEN}✅ Server started in background${NC}"
    echo -e "\n${YELLOW}📝 View logs: tail -f backend.log${NC}"
fi

echo -e "\n${GREEN}🎉 Backend server is now running!${NC}"
