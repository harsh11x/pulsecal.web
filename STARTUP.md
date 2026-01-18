# PulseCal Startup Scripts

This directory contains scripts to easily start your PulseCal application.

## Scripts

### 1. `start-backend.sh` - Backend Only
Starts just the backend server with database migrations.

```bash
./start-backend.sh
```

**What it does:**
- ✅ Installs dependencies
- ✅ Runs database migrations
- ✅ Generates Prisma Client
- ✅ Builds TypeScript
- ✅ Starts backend server on port 3001

### 2. `start-dev.sh` - Full Stack Development
Starts both frontend and backend in development mode.

```bash
./start-dev.sh
```

**What it does:**
- ✅ Starts backend server (port 3001)
- ✅ Starts frontend Next.js (port 3000)
- ✅ Automatically handles cleanup on Ctrl+C
- ✅ Logs backend output to `backend.log`

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Quick Start

### First Time Setup
```bash
# Make scripts executable (only needed once)
chmod +x start-backend.sh start-dev.sh

# Start full development environment
./start-dev.sh
```

### Daily Development
```bash
# Start everything
./start-dev.sh

# Or just backend
./start-backend.sh
```

## Database

Your database is hosted on **Supabase** (cloud PostgreSQL), so you don't need to run a local database. The scripts automatically:
- Connect to your Supabase database
- Run any pending migrations
- Keep your schema up-to-date

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

```bash
# Kill processes on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues
Check your `.env` file in the backend directory:
```bash
DATABASE_URL="postgresql://..."
```

### View Backend Logs
```bash
tail -f backend.log
```

## Environment Variables Required

### Backend (`backend/.env`)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT secret key
- `JWT_REFRESH_SECRET` - Refresh token secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)

### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)

## Production Deployment

For production, use:
```bash
cd backend
npm run build
npm start
```

The backend will run in production mode with optimizations enabled.
