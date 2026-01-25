import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/apiResponse';
import { getProfile, updateProfile } from '../users/users.service';
import { AppError } from '../../middlewares/error.middleware';
import { logger } from '../../utils/logger';

export const getProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('User not authenticated', 401);
    }

    const userId: string = req.user.id;
    logger.info({ userId }, 'Fetching user profile');
    
    const userProfile = await getProfile(userId);
    
    sendSuccess(res, userProfile, 'Profile retrieved successfully');
  } catch (error: any) {
    logger.error(
      { 
        error: error.message, 
        stack: error.stack,
        userId: req.user?.id 
      }, 
      'Error in getProfileController'
    );
    next(error);
  }
};

export const syncProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('User not authenticated', 401);
    }

    const userId: string = req.user.id;
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      profileImage,
      role,
      onboardingCompleted,
    } = req.body;

    logger.info({ userId, fields: Object.keys(req.body) }, 'Syncing user profile');

    // Update User table fields
    const userUpdateData: Record<string, any> = {};
    if (firstName !== undefined) userUpdateData.firstName = firstName;
    if (lastName !== undefined) userUpdateData.lastName = lastName;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (dateOfBirth !== undefined) {
      userUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (profileImage !== undefined) userUpdateData.profileImage = profileImage;
    if (typeof onboardingCompleted === 'boolean') {
      userUpdateData.onboardingCompleted = onboardingCompleted;
    }
    if (role && ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN'].includes(role)) {
      userUpdateData.role = role;
    }

    // Update user if there's data to update
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // Update profile-specific fields
    const profileUpdateData: Record<string, any> = {};
    if (phone !== undefined) profileUpdateData.phone = phone;
    if (dateOfBirth !== undefined) {
      profileUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (profileImage !== undefined) profileUpdateData.profileImage = profileImage;

    if (Object.keys(profileUpdateData).length > 0) {
      await updateProfile(userId, profileUpdateData);
    }

    // If role is DOCTOR, ensure DoctorProfile exists
    if (role === 'DOCTOR') {
      const existingDoctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId },
      });

      if (!existingDoctorProfile) {
        await prisma.doctorProfile.create({
          data: {
            userId,
            licenseNumber: `LIC-${userId.substring(0, 8)}`,
            specialization: 'General',
            consultationFee: 0,
          },
        });
      }
    }

    // Get updated profile
    const updatedProfile = await getProfile(userId);
    sendSuccess(res, updatedProfile, 'Profile synced successfully');
  } catch (error: any) {
    logger.error(
      { 
        error: error.message, 
        stack: error.stack,
        userId: req.user?.id 
      }, 
      'Error in syncProfileController'
    );
    next(error);
  }
};
