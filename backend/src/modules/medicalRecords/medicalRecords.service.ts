import prisma from '../../config/database';
import { getPaginationParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';
import { encrypt, decrypt } from '../../utils/encrypt';

const parseClinicalData = (encryptedData?: string | null) => {
  if (!encryptedData) return null;
  try {
    const raw = decrypt(encryptedData);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export type CreateMedicalRecordInput = {
  patientId?: string | null;
  patientName?: string | null;
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
  recordDate?: Date | string;
};

const displayPatientName = (record: {
  patientName?: string | null;
  patient?: { firstName?: string | null; lastName?: string | null } | null;
}) => {
  if (record.patientName?.trim()) return record.patientName.trim();
  if (record.patient) {
    return `${record.patient.firstName || ''} ${record.patient.lastName || ''}`.trim();
  }
  return 'Unknown patient';
};

export const createMedicalRecord = async (data: CreateMedicalRecordInput) => {
  const encryptedData = data.sensitiveData
    ? encrypt(data.sensitiveData)
    : null;

  const patientName =
    (data.patientName && String(data.patientName).trim()) || null;

  if (!data.patientId && !patientName) {
    throw new AppError('Patient name is required', 400);
  }

  const recordDate = data.recordDate
    ? new Date(data.recordDate)
    : new Date();

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: data.patientId || null,
      patientName,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId || null,
      recordType: data.recordType,
      title: data.title,
      description: data.description,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      encryptedData,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      recordDate: Number.isNaN(recordDate.getTime()) ? new Date() : recordDate,
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
      appointment: {
        select: {
          id: true,
          scheduledAt: true,
        },
      },
    },
  });

  return {
    ...record,
    displayPatientName: displayPatientName(record),
  };
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
    search?: string;
    appointmentId?: string;
  };
  user?: { id: string; role: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const sortByRaw = (req.query.sortBy as string) || 'recordDate';
  const sortOrder = ((req.query.sortOrder as string) || 'desc') === 'asc' ? 'asc' : 'desc';

  // Allowed sort keys — patientName for alphabetical Halaxy-style lists
  const allowedSort = new Set(['recordDate', 'patientName', 'title', 'createdAt']);
  const orderByField = allowedSort.has(sortByRaw) ? sortByRaw : 'recordDate';

  const where: any = {
    deletedAt: null,
  };

  const userRole = req.user?.role?.toUpperCase();
  const userId = req.user?.id;

  if (userRole === 'PATIENT') {
    where.patientId = userId;
  } else if (userRole === 'DOCTOR') {
    where.doctorId = userId;
  } else if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
    where.patientId = 'non-existent';
  }

  if (req.query.patientId && userRole !== 'PATIENT') {
    where.patientId = req.query.patientId as string;
  }

  if (req.query.doctorId && userRole !== 'DOCTOR') {
    where.doctorId = req.query.doctorId as string;
  }

  if (req.query.recordType) {
    where.recordType = req.query.recordType as string;
  }

  if (req.query.appointmentId) {
    where.appointmentId = req.query.appointmentId as string;
  }

  if (req.query.search) {
    const q = String(req.query.search).trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { diagnosis: { contains: q, mode: 'insensitive' } },
        { patientName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }
  }

  // Secondary sort keeps lists stable (date within same name, etc.)
  const orderBy =
    orderByField === 'patientName'
      ? [{ patientName: sortOrder as 'asc' | 'desc' }, { recordDate: 'desc' as const }]
      : orderByField === 'recordDate'
        ? [{ recordDate: sortOrder as 'asc' | 'desc' }, { patientName: 'asc' as const }]
        : [{ [orderByField]: sortOrder as 'asc' | 'desc' }];

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
          },
        },
      },
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  return {
    records: records.map((r) => ({
      ...r,
      displayPatientName: displayPatientName(r),
      visitDate: r.recordDate,
    })),
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
          phone: true,
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

  const role = userRole?.toUpperCase();
  if (
    userId &&
    role !== 'ADMIN' &&
    role !== 'DOCTOR' &&
    role !== 'RECEPTIONIST' &&
    record.patientId !== userId
  ) {
    throw new AppError('Unauthorized', 403);
  }

  if (role === 'DOCTOR' && record.doctorId && record.doctorId !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  const clinicalData = parseClinicalData(record.encryptedData);

  return {
    ...record,
    displayPatientName: displayPatientName(record),
    visitDate: record.recordDate,
    clinicalData,
    // Convenience fields for edit forms
    notes: clinicalData?.notes ?? record.description ?? null,
    symptoms: clinicalData?.symptoms ?? null,
    vitalSigns: clinicalData?.vitalSigns ?? null,
    bloodGroup: clinicalData?.bloodGroup ?? null,
    prescribedMedicines: clinicalData?.prescribedMedicines ?? [],
    medicalTests: clinicalData?.medicalTests ?? [],
  };
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
    patientName?: string;
    patientId?: string | null;
    recordDate?: Date | string;
  }
) => {
  const existing = await prisma.medicalRecord.findFirst({
    where: { id: recordId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError('Medical record not found', 404);
  }

  const { sensitiveData, recordDate, patientId, ...rest } = data;

  const updateData: any = { ...rest };

  if (patientId !== undefined) {
    updateData.patientId = patientId || null;
  }

  if (sensitiveData !== undefined && sensitiveData !== null) {
    updateData.encryptedData = encrypt(sensitiveData);
  }

  if (recordDate) {
    const d = new Date(recordDate);
    if (!Number.isNaN(d.getTime())) updateData.recordDate = d;
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
          phone: true,
        },
      },
    },
  });

  return {
    ...record,
    displayPatientName: displayPatientName(record),
  };
};

export const deleteMedicalRecord = async (recordId: string) => {
  await prisma.medicalRecord.update({
    where: { id: recordId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Medical record deleted successfully' };
};
