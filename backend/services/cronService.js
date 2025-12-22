const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const setupCronJobs = (io) => {
    console.log('Initializing Cron Jobs...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // Calculate time windows
            const time15Min = new Date(now.getTime() + 15 * 60000);
            const time30Min = new Date(now.getTime() + 30 * 60000);

            // Define a small window (e.g., 0-59 seconds) to catch appointments in this minute
            // Use "start of minute" logic for better precision if needed, but simple range works for mostly minute-by-minute checks
            const windowStart15 = new Date(time15Min.setSeconds(0, 0));
            const windowEnd15 = new Date(time15Min.setSeconds(59, 999));

            const windowStart30 = new Date(time30Min.setSeconds(0, 0));
            const windowEnd30 = new Date(time30Min.setSeconds(59, 999));

            const windowStartNow = new Date(now.setSeconds(0, 0));
            const windowEndNow = new Date(now.setSeconds(59, 999));

            // Fetch appointments for 15 min reminder
            const appointments15 = await prisma.appointment.findMany({
                where: {
                    scheduledAt: {
                        gte: windowStart15,
                        lte: windowEnd15
                    },
                    status: 'CONFIRMED' // Only remind for confirmed appts
                },
                include: { patient: true, doctor: true, clinic: true }
            });

            // Fetch appointments for 30 min reminder
            const appointments30 = await prisma.appointment.findMany({
                where: {
                    scheduledAt: {
                        gte: windowStart30,
                        lte: windowEnd30
                    },
                    status: 'CONFIRMED'
                },
                include: { patient: true, doctor: true, clinic: true }
            });

            // Fetch appointments starting NOW
            const appointmentsNow = await prisma.appointment.findMany({
                where: {
                    scheduledAt: {
                        gte: windowStartNow,
                        lte: windowEndNow
                    },
                    status: 'CONFIRMED'
                },
                include: { patient: true, doctor: true, clinic: true }
            });

            // Send 15 Min Reminders
            appointments15.forEach(appt => {
                sendNotification(io, appt, 'Appointment in 15 minutes!', '15_MIN_REMINDER');
            });

            // Send 30 Min Reminders
            appointments30.forEach(appt => {
                sendNotification(io, appt, 'Appointment in 30 minutes.', '30_MIN_REMINDER');
            });

            // Send NOW Reminders
            appointmentsNow.forEach(appt => {
                sendNotification(io, appt, 'Appointment Usage Starting Now', 'NOW_REMINDER');
            });

        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
};

const sendNotification = (io, appt, message, type) => {
    const payload = {
        id: appt.id,
        message: `${message} with Dr. ${appt.doctor.lastName}`,
        time: appt.scheduledAt,
        type
    };

    // Notify Patient
    io.to(`user_${appt.patientId}`).emit('notification:reminder', payload);

    // Notify Doctor
    io.to(`user_${appt.doctorId}`).emit('notification:reminder', {
        ...payload,
        message: `${message} with ${appt.patient.firstName} ${appt.patient.lastName}`
    });

    // Notify Receptionists of that Clinic (This requires finding them or broadcasting to a clinic room)
    if (appt.clinicId) {
        io.to(`clinic_${appt.clinicId}`).emit('notification:reminder', {
            ...payload,
            message: `${message}: Dr. ${appt.doctor.lastName} - ${appt.patient.firstName}`
        });
    }
};

module.exports = { setupCronJobs };
