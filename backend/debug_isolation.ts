
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE ISOLATION AUDIT ---');

    // 1. Get all clinics
    const clinics = await prisma.clinic.findMany({
        select: { id: true, name: true }
    });

    for (const clinic of clinics) {
        console.log(`\nClinic: ${clinic.name} (${clinic.id})`);

        // 2. Get all doctors in this clinic
        const doctors = await prisma.user.findMany({
            where: { clinicId: clinic.id, role: 'DOCTOR' },
            select: { id: true, firstName: true, lastName: true }
        });

        for (const doctor of doctors) {
            // 3. Count appointments directly for this doctor
            const appointmentCount = await prisma.appointment.count({
                where: { doctorId: doctor.id }
            });

            console.log(`  - Doctor: ${doctor.firstName} ${doctor.lastName} (${doctor.id})`);
            console.log(`    Appointments: ${appointmentCount}`);

            // 4. Check if any appointments for this doctor belong to a different clinic's patients
            // (This would be a different type of leak)
            const foreignAppointments = await prisma.appointment.findMany({
                where: {
                    doctorId: doctor.id,
                    patient: {
                        NOT: {
                            clinicId: clinic.id
                        }
                    }
                },
                include: {
                    patient: true
                }
            });

            if (foreignAppointments.length > 0) {
                console.log(`    [WARNING] Found ${foreignAppointments.length} appointments from patients in OTHER clinics!`);
            }
        }
    }

    // 5. Check for appointments with NO doctor or NO patient
    const orphanedAppointments = await prisma.appointment.count({
        where: {
            OR: [
                { doctorId: { equals: '' } },
                { patientId: { equals: '' } }
            ]
        }
    });
    console.log(`\nOrphaned Appointments: ${orphanedAppointments}`);

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
