/**
 * Validates backend .env before deploy/restart.
 * Run on AWS: npm run verify:env
 */
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '../.env') });

const REQUIRED = [
  'DATABASE_URL',
  'DIRECT_URL',
  'ENCRYPTION_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FIREBASE_PROJECT_ID',
] as const;

function checkPostgresUrl(name: string, url: string): void {
  if (!url.startsWith('postgresql://')) {
    throw new Error(`${name} must start with postgresql://`);
  }

  const authority = url.replace(/^postgresql:\/\//, '').split('/')[0] ?? '';
  const atCount = (authority.match(/@/g) || []).length;
  if (atCount > 1) {
    throw new Error(
      `${name} has an unencoded @ in the password. Use %40 instead (example: 2004%40Singh).`
    );
  }

  if (name === 'DIRECT_URL' && url.includes('pooler.supabase.com')) {
    throw new Error(
      `${name} must use db.<project-ref>.supabase.co:5432, not pooler.supabase.com`
    );
  }

  if (!url.includes('/postgres')) {
    console.warn(`⚠️  ${name}: expected database name "postgres" in the URL path`);
  }
}

async function main(): Promise<void> {
  for (const key of REQUIRED) {
    if (!process.env[key]?.trim()) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  checkPostgresUrl('DATABASE_URL', process.env.DATABASE_URL!);
  checkPostgresUrl('DIRECT_URL', process.env.DIRECT_URL!);

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection OK');
  } finally {
    await prisma.$disconnect();
  }

  console.log('✅ Environment validation passed');
}

main().catch((err: Error) => {
  console.error('❌ Environment validation failed:', err.message);
  process.exit(1);
});
