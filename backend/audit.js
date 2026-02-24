const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Doctor Appointment Counts ---');
    const doctorCounts = await prisma.appointment.groupBy({
        by: ['doctorId'],
        _count: {
            id: true
        },
        orderBy: {
            _count: {
                id: 'desc'
            }
        }
    });
    console.log(JSON.stringify(doctorCounts, null, 2));

    console.log('\n--- Appointments by Doctor and Clinic (Indirect) ---');
    const appointmentsWithClinic = await prisma.appointment.findMany({
        take: 50,
        select: {
            id: true,
            doctorId: true,
            doctor: {
                select: {
                    clinicId: true,
                    clinic: { select: { name: true } }
                }
            }
        }
    });
    console.log(JSON.stringify(appointmentsWithClinic, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
