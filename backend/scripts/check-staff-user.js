require('dotenv').config();
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });

(async () => {
  const email = 'local.reception.1785755200@gmail.com';
  const u = await prisma.user.findFirst({
    where: { email },
    select: { id: true, isActive: true, role: true, clinicId: true, firebaseUid: true },
  });
  console.log('USER', u);
  if (u?.firebaseUid) {
    const fu = await admin.auth().getUser(u.firebaseUid);
    console.log('FB', { disabled: fu.disabled, email: fu.email });
  }
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
