import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';

export const createReminder = async (data: {
  patientId: string;
  prescriptionId?: string;
  type: string;
  title: string;
  description?: string;
  scheduledAt: Date;
}) => {
  const reminder = await prisma.reminder.create({
    data: {
      patientId: data.patientId,
      prescriptionId: data.prescriptionId,
      type: data.type as 'MEDICATION' | 'APPOINTMENT' | 'TEST' | 'GENERAL',
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      status: 'PENDING',
    },
  });

  return reminder;
};

export const getReminders = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    patientId?: string;
    type?: string;
    status?: string;
  };
  user?: { id: string; role: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    patientId?: string;
    type?: string;
    status?: string;
    deletedAt?: null;
  } = {
    deletedAt: null,
  };

  if (req.user?.role === 'PATIENT') {
    where.patientId = req.user.id;
  } else if (req.query.patientId) {
    where.patientId = req.query.patientId;
  }

  if (req.query.type) {
    where.type = req.query.type;
  }

  if (req.query.status) {
    where.status = req.query.status;
  }

  const [reminders, total] = await Promise.all([
    prisma.reminder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
    }),
    prisma.reminder.count({ where }),
  ]);

  return {
    reminders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getReminderById = async (reminderId: string) => {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
  });

  if (!reminder) {
    throw new AppError('Reminder not found', 404);
  }

  return reminder;
};

export const updateReminder = async (
  reminderId: string,
  data: {
    title?: string;
    description?: string;
    scheduledAt?: Date;
    status?: string;
  }
) => {
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    data,
  });

  return reminder;
};

export const markReminderCompleted = async (reminderId: string) => {
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  return reminder;
};

export const deleteReminder = async (reminderId: string) => {
  await prisma.reminder.update({
    where: { id: reminderId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Reminder deleted successfully' };
};

