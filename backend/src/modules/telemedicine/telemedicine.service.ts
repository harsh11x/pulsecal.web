import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { generateToken } from '../../utils/encrypt';

export const createTelemedicineSession = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  const roomId = generateToken(16);

  const session = await prisma.telemedicineSession.create({
    data: {
      appointmentId,
      roomId,
    },
    include: {
      appointment: {
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return session;
};

export const getTelemedicineSession = async (appointmentId: string) => {
  const session = await prisma.telemedicineSession.findUnique({
    where: { appointmentId },
    include: {
      appointment: {
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new AppError('Telemedicine session not found', 404);
  }

  return session;
};

export const startSession = async (appointmentId: string) => {
  const session = await prisma.telemedicineSession.update({
    where: { appointmentId },
    data: {
      startTime: new Date(),
    },
    include: {
      appointment: {
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return session;
};

export const endSession = async (
  appointmentId: string,
  recordingUrl?: string,
  notes?: string
) => {
  const session = await prisma.telemedicineSession.update({
    where: { appointmentId },
    data: {
      endTime: new Date(),
      recordingUrl,
      notes,
    },
    include: {
      appointment: {
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return session;
};

