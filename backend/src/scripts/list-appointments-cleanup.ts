
import prisma from '../config/database';

async function main() {
    try {
        const doctorId = '0a3796d9-fef9-4295-abfe-3e778aa50c05'; // Harsh Dev Singh Rana

        // Check appointments for "Today" and "Tomorrow" (broad range)
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 1);
        const end = new Date(now);
        end.setDate(end.getDate() + 2);

        const clinicId = '7fda298d-7dbd-4693-8f47-721101172a88';

        const appointments = await prisma.appointment.findMany({
            where: {
                OR: [
                    { doctorId: doctorId },
                    { doctor: { clinicId: clinicId } }
                ],
                scheduledAt: { gte: start, lte: end }
            },
            include: { doctor: true, patient: true }
        });

        console.log(`Found ${appointments.length} appointments.`);
        console.table(appointments.map(a => ({
            id: a.id,
            scheduledAt: a.scheduledAt.toISOString(),
            doctor: a.doctor?.firstName,
            patient: a.patient?.firstName,
            status: a.status,
            notes: a.notes
        })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
