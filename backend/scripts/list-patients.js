require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT', isActive: true },
    take: 5,
    select: { id: true, email: true, firstName: true, firebaseUid: true },
  });
  console.log(patients);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
