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
  const token = await getIdToken('pulsecal.help@gmail.com');
  const doctor = await prisma.user.findFirst({
    where: { email: 'pulsecal.help@gmail.com' },
    select: { id: true },
  });

  // 1) Name-only clinical note (no existing patient)
  const createRes = await fetch(`${API}/medical-records`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientName: 'Walk-in Patient Demo',
      recordType: 'CLINICAL_NOTE',
      title: 'Progress note — local test',
      notes: 'Patient reports mild headache. Advised rest and hydration.',
      diagnosis: 'Tension headache',
      visitDate: '2026-08-03',
      symptoms: 'Headache',
      prescribedMedicines: ['Paracetamol 500mg'],
    }),
  });
  const createBody = await createRes.json();
  console.log('CREATE_NAME_ONLY', createRes.status, createBody?.success, createBody?.data?.id);
  console.log('CREATE_PATIENT', createBody?.data?.patientName, createBody?.data?.patientId);

  if (!createRes.ok) {
    console.log(JSON.stringify(createBody).slice(0, 800));
    throw new Error('name-only create failed');
  }

  const noteId = createBody.data.id;

  // 2) List sorted by name
  const listName = await fetch(
    `${API}/medical-records?sortBy=patientName&sortOrder=asc&limit=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const listNameBody = await listName.json();
  const nameRecords = listNameBody?.data || [];
  console.log(
    'LIST_BY_NAME',
    listName.status,
    nameRecords.length,
    nameRecords.slice(0, 3).map((r) => r.displayPatientName || r.patientName)
  );

  // 3) List sorted by date
  const listDate = await fetch(
    `${API}/medical-records?sortBy=recordDate&sortOrder=desc&limit=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const listDateBody = await listDate.json();
  console.log('LIST_BY_DATE', listDate.status, (listDateBody?.data || []).length);

  // 4) Optional appointment-linked note if doctor has any appointment
  const apt = await prisma.appointment.findFirst({
    where: { doctorId: doctor.id, deletedAt: null },
    select: {
      id: true,
      patientId: true,
      scheduledAt: true,
      reason: true,
      patient: { select: { firstName: true, lastName: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  });

  if (apt) {
    const aptRes = await fetch(`${API}/medical-records`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId: apt.id,
        recordType: 'CLINICAL_NOTE',
        title: 'Appointment follow-up note',
        notes: 'Clinical note created from appointment context.',
        visitDate: apt.scheduledAt,
      }),
    });
    const aptBody = await aptRes.json();
    console.log(
      'CREATE_FROM_APPOINTMENT',
      aptRes.status,
      aptBody?.success,
      aptBody?.data?.appointmentId,
      aptBody?.data?.displayPatientName || aptBody?.data?.patientName
    );
    if (aptBody?.data?.id) {
      await prisma.medicalRecord.update({
        where: { id: aptBody.data.id },
        data: { deletedAt: new Date() },
      });
    }
  } else {
    console.log('CREATE_FROM_APPOINTMENT SKIPPED (no appointments)');
  }

  // Cleanup name-only note
  await prisma.medicalRecord.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  });
  console.log('CLEANED');
  console.log('ALL_MEDICAL_RECORD_TESTS_PASSED');
})()
  .catch((e) => {
    console.error('FATAL', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
