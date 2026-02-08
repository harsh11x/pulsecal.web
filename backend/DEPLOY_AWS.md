# Deploy Backend on AWS (EC2 / PM2)

Use this so **Find Doctors** and **Browse Clinics** show all doctors and clinics from your Supabase DB.

## 1. Environment on the server

On the machine where the backend runs (e.g. EC2), ensure:

- **`DATABASE_URL`** = your **Supabase** Postgres connection string (same project where you see the 14 `doctor_profiles` rows).
  - In Supabase: Project Settings → Database → Connection string (URI). Use the **URI** and replace the password placeholder with your DB password.
- Optional: `NODE_ENV=production`, `PORT=3001`, Redis/Firebase if you use them.

## 2. Deploy steps (on the AWS server)

SSH into the server, then:

```bash
# Go to backend (path may differ; common: ~/pulsecal.web/backend or /var/www/pulsecal/backend)
cd /path/to/backend

# Pull latest code (includes doctors/clinics fix)
git pull origin main

# Install deps and build (build runs prisma generate + tsc)
npm install
npm run build

# Restart the app (PM2)
pm2 stop pulsecal 2>/dev/null || true
pm2 start server.js --name pulsecal
pm2 save

# Check logs for errors
pm2 logs pulsecal --lines 50
```

If your repo path is different (e.g. `~/pulsecal.web/backend`), use that in `cd`.

## 3. One-liner (after you’ve set DATABASE_URL once)

```bash
cd /path/to/backend && git pull origin main && npm install && npm run build && pm2 restart pulsecal && pm2 logs pulsecal --lines 30
```

## 4. Frontend (Vercel)

- Ensure **`BACKEND_URL`** in Vercel env points to this backend (e.g. `http://YOUR_EC2_IP:3001` or your API domain). No change needed in code if it’s already set.

## 5. If doctors/clinics are still empty

- Check backend logs: `pm2 logs pulsecal`. Look for Prisma/DB errors.
- Confirm **same DB**: Supabase project used in `DATABASE_URL` must be the one with the 14 doctor profiles.
- Test API on the server:  
  `curl -s "http://localhost:3001/api/v1/doctors/search?limit=200"`  
  You should see a JSON with `doctors` array (non-empty if DB has rows).
