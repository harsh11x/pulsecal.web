require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT'
  );
  console.log('address column ensured');
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
