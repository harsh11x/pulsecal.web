import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import admin from '../../config/firebase';
import { logger } from '../../utils/logger';

// Sync user profile from Firebase
export const syncUserProfile = async (firebaseUid: string, data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  profileImage?: string;
}) => {
  // Use findUnique since firebaseUid is unique
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
  });

  if (!user) {
    logger.warn(`User not found for firebaseUid: ${firebaseUid}`);
    throw new AppError('User not found. Please try signing in again.', 404);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName || user.firstName,
      lastName: data.lastName || user.lastName,
      phone: data.phone || user.phone,
      dateOfBirth: data.dateOfBirth || user.dateOfBirth,
      profileImage: data.profileImage || user.profileImage,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      role: true,
      profileImage: true,
      isEmailVerified: true,
      createdAt: true,
      patientProfile: true,
      doctorProfile: true,
    },
  });

  return updated;
};

// Get user profile
export const getUserProfile = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      role: true,
      isEmailVerified: true,
      profileImage: true,
      createdAt: true,
      patientProfile: true,
      doctorProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

// Update user role (admin only, via Firebase custom claims)
export const updateUserRole = async (
  firebaseUid: string,
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN'
) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update Firebase custom claims
  try {
    await admin.auth().setCustomUserClaims(firebaseUid, { role });
  } catch (error) {
    logger.error('Error updating Firebase custom claims:', error);
    throw new AppError('Failed to update user role in Firebase', 500);
  }

  // Update database
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role },
    select: {
      id: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: user.id,
      description: `User role updated to ${role}`,
    },
  });

  return updated;
};
