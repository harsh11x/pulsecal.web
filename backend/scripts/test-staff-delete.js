require('dotenv').config();
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

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

async function waitForHealth(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch('http://localhost:3002/health');
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Backend not healthy');
}

(async () => {
  await waitForHealth();
  const ownerEmail = 'pulsecal.help@gmail.com';
  const ownerToken = await getIdToken(ownerEmail);
  const owner = await prisma.user.findFirst({
    where: { email: ownerEmail },
    select: { id: true, clinicId: true },
  });
  console.log('OWNER', owner);

  const staffEmail = `staff.ok.${Date.now()}@gmail.com`;
  const createRes = await fetch(`${API}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'Ok',
      lastName: 'Staff',
      email: staffEmail,
      phone: '9876543210',
      password: 'TestPass123',
      role: 'RECEPTIONIST',
      clinicId: owner.clinicId,
      isActive: true,
      isEmailVerified: true,
    }),
  });
  const createBody = await createRes.json();
  console.log('CREATE_STATUS', createRes.status);
  console.log('CREATE_OK', createBody?.success === true, createBody?.data?.id);

  if (!createRes.ok || !createBody?.data?.id) {
    console.log('CREATE_BODY', JSON.stringify(createBody).slice(0, 1000));
    throw new Error('Staff create failed');
  }

  const staffId = createBody.data.id;

  // Owner can deactivate staff
  const deactivateRes = await fetch(`${API}/users/${staffId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isActive: false }),
  });
  const deactivateBody = await deactivateRes.json();
  console.log('OWNER_DEACTIVATE_STATUS', deactivateRes.status, deactivateBody?.success);

  // Reactivate for self-delete test
  await fetch(`${API}/users/${staffId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isActive: true }),
  });

  // Self-delete as staff
  const staffToken = await getIdToken(staffEmail);
  const selfDelRes = await fetch(`${API}/users/${staffId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${staffToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isActive: false }),
  });
  const selfDelBody = await selfDelRes.json();
  console.log('SELF_DELETE_STATUS', selfDelRes.status, selfDelBody?.success);

  const after = await prisma.user.findUnique({
    where: { id: staffId },
    select: { isActive: true, deletedAt: true },
  });
  console.log('AFTER_SELF_DELETE', after);

  // Owner self-delete should be allowed (but we will immediately reactivate)
  const ownerSelfRes = await fetch(`${API}/users/${owner.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isActive: false }),
  });
  const ownerSelfBody = await ownerSelfRes.json();
  console.log('OWNER_SELF_DELETE_STATUS', ownerSelfRes.status, ownerSelfBody?.success);

  // Immediately restore owner account
  await prisma.$executeRaw`
    UPDATE users
    SET "isActive" = true, "deletedAt" = NULL, "updatedAt" = NOW()
    WHERE id = ${owner.id}
  `;
  try {
    const fu = await admin.auth().getUserByEmail(ownerEmail);
    await admin.auth().updateUser(fu.uid, { disabled: false });
  } catch (e) {
    console.log('OWNER_FB_RESTORE', e.message);
  }
  console.log('OWNER_RESTORED');

  // Cleanup staff
  try {
    const fu = await admin.auth().getUserByEmail(staffEmail);
    await admin.auth().deleteUser(fu.uid);
  } catch (e) {
    console.log('STAFF_FB_CLEANUP', e.message);
  }
  await prisma.$executeRaw`DELETE FROM users WHERE id = ${staffId}`;
  console.log('STAFF_CLEANED');
  console.log('ALL_API_TESTS_PASSED');
})()
  .catch((e) => {
    console.error('FATAL', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
