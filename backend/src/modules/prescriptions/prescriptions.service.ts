import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';

export const createPrescription = async (data: {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  quantity: number;
  refills: number;
  instructions?: string;
  expiresAt?: Date;
}) => {
  const prescription = await prisma.prescription.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId,
      medicationName: data.medicationName,
      dosage: data.dosage,
      frequency: data.frequency,
      quantity: data.quantity,
      refills: data.refills,
      instructions: data.instructions,
      expiresAt: data.expiresAt,
      status: 'ACTIVE',
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

  return prescription;
};

export const getPrescriptions = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    patientId?: string;
    doctorId?: string;
    status?: string;
  };
  user?: { id: string; role: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    patientId?: string;
    doctorId?: string;
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

  if (req.query.doctorId) {
    where.doctorId = req.query.doctorId;
  }

  if (req.query.status) {
    where.status = req.query.status;
  }

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
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
          },
        },
      },
    }),
    prisma.prescription.count({ where }),
  ]);

  return {
    prescriptions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPrescriptionById = async (
  prescriptionId: string,
  userId?: string,
  userRole?: string
) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      appointment: {
        select: {
          id: true,
          scheduledAt: true,
        },
      },
    },
  });

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  if (
    userId &&
    userRole !== 'ADMIN' &&
    userRole !== 'DOCTOR' &&
    prescription.patientId !== userId
  ) {
    throw new AppError('Unauthorized', 403);
  }

  return prescription;
};

export const requestRefill = async (prescriptionId: string) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
  });

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  if (prescription.status === 'CANCELLED') {
    throw new AppError('Cannot refill cancelled prescription', 400);
  }

  if (prescription.refills <= 0) {
    throw new AppError('No refills remaining', 400);
  }

  const updated = await prisma.prescription.update({
    where: { id: prescriptionId },
    data: {
      status: 'REFILL_REQUESTED',
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

  return updated;
};

export const updatePrescription = async (
  prescriptionId: string,
  data: {
    medicationName?: string;
    dosage?: string;
    frequency?: string;
    quantity?: number;
    refills?: number;
    instructions?: string;
    status?: string;
  }
) => {
  const prescription = await prisma.prescription.update({
    where: { id: prescriptionId },
    data,
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

  return prescription;
};

export const deletePrescription = async (prescriptionId: string) => {
  await prisma.prescription.update({
    where: { id: prescriptionId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Prescription deleted successfully' };
};

