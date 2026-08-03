require('dotenv').config();
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const prisma = new PrismaClient();
const API = 'http://localhost:3002/api/v1';
const API_KEY = 'AIzaSyAvP51E08sZXZdks8fkDBG6IgVZslhsfV4';

async function getIdToken(email) {
  const user = await admin.auth().getUserByEmail(email);
  const customToken = await admin.auth().createCustomToken(user.uid, { role: 'DOCTOR' });
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await resp.json();
  if (!data.idToken) throw new Error(JSON.stringify(data));
  return data.idToken;
}

(async () => {
  const email = 'pulsecal.help@gmail.com';
  const token = await getIdToken(email);
  const dbUser = await prisma.user.findFirst({
    where: { email },
    select: { id: true, clinicId: true, role: true, isActive: true },
  });
  console.log('DB_USER', dbUser);

  const staffEmail = `staff.test.${Date.now()}@gmail.com`;
  const createRes = await fetch(`${API}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'Staff',
      email: staffEmail,
      phone: '9999999999',
      password: 'TestPass123',
      role: 'RECEPTIONIST',
      clinicId: dbUser.clinicId,
      isActive: true,
      isEmailVerified: true,
    }),
  });
  const createBody = await createRes.json().catch(() => ({}));
  console.log('CREATE_STATUS', createRes.status);
  console.log('CREATE_BODY', JSON.stringify(createBody).slice(0, 1500));

  // cleanup
  try {
    const fu = await admin.auth().getUserByEmail(staffEmail);
    await admin.auth().deleteUser(fu.uid);
    console.log('CLEANED_FIREBASE');
  } catch (e) {
    console.log('CLEANUP_FB', e.message);
  }
  if (createBody?.data?.id) {
    try {
      await prisma.$executeRaw`DELETE FROM users WHERE id = ${createBody.data.id}`;
      console.log('CLEANED_DB');
    } catch (e) {
      console.log('CLEANUP_DB', e.message);
    }
  }
})()
  .catch((e) => {
    console.error('FATAL', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
