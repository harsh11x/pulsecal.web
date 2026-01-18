#!/bin/bash

# PulseCal Backend Startup Script
# This script ensures database is up-to-date and starts the backend server

set -e  # Exit on error

echo "🚀 Starting PulseCal Backend..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Change to backend directory
cd "$(dirname "$0")/backend"

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}🔄 Step 2: Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Database migrations applied${NC}"
echo ""

echo -e "${BLUE}🔨 Step 3: Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

echo -e "${BLUE}🏗️  Step 4: Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

echo -e "${BLUE}🌐 Step 5: Starting backend server...${NC}"
echo -e "${YELLOW}Server will run on http://localhost:3001${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Start the server
npm start
