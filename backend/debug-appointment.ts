
import prisma from './src/config/database';
import { getAppointmentById } from './src/modules/appointments/appointments.service';

const appointmentId = '283611b6-23eb-45ba-8774-3408a2f30be6';

async function main() {
    console.log(`Fetching appointment ${appointmentId}...`);
    try {
        const appointment = await getAppointmentById(appointmentId);
        console.log('Success:', JSON.stringify(appointment, null, 2));
    } catch (error: any) {
        console.error('Error fetching appointment:');
        console.error(error);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
