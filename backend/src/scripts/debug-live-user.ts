
import prisma from '../config/database';
import { getDoctorAnalytics } from '../modules/doctors/doctors.analytics.service';

const USER_ID = '0a3796d9-fef9-4295-abfe-3e778aa50c05';
const CLINIC_ID = '7fda298d-7dbd-4693-8f47-721101172a88';

async function main() {
    let aptId;
    try {
        console.log(`--- Debugging User: ${USER_ID} ---`);

        // Create Appointment for Server Tomorrow (Client Today)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 1); // Tomorrow
        targetDate.setHours(12, 0, 0, 0);

        const apt = await prisma.appointment.create({
            data: {
                doctorId: USER_ID,
                patientId: '21c2c2a7-0bf2-4d1d-9b8a-f17b24fe48e1', // Jujhar (likely valid as he is in DB)
                scheduledAt: targetDate,
                duration: 30,
                status: 'CONFIRMED',
                notes: 'Debug Analytics Test - Harsh User'
            }
        });
        aptId = apt.id;
        console.log(`Created Appt: ${apt.id} for ${targetDate.toISOString()}`);

        // Call Analytics (Default Period 'day', No Dates)
        console.log('\n--- Calling getDoctorAnalytics (Default) ---');
        const analytics = await getDoctorAnalytics(
            USER_ID,
            'day',
            undefined,
            undefined,
            CLINIC_ID
        );

        console.log(`Today's Appointments Count: ${analytics.today.appointments}`);

        if (analytics.today.appointments > 0) {
            console.log("✅ SUCCESS: Analytics found the appointment.");
        } else {
            console.log("❌ FAILURE: Analytics returned 0.");

            // Log the search window to debug
            // We can't log from here easily without modifying the service.
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (aptId) await prisma.appointment.delete({ where: { id: aptId } });
        await prisma.$disconnect();
    }
}

main();
