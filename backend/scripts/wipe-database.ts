/**
 * Wipe all data from the PostgreSQL database.
 *
 * Truncates every table in the `public` schema (except `_prisma_migrations`
 * so Prisma's migration history is preserved) and verifies the result.
 *
 * WARNING: This permanently deletes ALL rows. There is no undo.
 *
 * Run with: tsx scripts/wipe-database.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIRM_PROMPT = 'This will PERMANENTLY DELETE all data. Type "WIPE" to confirm: ';

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
}

async function main() {
  // Count rows per table before wiping (for reporting)
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename"
  );

  console.log('=== DATA BEFORE WIPE ===');
  const before: Record<string, number> = {};
  for (const t of tables) {
    try {
      const [row] = await prisma.$queryRawUnsafe<{ count: string }[]>(
        `SELECT COUNT(*)::text as count FROM "${t.tablename}"`
      );
      const count = Number(row.count);
      before[t.tablename] = count;
      if (count > 0) console.log(`  ${t.tablename}: ${count}`);
    } catch (e) {
      // skip tables that can't be counted (e.g., views)
    }
  }
  const totalBefore = Object.values(before).reduce((a, b) => a + b, 0);
  console.log(`  TOTAL rows: ${totalBefore}`);

  if (totalBefore === 0) {
    console.log('\nDatabase is already empty. Nothing to wipe.');
    return;
  }

  // Confirmation
  const answer = await ask(`\n${CONFIRM_PROMPT}`);
  if (answer !== 'WIPE') {
    console.log('Aborted. No data was deleted.');
    return;
  }

  // Truncate all tables with CASCADE (handles FK ordering automatically)
  console.log('\n=== WIPING DATABASE ===');
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t.tablename}" CASCADE`);
    console.log(`  truncated: ${t.tablename}`);
  }

  // Verify
  console.log('\n=== DATA AFTER WIPE ===');
  let totalAfter = 0;
  for (const t of tables) {
    const [row] = await prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text as count FROM "${t.tablename}"`
    );
    const count = Number(row.count);
    totalAfter += count;
    if (count > 0) console.log(`  ${t.tablename}: ${count}`);
  }
  console.log(`  TOTAL rows: ${totalAfter}`);
  console.log(totalAfter === 0 ? '\n✅ Database is now completely empty.' : '\n⚠️  Some data remains!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
