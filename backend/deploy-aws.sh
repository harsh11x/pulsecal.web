#!/bin/bash

# PulseCal Backend Deployment Script for AWS
# This script deploys the backend to your AWS EC2 instance

set -e  # Exit on error

echo "🚀 Starting PulseCal Backend Deployment to AWS..."

# Configuration
AWS_HOST="13.205.127.21"
AWS_USER="ubuntu"  # Change if different
BACKEND_DIR="/home/ubuntu/pulsecal.web/backend"
SSH_KEY="~/.ssh/your-key.pem"  # Update with your actual SSH key path

echo "📦 Step 1: Committing latest changes..."
git add .
git commit -m "Deploy backend updates" || echo "No changes to commit"
git push origin main

echo "🔐 Step 2: Connecting to AWS server..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_HOST" << 'ENDSSH'
    set -e
    
    echo "📂 Navigating to backend directory..."
    cd /home/ubuntu/pulsecal.web/backend || exit 1
    
    echo "⬇️  Pulling latest code..."
    git pull origin main
    
    echo "📦 Installing dependencies..."
    npm ci
    
    echo "🔧 Building TypeScript..."
    npm run build
    
    echo "🔍 Validating environment..."
    npm run verify:env
    
    echo "🔑 Checking environment variables..."
    # Ensure all required env vars are set
    if ! grep -q "ENCRYPTION_KEY" .env; then
        echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
    fi
    if ! grep -q "JWT_SECRET" .env; then
        echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
    fi
    if ! grep -q "JWT_REFRESH_SECRET" .env; then
        echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)" >> .env
    fi
    if ! grep -q "FIREBASE_PROJECT_ID" .env; then
        echo "FIREBASE_PROJECT_ID=pulsecal-web" >> .env
    fi
    
    echo "🔄 Restarting backend server..."
    # Using PM2 (recommended)
    if command -v pm2 &> /dev/null; then
        pm2 restart pulsecal --update-env || pm2 start server.js --name pulsecal --update-env
        pm2 save
        
        sleep 3
        curl -sf http://localhost:3001/health || (pm2 logs pulsecal --lines 30 --nostream; exit 1)
    else
        # Fallback: kill existing process and start new one
        pkill -f "node server.js" || true
        nohup npm start > backend.log 2>&1 &
    fi
    
    echo "✅ Deployment complete!"
    
    # Show server status
    if command -v pm2 &> /dev/null; then
        pm2 status
    else
        ps aux | grep "node server.js" | grep -v grep
    fi
ENDSSH

echo "🎉 Deployment to AWS completed successfully!"
echo "🔍 Check server logs with: ssh -i $SSH_KEY $AWS_USER@$AWS_HOST 'pm2 logs pulsecal-backend'"
