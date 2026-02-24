import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';

import { Prisma, AppointmentStatus } from '@prisma/client';

const checkAppointmentConflict = async (
  doctorId: string,
  scheduledAt: Date,
  duration: number,
  excludeAppointmentId?: string
) => {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + duration * 60000);

  // Fetch appointments that could overlap (same day)
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(start);
  dayEnd.setDate(dayEnd.getDate() + 1);
  dayEnd.setHours(0, 0, 0, 0);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      scheduledAt: { gte: dayStart, lt: dayEnd },
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
    },
    select: { id: true, scheduledAt: true, duration: true },
  });

  const hasConflict = appointments.some((apt) => {
    const aptStart = new Date(apt.scheduledAt);
    const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
    return start < aptEnd && end > aptStart;
  });

  if (hasConflict) {
    throw new AppError('This time slot is already booked', 409);
  }
};

export const createAppointment = async (data: {
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  duration?: number;
  reason?: string;
  notes?: string;
  status?: string;
}) => {
  await checkAppointmentConflict(data.doctorId, data.scheduledAt, data.duration || 30);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      scheduledAt: data.scheduledAt,
      duration: data.duration || 30,
      reason: data.reason,
      notes: data.notes,
      status: (data.status || 'SCHEDULED') as AppointmentStatus,
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
    date?: string;
  };
  user?: { id: string; role: string; clinicId?: string | null };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);

  // Default sort by scheduledAt ASC (nearest first) if not provided
  if (!req.query.sortBy) {
    req.query.sortBy = 'scheduledAt';
    req.query.sortOrder = 'asc';
  }

  const { orderBy, order } = getSortParams(req as never);

  const where: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    scheduledAt?: { gte?: Date; lte?: Date; lt?: Date };
    deletedAt?: null;
    doctor?: { clinicId?: string };
    OR?: Array<{ doctorId?: string } | { doctor?: { clinicId?: string } } | { patientId?: string }>;
  } = {
    deletedAt: null,
  };

  // Role-based filtering
  if (req.user?.role === 'PATIENT') {
    where.patientId = req.user.id;
  } else if (req.user?.role === 'DOCTOR') {
    // Doctor can ONLY see appointments assigned to them
    where.doctorId = req.user.id;
  } else if (req.user?.role === 'RECEPTIONIST' && req.user.clinicId) {
    // Receptionist can see all appointments for their clinic
    where.doctor = { clinicId: req.user.clinicId };
  } else if (req.user?.role !== 'ADMIN') {
    // Fail-safe: Non-admin users with no specific role/clinic match should see nothing
    where.OR = [{ doctorId: 'non-existent' }, { patientId: 'non-existent' }];
  }

  if (req.query.patientId) {
    // Patients can only filter their own appointments
    if (req.user?.role === 'PATIENT' && req.query.patientId !== req.user.id) {
      where.patientId = 'non-existent';
    } else {
      where.patientId = req.query.patientId;
    }
  }

  if (req.query.doctorId) {
    // Doctors can only see their own appointments; don't let query override
    if (req.user?.role === 'DOCTOR') {
      where.doctorId = req.user.id;
    } else if (req.user?.role === 'RECEPTIONIST' && req.user.clinicId) {
      // Receptionists can filter by doctor, but ONLY within their clinic
      where.doctorId = req.query.doctorId;
      where.doctor = { clinicId: req.user.clinicId };
    } else {
      where.doctorId = req.query.doctorId;
    }
  }

  if (req.query.status) {
    where.status = req.query.status;
  }

  // Handle 'date=today' query for dashboard
  // Prioritize startDate and endDate if provided (likely from client ensuring local time)
  if (req.query.startDate || req.query.endDate) {
    if (!where.scheduledAt) where.scheduledAt = {};
    if (req.query.startDate) {
      where.scheduledAt.gte = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      where.scheduledAt.lte = new Date(req.query.endDate as string);
    }
  } else if (req.query.date === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.scheduledAt = { gte: today, lt: tomorrow };
  } else if (!req.query.date && !req.query.status) {
    // Default behavior: Show ALL appointments (paginated)
    // This allows "Past" and "Cancelled" tabs to work correctly without explicit date filters
    // where.scheduledAt = { gte: new Date() }; 
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where: where as Prisma.AppointmentWhereInput,
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
            // Include profile image so all doctor lists/profile views can show avatar
            profileImage: true,
            clinicId: true,
            clinic: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                phone: true,
              },
            },
          },
        },
      },
    }),
    prisma.appointment.count({ where: where as Prisma.AppointmentWhereInput }),
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
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, deletedAt: null },
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

  const role = userRole?.toUpperCase?.();
  if (
    userId &&
    role !== 'ADMIN' &&
    role !== 'RECEPTIONIST' &&
    appointment.patientId !== userId &&
    appointment.doctorId !== userId
  ) {
    throw new AppError('Unauthorized', 403);
  }

  const [payment, doctorProfile] = await Promise.all([
    prisma.payment.findFirst({ where: { appointmentId }, orderBy: { createdAt: 'desc' } }),
    prisma.doctorProfile.findUnique({ where: { userId: appointment.doctorId } }),
  ]);

  const result = appointment as any;
  result.paymentStatus = payment?.status ?? 'PENDING';
  result.doctor = {
    ...result.doctor,
    specialization: doctorProfile?.specialization,
    consultationFee: doctorProfile?.consultationFee != null ? Number(doctorProfile.consultationFee) : undefined,
  };
  return result;
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
    data: data as Prisma.AppointmentUpdateInput,
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

  await checkAppointmentConflict(
    appointment.doctorId,
    newScheduledAt,
    appointment.duration || 30,
    appointmentId
  );

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      scheduledAt: newScheduledAt,
      status: 'SCHEDULED', // Keep as SCHEDULED so it shows in lists for the new date
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
      status: 'CHECKED_IN',
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

  // Automatically add to queue upon check-in
  if (updated.doctorId && updated.patientId) {
    try {
      const doctor = await prisma.user.findUnique({
        where: { id: updated.doctorId },
        select: { clinicId: true },
      });
      const { addToQueue } = await import('../queue/queue.service');
      await addToQueue({
        patientId: updated.patientId,
        doctorId: updated.doctorId,
        clinicId: doctor?.clinicId ?? undefined,
      });
    } catch (error) {
      console.error('Failed to add to queue on check-in:', error);
    }
  }

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

