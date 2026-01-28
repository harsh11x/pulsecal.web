import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/apiResponse';
import { getProfile, updateProfile } from '../users/users.service';
import { AppError } from '../../middlewares/error.middleware';
import { logger } from '../../utils/logger';
import prisma from '../../config/database';

export const getProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      logger.warn('getProfileController: No user in request');
      throw new AppError('User not authenticated', 401);
    }

    const userId: string = req.user.id;
    logger.info({ userId }, 'Fetching user profile');
    
    try {
      const userProfile = await getProfile(userId);
      logger.info({ userId }, 'Profile fetched successfully');
      sendSuccess(res, userProfile, 'Profile retrieved successfully');
    } catch (profileError: any) {
      logger.error(
        { 
          error: profileError.message, 
          stack: profileError.stack,
          userId 
        }, 
        'Error fetching profile'
      );
      throw profileError;
    }
  } catch (error: any) {
    // Enhanced error logging
    const errorInfo = {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      errorName: error.name,
      errorCode: error.code,
    };
    logger.error(errorInfo, 'Error in getProfileController');
    // Also log to console for PM2
    console.error('[getProfileController ERROR]', errorInfo);
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
      clinicId,
    } = req.body;

    logger.info({ userId, fields: Object.keys(req.body), requestedRole: role }, 'Syncing user profile');

    // Get current user to check existing role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, onboardingCompleted: true, clinicId: true },
    });

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
    // Allow setting clinicId for doctors during onboarding or if not already set
    if (clinicId !== undefined) {
      // Verify clinic exists before setting
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (clinic) {
        userUpdateData.clinicId = clinicId;
        logger.info({ userId, clinicId }, 'Setting user clinicId');
      }
    }
    
    // ROLE ENFORCEMENT: Only allow role change if:
    // 1. User has no role set yet (first time setup), OR
    // 2. User hasn't completed onboarding (still in setup phase)
    // Once onboarding is completed, role is LOCKED
    if (role && ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN'].includes(role)) {
      const currentRole = currentUser?.role;
      const hasCompletedOnboarding = currentUser?.onboardingCompleted === true;
      
      if (currentRole && hasCompletedOnboarding && currentRole !== role) {
        // User is trying to change their role after onboarding - DENY
        logger.warn(
          { userId, currentRole, requestedRole: role },
          'Attempted role change denied - user has completed onboarding'
        );
        throw new AppError(
          `Cannot change role from ${currentRole} to ${role}. Your account is registered as ${currentRole}. Please use a different account if you need a different role.`,
          403
        );
      }
      
      // Allow role set/change only if not yet onboarded
      if (!hasCompletedOnboarding) {
        userUpdateData.role = role;
        logger.info({ userId, newRole: role }, 'Role set during onboarding');
      }
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

    // Get the final role (either updated or existing)
    const finalRole = userUpdateData.role || currentUser?.role;

    // If role is DOCTOR, ensure DoctorProfile exists
    if (finalRole === 'DOCTOR') {
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

    // If role is PATIENT, ensure PatientProfile exists
    if (finalRole === 'PATIENT') {
      const existingPatientProfile = await prisma.patientProfile.findUnique({
        where: { userId },
      });

      if (!existingPatientProfile) {
        await prisma.patientProfile.create({
          data: { userId },
        });
      }
    }

    // Get updated profile
    const updatedProfile = await getProfile(userId);
    logger.info({ userId, role: updatedProfile.role }, 'Profile synced successfully');
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
