# Fix 500 Internal Server Errors

## Problem
Frontend is getting 500 errors on:
- `GET /api/v1/auth/profile`
- `GET /api/v1/doctors/analytics`

## Fixes Applied

### 1. Added Doctor Profile Validation
- `doctors.controller.ts`: Now checks if user has a doctor profile before calling analytics
- Prevents crashes when doctor profile doesn't exist

### 2. Improved Error Handling
- `auth.controller.ts`: Added error logging for profile retrieval
- `doctors.analytics.service.ts`: Fixed empty array handling in payment queries

## Steps to Deploy

### 1. Check Current Backend Logs (on AWS)
```bash
cd ~/pulsecal.web/backend
pm2 logs pulsecal --err --lines 50
```

Look for:
- Database connection errors
- Prisma query errors
- Missing relation errors
- Stack traces

### 2. Deploy the Fixes
```bash
cd ~/pulsecal.web/backend

# Pull latest code (if using git)
git pull

# OR manually copy the updated files:
# - backend/src/modules/doctors/doctors.controller.ts
# - backend/src/modules/auth/auth.controller.ts
# - backend/src/modules/doctors/doctors.analytics.service.ts

# Rebuild
npm run build

# Restart
pm2 restart pulsecal

# Watch logs
pm2 logs pulsecal --lines 30
```

### 3. Test
1. Refresh the dashboard
2. Check if errors are gone
3. If still getting 500 errors, check logs again:
   ```bash
   pm2 logs pulsecal --err --lines 100
   ```

## Common Causes of 500 Errors

1. **Missing Doctor Profile**
   - User signed up but didn't complete onboarding
   - Fix: Complete doctor profile setup

2. **Database Connection Issues**
   - Prisma can't connect to database
   - Fix: Check `DATABASE_URL` in `.env`

3. **Missing Relations**
   - User exists but `doctorProfile` relation is missing
   - Fix: Run database migrations

4. **Invalid Data**
   - Null values where not expected
   - Fix: Check database schema matches Prisma schema

## Debug Commands

```bash
# See all errors
pm2 logs pulsecal --err

# See all logs
pm2 logs pulsecal

# See last 100 lines
pm2 logs pulsecal --lines 100

# Clear logs
pm2 flush
```

## Next Steps

1. **Deploy fixes** (see above)
2. **Check logs** for actual error messages
3. **Share error logs** if issues persist
4. **Verify database** - ensure user has doctor profile:
   ```sql
   SELECT u.id, u.email, u.role, dp.id as doctor_profile_id
   FROM "User" u
   LEFT JOIN "DoctorProfile" dp ON dp."userId" = u.id
   WHERE u.email = 'your-email@example.com';
   ```

