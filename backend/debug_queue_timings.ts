
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root or backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Try root .env
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.resolve(__dirname, '.env') }); // Try backend .env
}

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching a recent appointment to get clinicId...');
    const appt = await prisma.appointment.findFirst({
        where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } }, // Ensure valid status for queue logic consideration
        orderBy: { createdAt: 'desc' },
        include: { doctor: true, patient: true }
    });

    if (!appt) {
        console.log('No scheduled appointment found.');
        return;
    }

    const clinicId = appt.doctor.clinicId; // Assuming doctor belongs to clinic, or use appt.id to find clinic
    // The logic in receptionists.service.ts uses doctor.clinicId

    if (!clinicId) {
        console.log('Doctor has no clinicId.');
        // Try to find a clinic
        const clinic = await prisma.clinic.findFirst();
        if (clinic) {
            console.log(`Using arbitrary clinicId: ${clinic.id}`);
        } else {
            return;
        }
    }

    console.log(`Testing with ClinicId: ${clinicId}`);
    console.log(`Reference Appointment: ${appt.id} | ScheduledAt: ${appt.scheduledAt.toISOString()} | Patient: ${appt.patient.firstName}`);

    // Determine Server Time Intepretation
    // Note: if I run this script, "now" is effectively "server time"
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Server Now: ${now.toISOString()}`);
    console.log(`StartOfDay: ${startOfDay.toISOString()}`);
    console.log(`EndOfDay:   ${endOfDay.toISOString()}`);

    // Fetch queued and scheduled appointments using logic from receptionists.service.ts
    const qStats = await getQueueStatusSimulated(clinicId, startOfDay, endOfDay);

    console.log('--- Queue Status Result ---');
    if (qStats.length === 0) {
        console.log("No queue entries found for today (server time).");
    }
    qStats.forEach((entry: any) => {
        console.log(`ID: ${entry.id}`);
        console.log(`Patient: ${entry.patient.firstName} ${entry.patient.lastName}`);
        console.log(`Status: ${entry.status}`);
        console.log(`Appt Time (Source): ${entry.appointmentTime}`);
        if (entry.appointmentTime) {
            console.log(`Appt Time (Parsed locally): ${new Date(entry.appointmentTime).toString()}`);
        }
        console.log(`Is Virtual: ${entry.isVirtual}`);
        console.log('---');
    });
}

// Logic copied/adapted from receptionists.service.ts
async function getQueueStatusSimulated(clinicId: any, startOfDay: Date, endOfDay: Date) {
    const where: any = {
        checkedInAt: {
            gte: startOfDay,
            lte: endOfDay,
        },
        status: {
            in: ['waiting', 'in_progress', 'checked_in'],
        },
    };

    if (clinicId) {
        where.clinicId = clinicId;
    }

    console.log("Searching QueueEntries with:", JSON.stringify(where));

    const queueEntries = await prisma.queueEntry.findMany({
        where,
        include: {
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
        },
        orderBy: { position: 'asc' },
    });

    console.log(`Found ${queueEntries.length} actual queue entries.`);

    const patientIdsInQueue = queueEntries.map(q => q.patientId);
    const queueAppointments = await prisma.appointment.findMany({
        where: {
            patientId: { in: patientIdsInQueue },
            scheduledAt: { gte: startOfDay, lte: endOfDay },
            status: { in: ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED', 'SCHEDULED'] },
        },
        select: {
            patientId: true,
            doctorId: true,
            scheduledAt: true,
        },
    });

    const appointmentTimeMap = new Map<string, string>();
    queueAppointments.forEach(apt => {
        const key = `${apt.patientId}_${apt.doctorId}`;
        appointmentTimeMap.set(key, apt.scheduledAt.toISOString());
    });

    const queueEntriesWithTime = queueEntries.map(entry => {
        const key = `${entry.patientId}_${entry.doctorId}`;
        let time = appointmentTimeMap.get(key);

        if (!time) {
            const fallbackApt = queueAppointments.find(apt => apt.patientId === entry.patientId);
            if (fallbackApt) time = fallbackApt.scheduledAt.toISOString();
        }

        return { ...entry, appointmentTime: time };
    });

    const appointmentWhere: any = {
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        deletedAt: null,
    };

    if (clinicId) {
        appointmentWhere.doctor = { clinicId };
    }

    console.log("Searching Appointments with:", JSON.stringify(appointmentWhere));

    const scheduledAppointments = await prisma.appointment.findMany({
        where: appointmentWhere,
        include: {
            patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
            doctor: { select: { id: true, clinicId: true } },
        },
        orderBy: { scheduledAt: 'asc' },
    });

    console.log(`Found ${scheduledAppointments.length} scheduled appointments.`);

    const patientsInQueue = new Set(queueEntries.map(q => q.patientId));

    const virtualQueueEntries = scheduledAppointments
        .filter(apt => !patientsInQueue.has(apt.patientId))
        .map((apt) => ({
            id: apt.id,
            patientId: apt.patientId,
            status: 'waiting',
            patient: apt.patient,
            appointmentTime: apt.scheduledAt.toISOString(),
            isVirtual: true
        }));

    return [...queueEntriesWithTime, ...virtualQueueEntries];
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
