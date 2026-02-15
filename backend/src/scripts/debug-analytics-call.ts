
import prisma from '../config/database';
import { getDoctorAnalytics } from '../modules/doctors/doctors.analytics.service';

async function main() {
    let aptId;
    try {
        console.log('--- Debugging Analytics Call ---');

        // Doctor: Sukhpreet
        const doctorId = 'b2991154-e9a3-48c7-9a1c-15e9d57ac36e';
        const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
        if (!doctor) throw new Error('Doctor not found');

        const now = new Date();
        // Simulate current server time (Feb 15?)
        console.log(`Server Time: ${now.toISOString()}`);

        // Scenario: User is Feb 16 (Tomorrow relative to Server Feb 15)
        // Create appointment for Feb 16
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 1); // Tomorrow
        targetDate.setHours(12, 0, 0, 0); // Noon

        console.log(`Creating Appointment for: ${targetDate.toISOString()}`);

        const apt = await prisma.appointment.create({
            data: {
                doctorId: doctor.id,
                patientId: '21c2c2a7-0bf2-4d1d-9b8a-f17b24fe48e1',
                scheduledAt: targetDate,
                duration: 30,
                status: 'CONFIRMED',
                notes: 'Test Appt for User Today (Server Tomorrow)'
            }
        });
        aptId = apt.id;

        // 1. Simulate Frontend Request WITHOUT Dates (broken behavior?)
        console.log('\n--- 1. Analytics Call WITHOUT Dates (Defaults to Server Time) ---');
        const analyticsDefault = await getDoctorAnalytics(
            doctor.id,
            'day',
            undefined,
            undefined,
            doctor.clinicId || undefined
        );
        console.log(`Default "Today" Count: ${analyticsDefault.today.appointments}`);

        // 2. Simulate Frontend Request WITH Dates (User Today)
        console.log('\n--- 2. Analytics Call WITH Dates (User Today) ---');
        const startDate = new Date(targetDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const analyticsCustom = await getDoctorAnalytics(
            doctor.id,
            'day',
            startDate,
            endDate,
            doctor.clinicId || undefined
        );
        console.log(`Custom "Today" Count: ${analyticsCustom.today.appointments}`);

        if (analyticsDefault.today.appointments === 0 && analyticsCustom.today.appointments === 1) {
            console.log("\nCONCLUSION: The issue is confirmed. Frontend is likely NOT sending dates, so Server is using its own 'Today' (Feb 15) which excludes the appointment.");
        } else {
            console.log("\nCONCLUSION: Something else is happening.");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (aptId) await prisma.appointment.delete({ where: { id: aptId } });
        await prisma.$disconnect();
    }
}

main();
