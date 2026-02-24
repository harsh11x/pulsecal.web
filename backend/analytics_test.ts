import { PrismaClient } from '@prisma/client';
import { getDoctorAnalytics } from './src/modules/doctors/doctors.analytics.service';
import { getAppointments } from './src/modules/appointments/appointments.service';

const prisma = new PrismaClient();

async function test() {
    const doctorA = '68ca4b2e-e533-40ed-810a-aeeb218764c0';
    const doctorB = 'b2991154-e9a3-48c7-9a1c-15e9d57ac36e';

    console.log('--- TESTING DOCTOR A ---');
    try {
        const analyticsA = await getDoctorAnalytics(doctorA, 'week');
        console.log('Doctor A Today Appointments:', analyticsA.today.appointments);
        console.log('Doctor A Revenue Data Length:', analyticsA.revenueData.length);

        const appointmentsA = await getAppointments({
            user: { id: doctorA, role: 'DOCTOR' },
            query: {}
        } as any);
        console.log('Doctor A getAppointments Total:', appointmentsA.pagination.total);
    } catch (e) {
        console.error('Doctor A Error:', e.message);
    }

    console.log('\n--- TESTING DOCTOR B ---');
    try {
        const analyticsB = await getDoctorAnalytics(doctorB, 'week');
        console.log('Doctor B Today Appointments:', analyticsB.today.appointments);
        console.log('Doctor B Revenue Data Length:', analyticsB.revenueData.length);

        const appointmentsB = await getAppointments({
            user: { id: doctorB, role: 'DOCTOR' },
            query: {}
        } as any);
        console.log('Doctor B getAppointments Total:', appointmentsB.pagination.total);
    } catch (e) {
        console.error('Doctor B Error:', e.message);
    }

    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
