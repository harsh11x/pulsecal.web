import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { encrypt } from '../../utils/encrypt';

export const createOrUpdateInsurance = async (data: {
  patientId: string;
  providerName: string;
  policyNumber: string;
  groupNumber?: string;
  sensitiveData?: string;
  coverageStartDate?: Date;
  coverageEndDate?: Date;
}) => {
  const encryptedData = data.sensitiveData
    ? encrypt(data.sensitiveData)
    : null;

  const insurance = await prisma.insurance.upsert({
    where: { patientId: data.patientId },
    update: {
      providerName: data.providerName,
      policyNumber: data.policyNumber,
      groupNumber: data.groupNumber,
      encryptedData,
      coverageStartDate: data.coverageStartDate,
      coverageEndDate: data.coverageEndDate,
    },
    create: {
      patientId: data.patientId,
      providerName: data.providerName,
      policyNumber: data.policyNumber,
      groupNumber: data.groupNumber,
      encryptedData,
      coverageStartDate: data.coverageStartDate,
      coverageEndDate: data.coverageEndDate,
    },
  });

  return insurance;
};

export const getInsurance = async (patientId: string) => {
  const insurance = await prisma.insurance.findUnique({
    where: { patientId },
  });

  if (!insurance) {
    throw new AppError('Insurance not found', 404);
  }

  return insurance;
};

export const deleteInsurance = async (patientId: string) => {
  await prisma.insurance.update({
    where: { patientId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Insurance deleted successfully' };
};

