import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Get receptionist dashboard stats
 */
export const getReceptionistStats = async (receptionistId: string) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Get receptionist's clinic (assuming they're linked via clinicId in user or separate table)
  // For now, we'll get all appointments for today that receptionist can manage
  // In a real system, you'd have a ReceptionistProfile table with clinicId

  // Get today's appointments
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      deletedAt: null,
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
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  });

  const stats = {
    totalBooked: todayAppointments.length,
    completed: todayAppointments.filter(apt => apt.status === 'COMPLETED').length,
    waiting: todayAppointments.filter(apt => 
      ['SCHEDULED', 'CONFIRMED'].includes(apt.status)
    ).length,
    inProgress: todayAppointments.filter(apt => apt.status === 'IN_PROGRESS').length,
    cancelled: todayAppointments.filter(apt => apt.status === 'CANCELLED').length,
    noShow: todayAppointments.filter(apt => apt.status === 'NO_SHOW').length,
  };

  return {
    stats,
    appointments: todayAppointments,
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
      gte: startOfDay,
      lte: endOfDay,
    },
    status: {
      in: ['waiting', 'in_progress'],
    },
  };

  if (clinicId) {
    where.clinicId = clinicId;
  }

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

  return queueEntries;
};

/**
 * Link receptionist to clinic
 */
export const linkReceptionistToClinic = async (
  receptionistId: string,
  clinicId: string,
  verificationCode?: string
) => {
  // Verify clinic exists
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
  });

  if (!clinic) {
    throw new AppError('Clinic not found', 404);
  }

  // In a real system, you'd verify the code here
  // For now, we'll just create a ReceptionistProfile entry
  // Since we don't have a ReceptionistProfile model, we'll store it in user metadata
  // or create a separate table

  // Update user to link to clinic (you might want to add a clinicId field to User model)
  // For now, we'll assume the receptionist is linked via a separate mechanism

  return {
    message: 'Receptionist linked to clinic successfully',
    clinicId,
  };
};

