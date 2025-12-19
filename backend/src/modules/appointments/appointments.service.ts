import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';
import { APPOINTMENT_STATUS } from '../../utils/constants';

export const createAppointment = async (data: {
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  duration?: number;
  reason?: string;
}) => {
  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      scheduledAt: data.scheduledAt,
      duration: data.duration || 30,
      reason: data.reason,
      status: 'SCHEDULED',
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
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return appointment;
};

export const getAppointments = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    patientId?: string;
    doctorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
  user?: { id: string; role: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    scheduledAt?: { gte?: Date; lte?: Date };
    deletedAt?: null;
  } = {
    deletedAt: null,
  };

  if (req.user?.role === 'PATIENT') {
    where.patientId = req.user.id;
  } else if (req.user?.role === 'DOCTOR') {
    where.doctorId = req.user.id;
  }

  if (req.query.patientId) {
    where.patientId = req.query.patientId;
  }

  if (req.query.doctorId) {
    where.doctorId = req.query.doctorId;
  }

  if (req.query.status) {
    where.status = req.query.status;
  }

  if (req.query.startDate || req.query.endDate) {
    where.scheduledAt = {};
    if (req.query.startDate) {
      where.scheduledAt.gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      where.scheduledAt.lte = new Date(req.query.endDate);
    }
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
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
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAppointmentById = async (
  appointmentId: string,
  userId?: string,
  userRole?: string
) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
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
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      medicalRecords: true,
      prescription: true,
    },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (
    userId &&
    userRole !== 'ADMIN' &&
    userRole !== 'RECEPTIONIST' &&
    appointment.patientId !== userId &&
    appointment.doctorId !== userId
  ) {
    throw new AppError('Unauthorized', 403);
  }

  return appointment;
};

export const updateAppointment = async (
  appointmentId: string,
  data: {
    scheduledAt?: Date;
    duration?: number;
    reason?: string;
    notes?: string;
    status?: string;
  }
) => {
  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return appointment;
};

export const rescheduleAppointment = async (
  appointmentId: string,
  newScheduledAt: Date
) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
    throw new AppError('Cannot reschedule completed or cancelled appointment', 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      scheduledAt: newScheduledAt,
      status: 'RESCHEDULED',
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
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

export const cancelAppointment = async (
  appointmentId: string,
  cancellationReason?: string
) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
    throw new AppError('Appointment already completed or cancelled', 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason,
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
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

export const checkInAppointment = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.status === 'CANCELLED') {
    throw new AppError('Cannot check in cancelled appointment', 400);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CONFIRMED',
      checkInTime: new Date(),
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
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

export const deleteAppointment = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Appointment deleted successfully' };
};

