import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';

export const getAuditLogs = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    userId?: string;
    action?: string;
    resourceType?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (req.query.userId) {
    where.userId = req.query.userId;
  }

  if (req.query.action) {
    where.action = req.query.action as 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  }

  if (req.query.resourceType) {
    where.resourceType = req.query.resourceType;
  }

  if (req.query.startDate || req.query.endDate) {
    where.createdAt = {};
    if (req.query.startDate) {
      where.createdAt.gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      where.createdAt.lte = new Date(req.query.endDate);
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSystemStats = async () => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAppointments,
    activeAppointments,
    totalMedicalRecords,
    totalPrescriptions,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: 'PATIENT', deletedAt: null } }),
    prisma.user.count({ where: { role: 'DOCTOR', deletedAt: null } }),
    prisma.appointment.count({ where: { deletedAt: null } }),
    prisma.appointment.count({
      where: {
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        deletedAt: null,
      },
    }),
    prisma.medicalRecord.count({ where: { deletedAt: null } }),
    prisma.prescription.count({ where: { deletedAt: null } }),
  ]);

  return {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAppointments,
    activeAppointments,
    totalMedicalRecords,
    totalPrescriptions,
  };
};

