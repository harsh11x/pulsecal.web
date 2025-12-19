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

export const getQueue = async (doctorId?: string, clinicId?: string) => {
  const where: {
    doctorId?: string;
    clinicId?: string;
    status?: string;
  } = {
    status: 'waiting',
  };

  if (doctorId) {
    where.doctorId = doctorId;
  }

  if (clinicId) {
    where.clinicId = clinicId;
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

export const getQueueStatus = async (patientId: string) => {
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

