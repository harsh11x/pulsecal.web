import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';

export const createHealthMetric = async (data: {
  patientId: string;
  metricType: string;
  value: number;
  unit?: string;
  notes?: string;
  recordedAt?: Date;
}) => {
  const metric = await prisma.healthAnalytics.create({
    data: {
      patientId: data.patientId,
      metricType: data.metricType,
      value: data.value,
      unit: data.unit,
      notes: data.notes,
      recordedAt: data.recordedAt || new Date(),
    },
  });

  return metric;
};

export const getHealthMetrics = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    patientId?: string;
    metricType?: string;
    startDate?: string;
    endDate?: string;
  };
  user?: { id: string; role: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    patientId?: string;
    metricType?: string;
    recordedAt?: { gte?: Date; lte?: Date };
    deletedAt?: null;
  } = {
    deletedAt: null,
  };

  if (req.user?.role === 'PATIENT') {
    where.patientId = req.user.id;
  } else if (req.query.patientId) {
    where.patientId = req.query.patientId;
  }

  if (req.query.metricType) {
    where.metricType = req.query.metricType;
  }

  if (req.query.startDate || req.query.endDate) {
    where.recordedAt = {};
    if (req.query.startDate) {
      where.recordedAt.gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      where.recordedAt.lte = new Date(req.query.endDate);
    }
  }

  const [metrics, total] = await Promise.all([
    prisma.healthAnalytics.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
    }),
    prisma.healthAnalytics.count({ where }),
  ]);

  return {
    metrics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getHealthMetricById = async (metricId: string) => {
  const metric = await prisma.healthAnalytics.findUnique({
    where: { id: metricId },
  });

  if (!metric) {
    throw new AppError('Health metric not found', 404);
  }

  return metric;
};

export const updateHealthMetric = async (
  metricId: string,
  data: {
    value?: number;
    unit?: string;
    notes?: string;
    recordedAt?: Date;
  }
) => {
  const metric = await prisma.healthAnalytics.update({
    where: { id: metricId },
    data,
  });

  return metric;
};

export const deleteHealthMetric = async (metricId: string) => {
  await prisma.healthAnalytics.update({
    where: { id: metricId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Health metric deleted successfully' };
};

