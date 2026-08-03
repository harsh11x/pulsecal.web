require('dotenv').config();
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });

(async () => {
  const email = 'pulsecal.help@gmail.com';
  const u = await prisma.user.findFirst({
    where: { email },
    select: { id: true, isActive: true, deletedAt: true, firebaseUid: true },
  });
  console.log('DB', u);
  if (u?.firebaseUid) {
    const fu = await admin.auth().getUser(u.firebaseUid);
    console.log('FB_DISABLED', fu.disabled);
    if (!u.isActive || fu.disabled) {
      await prisma.$executeRaw`
        UPDATE users SET "isActive" = true, "deletedAt" = NULL, "updatedAt" = NOW()
        WHERE id = ${u.id}
      `;
      await admin.auth().updateUser(u.firebaseUid, { disabled: false });
      console.log('REPAIRED');
    }
  }
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
