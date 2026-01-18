#!/bin/bash

# PulseCal Development Startup Script
# Starts both frontend and backend in development mode

set -e

echo "🚀 Starting PulseCal Full Stack Development Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
cd backend
npm install > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1
npm run build > /dev/null 2>&1
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "  Logs: tail -f backend.log"
echo ""

# Wait for backend to be ready
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    sleep 1
done
echo ""

# Start frontend
echo -e "${BLUE}🎨 Starting Frontend (Next.js)...${NC}"
echo -e "${YELLOW}Frontend will run on http://localhost:3000${NC}"
echo -e "${YELLOW}Backend API on http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

npm run dev

# Cleanup will be called on exit
