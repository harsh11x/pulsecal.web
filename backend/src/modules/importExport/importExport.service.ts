import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { generateToken } from '../../utils/encrypt';

export const exportUserData = async (
  userId: string,
  exportType: string = 'all_data'
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const data: Record<string, unknown> = {
    user,
  };

  if (exportType === 'all_data' || exportType === 'appointments') {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: userId,
        deletedAt: null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    data.appointments = appointments;
  }

  if (exportType === 'all_data' || exportType === 'medical_records') {
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: {
        patientId: userId,
        deletedAt: null,
      },
    });
    data.medicalRecords = medicalRecords;
  }

  if (exportType === 'all_data' || exportType === 'prescriptions') {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: userId,
        deletedAt: null,
      },
    });
    data.prescriptions = prescriptions;
  }

  const fileUrl = `/exports/${userId}-${Date.now()}.json`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.dataExport.create({
    data: {
      userId,
      exportType,
      fileUrl,
      status: 'completed',
      expiresAt,
      completedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'EXPORT',
      resourceType: 'UserData',
      resourceId: userId,
      description: `Data export: ${exportType}`,
    },
  });

  return {
    data,
    fileUrl,
    expiresAt,
  };
};

export const getExportHistory = async (userId: string) => {
  const exports = await prisma.dataExport.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return exports;
};

export const deleteExport = async (exportId: string, userId: string) => {
  const exportRecord = await prisma.dataExport.findUnique({
    where: { id: exportId },
  });

  if (!exportRecord || exportRecord.userId !== userId) {
    throw new AppError('Export not found', 404);
  }

  await prisma.dataExport.delete({
    where: { id: exportId },
  });

  return { message: 'Export deleted successfully' };
};

