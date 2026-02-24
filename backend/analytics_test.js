const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getDoctorAnalytics } = require('./src/modules/doctors/doctors.analytics.service');
const { getAppointments } = require('./src/modules/appointments/appointments.service');

async function test() {
    const doctorA = '68ca4b2e-e533-40ed-810a-aeeb218764c0';
    const doctorB = 'b2991154-e9a3-48c7-9a1c-15e9d57ac36e';

    console.log('--- TESTING DOCTOR A ---');
    const analyticsA = await getDoctorAnalytics(doctorA, 'week');
    console.log('Doctor A Today Appointments:', analyticsA.today.appointments);
    console.log('Doctor A Revenue Data Length:', analyticsA.revenueData.length);

    const appointmentsA = await getAppointments({
        user: { id: doctorA, role: 'DOCTOR' },
        query: {}
    });
    console.log('Doctor A getAppointments Total:', appointmentsA.pagination.total);

    console.log('\n--- TESTING DOCTOR B ---');
    const analyticsB = await getDoctorAnalytics(doctorB, 'week');
    console.log('Doctor B Today Appointments:', analyticsB.today.appointments);
    console.log('Doctor B Revenue Data Length:', analyticsB.revenueData.length);

    const appointmentsB = await getAppointments({
        user: { id: doctorB, role: 'DOCTOR' },
        query: {}
    });
    console.log('Doctor B getAppointments Total:', appointmentsB.pagination.total);

    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
