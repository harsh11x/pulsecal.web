require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API = 'http://localhost:3002/api/v1';

async function waitForHealth(retries = 40) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch('http://localhost:3002/health');
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Backend not healthy');
}

(async () => {
  await waitForHealth();

  const listRes = await fetch(`${API}/clinics?limit=100`);
  const listBody = await listRes.json();
  const clinics = listBody?.data?.clinics || listBody?.data || listBody?.clinics || [];
  console.log('LIST_STATUS', listRes.status, 'COUNT', clinics.length);
  console.log(
    'LIST_STAFF',
    clinics.map((c) => ({ name: c.name, staff: (c.staff || []).length, doctors: (c.staff || []).map((s) => s.firstName) }))
  );

  const withStaff = clinics.find((c) => (c.staff || []).length > 0) || clinics[0];
  if (!withStaff) throw new Error('No clinics');

  const detailRes = await fetch(`${API}/clinics/${withStaff.id}`);
  const detailBody = await detailRes.json();
  const clinic = detailBody?.data || detailBody;
  console.log('DETAIL_STATUS', detailRes.status);
  console.log('DETAIL_STAFF', (clinic.staff || []).map((s) => `${s.firstName} ${s.lastName} (${s.doctorProfile?.specialization})`));

  if (!(clinic.staff || []).length) {
    throw new Error(`Clinic ${clinic.name} still has no doctors`);
  }
  console.log('CLINIC_DOCTORS_OK');
})()
  .catch((e) => {
    console.error('FATAL', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
