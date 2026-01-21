import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';
import { encrypt } from '../../utils/encrypt';

export const createMedicalRecord = async (data: {
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  recordType: string;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  sensitiveData?: string;
  fileUrl?: string;
  fileName?: string;
}) => {
  const encryptedData = data.sensitiveData
    ? encrypt(data.sensitiveData)
    : null;

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId,
      recordType: data.recordType,
      title: data.title,
      description: data.description,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      encryptedData,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
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

  return record;
};

export const getMedicalRecords = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    patientId?: string;
    doctorId?: string;
    recordType?: string;
  };
  user?: { id: string; role: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    patientId?: string;
    doctorId?: string;
    recordType?: string;
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

  if (req.query.recordType) {
    where.recordType = req.query.recordType;
  }

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
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
    prisma.medicalRecord.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getMedicalRecordById = async (
  recordId: string,
  userId?: string,
  userRole?: string
) => {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
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

  if (!record) {
    throw new AppError('Medical record not found', 404);
  }

  if (
    userId &&
    userRole !== 'ADMIN' &&
    userRole !== 'DOCTOR' &&
    userRole !== 'RECEPTIONIST' &&
    record.patientId !== userId
  ) {
    throw new AppError('Unauthorized', 403);
  }

  return record;
};

export const updateMedicalRecord = async (
  recordId: string,
  data: {
    title?: string;
    description?: string;
    diagnosis?: string;
    treatment?: string;
    sensitiveData?: string;
    fileUrl?: string;
    fileName?: string;
  },
  user?: { id: string; role: string }
) => {
  // Check permission
  const existingRecord = await prisma.medicalRecord.findUnique({ where: { id: recordId } });

  if (!existingRecord) {
    throw new AppError('Medical record not found', 404);
  }

  if (user && user.role !== 'ADMIN' && existingRecord.doctorId !== user.id) {
    throw new AppError('Unauthorized to update this record', 403);
  }

  const { sensitiveData, ...rest } = data;

  const updateData: {
    title?: string;
    description?: string;
    diagnosis?: string;
    treatment?: string;
    encryptedData?: string | null;
    fileUrl?: string;
    fileName?: string;
  } = { ...rest };

  if (sensitiveData) {
    updateData.encryptedData = encrypt(sensitiveData);
  }

  const record = await prisma.medicalRecord.update({
    where: { id: recordId },
    data: updateData,
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

  return record;
};

export const deleteMedicalRecord = async (
  recordId: string,
  user?: { id: string; role: string }
) => {
  // Check permission
  const existingRecord = await prisma.medicalRecord.findUnique({ where: { id: recordId } });

  if (!existingRecord) {
    throw new AppError('Medical record not found', 404);
  }

  if (user && user.role !== 'ADMIN' && existingRecord.doctorId !== user.id) {
    throw new AppError('Unauthorized to delete this record', 403);
  }

  await prisma.medicalRecord.update({
    where: { id: recordId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Medical record deleted successfully' };
};

