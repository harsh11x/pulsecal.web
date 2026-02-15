
import prisma from '../config/database';
import { getAppointments } from '../modules/appointments/appointments.service';

async function main() {
    try {
        console.log('--- Debugging Date Filtering ---');

        // Doctor: Sukhpreet
        const doctorId = 'b2991154-e9a3-48c7-9a1c-15e9d57ac36e';
        const doctor = await prisma.user.findUnique({ where: { id: doctorId } });

        if (!doctor) { console.error('Doctor not found'); return; }

        console.log(`Running as: ${doctor.firstName} (Clinic: ${doctor.clinicId})`);

        // 1. Fetch Today's Appointments via Service
        console.log('\n--- Fetching "date=today" ---');
        // Ensure we are in a timezone that might cause issues if not handled (User said "now", currently 11:22 PM local)
        // If server time is UTC, "today" might be tomorrow or yesterday depending on offsets if not careful.
        // But usually 'today' logic in service uses server local time.

        const req = {
            query: { page: '1', limit: '20', date: 'today' },
            user: { id: doctor.id, role: 'DOCTOR', clinicId: doctor.clinicId }
        };

        const result = await getAppointments(req);
        console.log(`Found: ${result.appointments.length} appointments`);

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        console.log(`Server Today Range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

        result.appointments.forEach(a => {
            const d = new Date(a.scheduledAt);
            const isToday = d >= startOfDay && d <= endOfDay;
            const icon = isToday ? '✅' : '❌';
            console.log(`${icon} ID: ${a.id} | Time: ${d.toISOString()} | Doc: ${a.doctor.id}`);

            if (!isToday) {
                console.error(`   ⚠️ INCORRECT DATE! Should be excluded.`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
