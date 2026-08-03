require('dotenv').config();
const admin = require('firebase-admin');

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

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
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const createRes = await fetch(`${API}/medical-records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patientName: 'Edit Flow Patient',
      recordType: 'CLINICAL_NOTE',
      title: 'Initial note title',
      notes: 'Initial clinical content',
      diagnosis: 'Initial diagnosis',
      visitDate: '2026-08-03',
      symptoms: 'Cough',
      prescribedMedicines: ['Cough syrup'],
    }),
  });
  const created = await createRes.json();
  console.log('CREATE', createRes.status, created?.data?.id);
  if (!createRes.ok) throw new Error(JSON.stringify(created).slice(0, 500));
  const id = created.data.id;

  const getRes = await fetch(`${API}/medical-records/${id}`, { headers });
  const got = await getRes.json();
  console.log('GET', getRes.status, {
    title: got?.data?.title,
    notes: got?.data?.notes,
    symptoms: got?.data?.symptoms,
    medicines: got?.data?.prescribedMedicines,
    patientName: got?.data?.patientName || got?.data?.displayPatientName,
  });
  if (!getRes.ok) throw new Error('GET failed');
  if (!String(got?.data?.notes || '').includes('Initial clinical')) {
    throw new Error('GET did not return notes content');
  }

  const putRes = await fetch(`${API}/medical-records/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      patientName: 'Edit Flow Patient Updated',
      title: 'Updated note title',
      notes: 'Updated clinical content after edit',
      diagnosis: 'Updated diagnosis',
      visitDate: '2026-08-03',
      symptoms: 'Cough resolved',
      prescribedMedicines: ['Rest'],
    }),
  });
  const putBody = await putRes.json();
  console.log('PUT', putRes.status, putBody?.success, putBody?.data?.title, putBody?.data?.patientName);
  if (!putRes.ok) throw new Error(JSON.stringify(putBody).slice(0, 500));

  const get2 = await fetch(`${API}/medical-records/${id}`, { headers });
  const got2 = await get2.json();
  console.log('GET_AFTER_PUT', get2.status, {
    title: got2?.data?.title,
    notes: got2?.data?.notes,
    diagnosis: got2?.data?.diagnosis,
    patientName: got2?.data?.patientName,
  });

  if (got2?.data?.title !== 'Updated note title') throw new Error('title not updated');
  if (!String(got2?.data?.notes || '').includes('Updated clinical')) throw new Error('notes not updated');
  if (got2?.data?.patientName !== 'Edit Flow Patient Updated') throw new Error('patientName not updated');

  // soft-delete cleanup via DELETE if available, else leave
  await fetch(`${API}/medical-records/${id}`, { method: 'DELETE', headers }).catch(() => {});

  console.log('EDIT_FLOW_OK');
})().catch((e) => {
  console.error('FATAL', e);
  process.exitCode = 1;
});
