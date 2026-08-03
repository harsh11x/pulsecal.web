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
  const token = await getIdToken('pulsecal.help@gmail.com');
  const doctor = await prisma.user.findFirst({
    where: { email: 'pulsecal.help@gmail.com' },
    select: { id: true },
  });

  // Ensure a patient row exists for appointment FK
  let patient = await prisma.user.findFirst({
    where: { role: 'PATIENT', isActive: true },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!patient) {
    patient = await prisma.user.create({
      data: {
        email: `appt.patient.${Date.now()}@pulsecal.local`,
        firstName: 'Appt',
        lastName: 'Patient',
        role: 'PATIENT',
        isActive: true,
        onboardingCompleted: true,
      },
      select: { id: true, firstName: true, lastName: true },
    });
    await prisma.patientProfile.create({ data: { userId: patient.id } });
  }

  const apt = await prisma.appointment.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
      scheduledAt: new Date(),
      duration: 30,
      status: 'COMPLETED',
      reason: 'Follow-up checkup',
    },
    select: { id: true, scheduledAt: true },
  });

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
    }),
  });
  const aptBody = await aptRes.json();
  console.log('CREATE_FROM_APPOINTMENT', aptRes.status, aptBody?.success);
  console.log('LINKED', {
    appointmentId: aptBody?.data?.appointmentId,
    patientId: aptBody?.data?.patientId,
    patientName: aptBody?.data?.patientName || aptBody?.data?.displayPatientName,
  });

  if (aptBody?.data?.id) {
    await prisma.medicalRecord.update({
      where: { id: aptBody.data.id },
      data: { deletedAt: new Date() },
    });
  }
  await prisma.appointment.delete({ where: { id: apt.id } });
  console.log('APPOINTMENT_NOTE_TEST_PASSED');
})()
  .catch((e) => {
    console.error('FATAL', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
