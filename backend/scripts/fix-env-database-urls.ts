/**
 * Fixes unencoded @ in Postgres passwords inside .env (DATABASE_URL, DIRECT_URL).
 * Run on AWS: npm run fix:env
 */
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(__dirname, '../.env');

function fixPostgresUrl(url: string): { fixed: string; changed: boolean } {
  if (!url.startsWith('postgresql://')) {
    return { fixed: url, changed: false };
  }

  const withoutProto = url.slice('postgresql://'.length);
  const slashIdx = withoutProto.indexOf('/');
  const authority = slashIdx >= 0 ? withoutProto.slice(0, slashIdx) : withoutProto;
  const rest = slashIdx >= 0 ? withoutProto.slice(slashIdx) : '';

  const atCount = (authority.match(/@/g) || []).length;
  if (atCount <= 1) {
    return { fixed: url, changed: false };
  }

  const lastAt = authority.lastIndexOf('@');
  const creds = authority.slice(0, lastAt);
  const host = authority.slice(lastAt + 1);
  const colonIdx = creds.indexOf(':');
  if (colonIdx < 0) {
    return { fixed: url, changed: false };
  }

  const user = creds.slice(0, colonIdx);
  const password = creds.slice(colonIdx + 1);
  const encodedPassword = password.replace(/@/g, '%40');
  const fixed = `postgresql://${user}:${encodedPassword}@${host}${rest}`;
  return { fixed, changed: fixed !== url };
}

function fixDirectUrlHost(url: string): { fixed: string; changed: boolean } {
  // DIRECT_URL must not use pooler host
  if (!url.includes('pooler.supabase.com')) {
    return { fixed: url, changed: false };
  }

  const match = url.match(/postgres(?:\.([a-z0-9]+))?:/i);
  const projectRef = match?.[1];
  if (!projectRef) {
    return { fixed: url, changed: false };
  }

  const { fixed: withEncodedPass } = fixPostgresUrl(url);
  const passMatch = withEncodedPass.match(/^postgresql:\/\/[^:]+:([^@]+)@/);
  const password = passMatch?.[1] ?? '';
  const fixed = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
  return { fixed, changed: fixed !== url };
}

function updateEnvLine(content: string, key: string, newValue: string): string {
  const quoted = `"${newValue.replace(/"/g, '\\"')}"`;
  const line = `${key}=${quoted}`;
  const regex = new RegExp(`^${key}=.*$`, 'm');

  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  return `${content.trimEnd()}\n${line}\n`;
}

function main(): void {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`❌ .env not found at ${ENV_PATH}`);
    process.exit(1);
  }

  const backupPath = `${ENV_PATH}.bak.${Date.now()}`;
  fs.copyFileSync(ENV_PATH, backupPath);
  console.log(`📋 Backup: ${backupPath}`);

  let content = fs.readFileSync(ENV_PATH, 'utf8');
  const keys = ['DATABASE_URL', 'DIRECT_URL'] as const;
  let anyChange = false;

  for (const key of keys) {
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (!match) {
      console.warn(`⚠️  ${key} not set in .env`);
      continue;
    }

    let raw = match[1].trim();
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1);
    }

    let { fixed, changed } = fixPostgresUrl(raw);
    if (key === 'DIRECT_URL') {
      const hostFix = fixDirectUrlHost(fixed);
      fixed = hostFix.fixed;
      changed = changed || hostFix.changed;
    }

    if (changed) {
      content = updateEnvLine(content, key, fixed);
      anyChange = true;
      console.log(`✅ Fixed ${key}`);
    } else {
      console.log(`ℹ️  ${key} OK (no @ encoding fix needed)`);
    }
  }

  if (!anyChange) {
    console.log('No changes made. If verify:env still fails, set URLs manually from Supabase dashboard.');
    return;
  }

  fs.writeFileSync(ENV_PATH, content);
  console.log('\n✅ .env updated. Run: npm run verify:env && pm2 restart pulsecal --update-env');
}

main();
