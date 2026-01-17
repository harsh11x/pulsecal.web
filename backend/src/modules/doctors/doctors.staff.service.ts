import prisma from '../../config/database';

/**
 * Get all staff members (doctors and receptionists) in a clinic
 */
export const getClinicStaff = async (clinicId: string) => {
    // Get all doctors in the clinic
    const doctors = await prisma.user.findMany({
        where: {
            clinicId,
            role: 'DOCTOR',
            isActive: true,
            deletedAt: null,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            createdAt: true,
            doctorProfile: {
                select: {
                    specialization: true,
                    licenseNumber: true,
                },
            },
        },
    });

    // Get all receptionists in the clinic
    const receptionists = await prisma.user.findMany({
        where: {
            clinicId,
            role: 'RECEPTIONIST',
            isActive: true,
            deletedAt: null,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            createdAt: true,
        },
    });

    // Get stats for each doctor
    const doctorsWithStats = await Promise.all(
        doctors.map(async (doctor) => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get this month's appointments
            const appointments = await prisma.appointment.count({
                where: {
                    doctorId: doctor.id,
                    scheduledAt: { gte: startOfMonth },
                    deletedAt: null,
                },
            });

            // Get completed appointments
            const completedAppointments = await prisma.appointment.findMany({
                where: {
                    doctorId: doctor.id,
                    status: 'COMPLETED',
                    scheduledAt: { gte: startOfMonth },
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            });

            // Get revenue
            const payments = await prisma.payment.findMany({
                where: {
                    appointmentId: { in: completedAppointments.map(a => a.id) },
                    status: 'COMPLETED',
                },
            });

            const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

            // Get unique patients
            const uniquePatients = await prisma.appointment.findMany({
                where: {
                    doctorId: doctor.id,
                    scheduledAt: { gte: startOfMonth },
                    deletedAt: null,
                },
                distinct: ['patientId'],
                select: {
                    patientId: true,
                },
            });

            return {
                ...doctor,
                stats: {
                    appointmentsThisMonth: appointments,
                    completedAppointments: completedAppointments.length,
                    revenueThisMonth: revenue,
                    uniquePatients: uniquePatients.length,
                },
            };
        })
    );

    // Get stats for each receptionist
    const receptionistsWithStats = await Promise.all(
        receptionists.map(async (receptionist) => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Count appointments managed this month (simplified - count all appointments in clinic)
            const appointmentsManaged = await prisma.appointment.count({
                where: {
                    doctor: {
                        clinicId: receptionist.clinicId,
                    },
                    scheduledAt: { gte: startOfMonth },
                    deletedAt: null,
                },
            });

            return {
                ...receptionist,
                stats: {
                    appointmentsManagedThisMonth: appointmentsManaged,
                },
            };
        })
    );

    return {
        doctors: doctorsWithStats,
        receptionists: receptionistsWithStats,
        totalStaff: doctorsWithStats.length + receptionistsWithStats.length,
    };
};
