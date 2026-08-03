#!/bin/bash
set -euo pipefail
cd /home/ubuntu/pulsecal.web

# Preserve production env across tracked .env in repo
cp backend/.env /tmp/pulsecal-backend.env.preserve

git fetch origin main
git pull origin main

# Always restore production env after pull
cp /tmp/pulsecal-backend.env.preserve backend/.env
grep -q '^FRONTEND_URL=' backend/.env || echo 'FRONTEND_URL=https://www.pulsecal.com' >> backend/.env

echo "COMMIT=$(git log -1 --oneline)"
cd backend
npm install
npm run build
pm2 restart pulsecal
sleep 4
pm2 list
curl -sS http://localhost:3001/health; echo
# Public clinics smoke: look for staff array non-empty on demo clinic if present
python3 - <<'PY'
import json,urllib.request
raw=urllib.request.urlopen('http://localhost:3001/api/v1/clinics?limit=20', timeout=20).read().decode()
data=json.loads(raw)
clinics=data.get('data') or []
if isinstance(clinics, dict):
    clinics=clinics.get('clinics') or []
print('clinics', len(clinics))
for c in clinics:
    name=c.get('name')
    staff=c.get('staff') or []
    print(f"- {name}: staff={len(staff)}")
PY
echo DEPLOY_OK
