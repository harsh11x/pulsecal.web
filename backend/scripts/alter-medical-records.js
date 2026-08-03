require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE medical_records ALTER COLUMN "patientId" DROP NOT NULL
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS "patientName" TEXT
  `);
  // Backfill patientName from linked users where missing
  await prisma.$executeRawUnsafe(`
    UPDATE medical_records mr
    SET "patientName" = TRIM(CONCAT(COALESCE(u."firstName", ''), ' ', COALESCE(u."lastName", '')))
    FROM users u
    WHERE mr."patientId" = u.id
      AND (mr."patientName" IS NULL OR mr."patientName" = '')
  `);
  console.log('medical_records schema updated');
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
