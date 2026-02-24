
import { getAppointments } from './src/modules/appointments/appointments.service';

// Mock Prisma for service testing if needed, or just use real DB
// For simplicity, let's use the real service since we have the DB set up

async function testIsolation() {
    console.log('--- API ISOLATION TEST ---');

    // Find a doctor with appointments
    // (From our audit: Jujhar Randhawa has 45)
    const doctor1Id = '68ca4b2e-e533-40ed-810a-aeeb218764c0';
    const doctor2Id = 'b2991154-e9a3-48c7-9a1c-15e9d57ac36e';

    console.log(`\nTesting as Doctor 1: ${doctor1Id}`);
    const res1 = await getAppointments({
        query: { limit: '100' },
        user: { id: doctor1Id, role: 'DOCTOR' }
    } as any);

    const d1Apts = res1.appointments;
    console.log(`Count returned: ${d1Apts.length}`);
    const leaks1 = d1Apts.filter(a => a.doctorId !== doctor1Id);
    if (leaks1.length > 0) {
        console.error(`[LEAK] Doctor 1 saw ${leaks1.length} appointments belonging to others!`);
        console.log('Leaked Doctor IDs:', [...new Set(leaks1.map(a => a.doctorId))]);
    } else {
        console.log('No leaks for Doctor 1.');
    }

    console.log(`\nTesting as Doctor 2: ${doctor2Id}`);
    const res2 = await getAppointments({
        query: { limit: '100' },
        user: { id: doctor2Id, role: 'DOCTOR' }
    } as any);

    const d2Apts = res2.appointments;
    console.log(`Count returned: ${d2Apts.length}`);
    const leaks2 = d2Apts.filter(a => a.doctorId !== doctor2Id);
    if (leaks2.length > 0) {
        console.error(`[LEAK] Doctor 2 saw ${leaks2.length} appointments belonging to others!`);
        console.log('Leaked Doctor IDs:', [...new Set(leaks2.map(a => a.doctorId))]);
    } else {
        console.log('No leaks for Doctor 2.');
    }

    process.exit(0);
}

testIsolation().catch(console.error);
