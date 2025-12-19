import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

export const createEmergencyContact = async (data: {
  patientId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
}) => {
  if (data.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { patientId: data.patientId },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.emergencyContact.create({
    data,
  });

  return contact;
};

export const getEmergencyContacts = async (patientId: string) => {
  const contacts = await prisma.emergencyContact.findMany({
    where: {
      patientId,
      deletedAt: null,
    },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  return contacts;
};

export const getEmergencyContactById = async (contactId: string) => {
  const contact = await prisma.emergencyContact.findUnique({
    where: { id: contactId },
  });

  if (!contact) {
    throw new AppError('Emergency contact not found', 404);
  }

  return contact;
};

export const updateEmergencyContact = async (
  contactId: string,
  data: {
    firstName?: string;
    lastName?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
  }
) => {
  const contact = await prisma.emergencyContact.findUnique({
    where: { id: contactId },
  });

  if (data.isPrimary && contact) {
    await prisma.emergencyContact.updateMany({
      where: {
        patientId: contact.patientId,
        id: { not: contactId },
      },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.emergencyContact.update({
    where: { id: contactId },
    data,
  });

  return updated;
};

export const deleteEmergencyContact = async (contactId: string) => {
  await prisma.emergencyContact.update({
    where: { id: contactId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Emergency contact deleted successfully' };
};

