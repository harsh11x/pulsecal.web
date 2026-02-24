import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

export const addToQueue = async (data: {
  patientId: string;
  doctorId?: string;
  clinicId?: string;
}) => {
  const existingEntry = await prisma.queueEntry.findFirst({
    where: {
      patientId: data.patientId,
      status: 'waiting',
    },
  });

  if (existingEntry) {
    throw new AppError('Patient already in queue', 400);
  }

  const lastPosition = await prisma.queueEntry.findFirst({
    where: {
      doctorId: data.doctorId,
      clinicId: data.clinicId,
      status: 'waiting',
    },
    orderBy: {
      position: 'desc',
    },
  });

  const position = lastPosition ? lastPosition.position + 1 : 1;

  const queueEntry = await prisma.queueEntry.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      clinicId: data.clinicId,
      position,
      status: 'waiting',
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return queueEntry;
};

export const getQueue = async (doctorId?: string, clinicId?: string, req?: { user?: { id: string; role: string; clinicId?: string | null } }) => {
  const where: {
    doctorId?: string;
    clinicId?: string;
    patientId?: string;
    status?: string;
  } = {
    status: 'waiting',
  };

  const userRole = req?.user?.role?.toUpperCase();
  const userId = req?.user?.id;
  const userClinicId = req?.user?.clinicId;

  if (userRole === 'DOCTOR') {
    where.doctorId = userId;
  } else if (userRole === 'RECEPTIONIST') {
    if (userClinicId) {
      where.clinicId = userClinicId;
      // Allow filtering by doctor within their own clinic
      if (doctorId) {
        where.doctorId = doctorId;
      }
    } else {
      where.clinicId = 'non-existent';
    }
  } else if (userRole === 'PATIENT') {
    where.patientId = userId;
  } else if (userRole !== 'ADMIN') {
    // Fail-safe: Non-admin users with no specific role/clinic match should see nothing
    where.doctorId = 'non-existent';
  }

  // Handle explicit overrides ONLY for Admins
  if (userRole === 'ADMIN') {
    if (doctorId) where.doctorId = doctorId;
    if (clinicId) where.clinicId = clinicId;
  }

  // CRITICAL: Ensure we never return EVERY waiting patient in the system
  if (!where.doctorId && !where.clinicId && !where.patientId && userRole !== 'ADMIN') {
    where.doctorId = 'non-existent';
  }

  const queue = await prisma.queueEntry.findMany({
    where,
    orderBy: {
      position: 'asc',
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return queue;
};

export const getQueueStatus = async (patientId: string, req?: { user?: { id: string; role: string; clinicId?: string | null } }) => {
  // Authorization: Patients can only see their own queue status
  if (req?.user?.role === 'PATIENT' && req.user.id !== patientId) {
    throw new AppError('Unauthorized access to queue status', 403);
  }

  const queueEntry = await prisma.queueEntry.findFirst({
    where: {
      patientId,
      status: 'waiting',
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!queueEntry) {
    throw new AppError('Patient not in queue', 404);
  }

  const aheadCount = await prisma.queueEntry.count({
    where: {
      doctorId: queueEntry.doctorId,
      clinicId: queueEntry.clinicId,
      status: 'waiting',
      position: {
        lt: queueEntry.position,
      },
    },
  });

  const estimatedWaitTime = aheadCount * 15; // 15 minutes per patient

  return {
    ...queueEntry,
    positionInQueue: aheadCount + 1,
    estimatedWaitTime,
  };
};

export const callNextPatient = async (doctorId: string, clinicId?: string) => {
  const nextPatient = await prisma.queueEntry.findFirst({
    where: {
      doctorId,
      clinicId,
      status: 'waiting',
    },
    orderBy: {
      position: 'asc',
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!nextPatient) {
    throw new AppError('No patients in queue', 404);
  }

  const updated = await prisma.queueEntry.update({
    where: { id: nextPatient.id },
    data: {
      status: 'in_progress',
      calledAt: new Date(),
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  await prisma.queueEntry.updateMany({
    where: {
      doctorId,
      clinicId,
      status: 'waiting',
      position: {
        gt: nextPatient.position,
      },
    },
    data: {
      position: {
        decrement: 1,
      },
    },
  });

  return updated;
};

export const completeQueueEntry = async (queueEntryId: string) => {
  const queueEntry = await prisma.queueEntry.update({
    where: { id: queueEntryId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return queueEntry;
};

export const updateQueueEntryStatus = async (queueEntryId: string, status: string) => {
  const valid = ['waiting', 'checked_in', 'in_progress', 'completed', 'cancelled'];
  if (!valid.includes(status)) {
    throw new AppError('Invalid queue status', 400);
  }

  // 1. Try to find existing QueueEntry
  const entry = await prisma.queueEntry.findUnique({
    where: { id: queueEntryId },
  });

  if (entry) {
    // Standard update
    const data: any = { status };
    if (status === 'completed') {
      data.completedAt = new Date();
    }
    return prisma.queueEntry.update({
      where: { id: queueEntryId },
      data,
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
    });
  }

  // 2. If not found, check if it's an Appointment ID (Virtual Queue Entry)
  const appointment = await prisma.appointment.findUnique({
    where: { id: queueEntryId },
    include: {
      doctor: true
    }
  });

  if (appointment) {
    // It's a virtual entry being "checked in" or updated
    // Create a REAL QueueEntry
    if (status === 'checked_in' || status === 'waiting' || status === 'in_progress') {
      // Find last position
      const lastPosition = await prisma.queueEntry.findFirst({
        where: {
          doctorId: appointment.doctorId,
          clinicId: appointment.doctor.clinicId,
          status: 'waiting',
        },
        orderBy: {
          position: 'desc',
        },
      });

      const position = lastPosition ? lastPosition.position + 1 : 1;

      // Update Appointment Status to match if appropriate
      if (status === 'checked_in') {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'CHECKED_IN',
            checkInTime: new Date()
          }
        });
      } else if (status === 'in_progress') {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'IN_PROGRESS',
            startTime: new Date()
          }
        });
      }

      // Create QueueEntry
      const newEntry = await prisma.queueEntry.create({
        data: {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          clinicId: appointment.doctor.clinicId,
          position,
          status: status, // e.g. 'checked_in'
          checkedInAt: new Date(),
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        }
      });

      return newEntry;
    }
  }

  throw new AppError('Queue entry not found', 404);
};

export const removeFromQueue = async (queueEntryId: string) => {
  const queueEntry = await prisma.queueEntry.findUnique({
    where: { id: queueEntryId },
  });

  if (!queueEntry) {
    throw new AppError('Queue entry not found', 404);
  }

  await prisma.queueEntry.update({
    where: { id: queueEntryId },
    data: {
      status: 'cancelled',
    },
  });

  await prisma.queueEntry.updateMany({
    where: {
      doctorId: queueEntry.doctorId,
      clinicId: queueEntry.clinicId,
      status: 'waiting',
      position: {
        gt: queueEntry.position,
      },
    },
    data: {
      position: {
        decrement: 1,
      },
    },
  });

  return { message: 'Removed from queue successfully' };
};

