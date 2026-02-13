import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Get receptionist dashboard stats - only for their clinic
 */
export const getReceptionistStats = async (_receptionistId: string, clinicId?: string | null, date?: string | Date) => {
  const filterDate = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  const startOfDay = new Date(filterDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  // Only appointments for doctors in this receptionist's clinic
  const where: any = {
    scheduledAt: {
      gte: startOfDay,
      lt: endOfDay,
    },
    deletedAt: null,
  };

  if (clinicId) {
    where.doctor = { clinicId };
  }

  const todayAppointments = await prisma.appointment.findMany({
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
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          clinicId: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  });

  const totalCount = todayAppointments.length;
  const stats = {
    appointments: totalCount,
    totalBooked: totalCount,
    completed: todayAppointments.filter(apt => apt.status === 'COMPLETED').length,
    waiting: todayAppointments.filter(apt =>
      ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'].includes(apt.status)
    ).length,
    inProgress: todayAppointments.filter(apt => apt.status === 'IN_PROGRESS').length,
    cancelled: todayAppointments.filter(apt => apt.status === 'CANCELLED').length,
    noShow: todayAppointments.filter(apt => apt.status === 'NO_SHOW').length,
  };

  // Fetch clinic info if clinicId provided
  let clinic = null;
  if (clinicId) {
    clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, address: true, city: true, phone: true, email: true },
    });
  }

  return {
    stats,
    appointments: todayAppointments,
    clinic,
  };
};

/**
 * Get queue status for receptionist
 */
export const getQueueStatus = async (clinicId?: string) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const where: any = {
    checkedInAt: {
      gte: startOfDay, // This filters by TODAY's check-ins
      lte: endOfDay,
    },
    status: {
      in: ['waiting', 'in_progress', 'checked_in'],
    },
  };

  if (clinicId) {
    where.clinicId = clinicId;
  }

  // 1. Fetch Real Queue Entries
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
    orderBy: {
      position: 'asc',
    },
  });

  // Fetch appointments for these queue entries to get the time
  // This fixes the issue where checked-in patients don't show time on dashboard
  const patientIdsInQueue = queueEntries.map(q => q.patientId);
  const queueAppointments = await prisma.appointment.findMany({
    where: {
      patientId: { in: patientIdsInQueue },
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED', 'SCHEDULED'], // Statuses relevant to queue
      },
    },
    select: {
      patientId: true,
      doctorId: true,
      scheduledAt: true,
    },
  });

  // Map appointment times to a lookup object using composite key
  const appointmentTimeMap = new Map<string, string>();
  queueAppointments.forEach(apt => {
    // Key by patient_doctor to handle multiple appointments for different doctors
    const key = `${apt.patientId}_${apt.doctorId}`;
    appointmentTimeMap.set(key, apt.scheduledAt.toISOString());
  });

  // Attach appointmentTime to queue entries
  const queueEntriesWithTime = queueEntries.map(entry => {
    const key = `${entry.patientId}_${entry.doctorId}`;
    // Fallback to searching just by patientId if doctorId is missing (unlikely)
    // or if exact match not found (e.g. mismatched doctor assignment?)
    let time = appointmentTimeMap.get(key);

    // If exact patient-doctor match fails, try finding ANY appointment for this patient 
    // (fallback for edge cases where doctorId might be null in queue but present in appointment or vice versa)
    if (!time) {
      const fallbackApt = queueAppointments.find(apt => apt.patientId === entry.patientId);
      if (fallbackApt) time = fallbackApt.scheduledAt.toISOString();
    }

    return {
      ...entry,
      appointmentTime: time,
    };
  });

  // 2. Fetch Scheduled Appointments for Today (that are NOT in queue)
  const appointmentWhere: any = {
    scheduledAt: {
      gte: startOfDay,
      lte: endOfDay,
    },
    status: {
      in: ['SCHEDULED', 'CONFIRMED'],
    },
    deletedAt: null,
  };

  if (clinicId) {
    appointmentWhere.doctor = { clinicId };
  }

  const scheduledAppointments = await prisma.appointment.findMany({
    where: appointmentWhere,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      doctor: {
        select: {
          id: true,
          clinicId: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  });

  // Filter out patients who are already in the real queue
  // (Assuming one active queue entry per patient per day is ideal, or at least check if they have a queue entry)
  const patientsInQueue = new Set(queueEntries.map(q => q.patientId));

  const virtualQueueEntries = scheduledAppointments
    .filter(apt => !patientsInQueue.has(apt.patientId))
    .map((apt) => ({
      id: apt.id, // Use Appointment ID as virtual ID
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      clinicId: apt.doctor.clinicId,
      position: 9999, // Place them at the end? Or handled by frontend not showing position?
      // Actually, frontend uses index+1. 
      // We should probably append these after real queue entries.
      status: 'waiting', // Display as "Waiting" (needs check-in)
      estimatedWaitTime: 0,
      checkedInAt: apt.scheduledAt, // Use scheduled time as proxy? 
      // Note: Frontend formats date, doesn't use checkInAt explicitly for display usually, 
      // but sorts or uses it.
      calledAt: null,
      completedAt: null,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
      patient: apt.patient,
      appointmentTime: apt.scheduledAt.toISOString(),
      isVirtual: true // Marker for debugging/frontend if needed (though not in type)
    }));

  // Combine: Real Queue First, then Scheduled "Virtual" Queue
  // We map virtual entries to match QueueEntry type (mostly)
  return [...queueEntriesWithTime, ...virtualQueueEntries];
};

/**
 * Get all doctors in the receptionist's clinic
 */
export const getClinicDoctors = async (clinicId: string) => {
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
      doctorProfile: {
        select: {
          specialization: true,
          consultationFee: true,
        },
      },
    },
  });

  return doctors;
};

/**
 * Link receptionist to clinic
 */
export const linkReceptionistToClinic = async (
  receptionistId: string,
  clinicId: string,
  _verificationCode?: string
) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
  });

  if (!clinic) {
    throw new AppError('Clinic not found', 404);
  }

  await prisma.user.update({
    where: { id: receptionistId },
    data: { clinicId },
  });

  return {
    message: 'Receptionist linked to clinic successfully',
    clinicId,
  };
};

/**
 * Register offline patient
 */
export const registerOfflinePatient = async (data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;
  clinicId: string;
}) => {
  // Check if patient with phone already exists
  const existingUser = await prisma.user.findFirst({
    where: { phone: data.phone },
  });

  if (existingUser) {
    throw new AppError('Patient with this phone number already exists', 400);
  }

  // Create user with null firebaseUid (Offline patient)
  // We use the phone number as a pseudo-unique identifier for offline users if email is missing
  const email = data.email || `offline_${data.phone}@pulsecal.local`;

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      role: 'PATIENT',
      isActive: true,
      clinicId: data.clinicId, // Link to clinic that registered them
      isEmailVerified: false,
    },
  });

  // Create Patient Profile
  await prisma.patientProfile.create({
    data: {
      userId: user.id,
    },
  });

  return user;
};
