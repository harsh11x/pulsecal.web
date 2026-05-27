#!/bin/bash
# Switch .env to direct Supabase connection (bypasses pooler tenant errors).
# Usage: ./scripts/use-direct-database-url.sh [project-ref] [url-encoded-password]
set -e
cd "$(dirname "$0")/.."

PROJECT_REF="${1:-geewtmganuxrskbnkust}"
ENC_PASS="${2:-2004%40Singh}"

if [[ ! -f .env ]]; then
  echo "❌ .env not found"
  exit 1
fi

cp .env ".env.bak.$(date +%s)"

python3 - <<PY
from pathlib import Path
ref = "${PROJECT_REF}"
pw = "${ENC_PASS}"
url = f'postgresql://postgres:{pw}@db.{ref}.supabase.co:5432/postgres'
line_db = f'DATABASE_URL="{url}"'
line_direct = f'DIRECT_URL="{url}"'
p = Path(".env")
out = []
for line in p.read_text().splitlines():
    if line.startswith("DATABASE_URL="):
        out.append(line_db)
    elif line.startswith("DIRECT_URL="):
        out.append(line_direct)
    else:
        out.append(line)
p.write_text("\\n".join(out) + "\\n")
print("Set both DATABASE_URL and DIRECT_URL to direct connection:")
print(url.replace(pw, "***"))
PY

echo "Run: npm run verify:env && pm2 restart pulsecal --update-env"
