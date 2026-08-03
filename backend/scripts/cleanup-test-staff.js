require('dotenv').config();
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });

(async () => {
  const email = 'local.reception.1785755200@gmail.com';
  const u = await prisma.user.findFirst({ where: { email }, select: { id: true, firebaseUid: true } });
  if (!u) {
    console.log('NO_USER');
    return;
  }
  if (u.firebaseUid) {
    try {
      await admin.auth().deleteUser(u.firebaseUid);
      console.log('FB_DELETED');
    } catch (e) {
      console.log('FB_ERR', e.message);
    }
  }
  await prisma.$executeRaw`DELETE FROM users WHERE id = ${u.id}`;
  console.log('DB_DELETED', u.id);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
