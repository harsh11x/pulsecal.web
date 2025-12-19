import { Response, NextFunction } from 'express';
import {
  syncUserProfile,
  getUserProfile,
  updateUserRole,
} from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const syncProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  profileImage: Joi.string().optional(),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN').required(),
});

export const syncProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = syncProfileSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const profile = await syncUserProfile(req.user.firebaseUid, value);
    sendSuccess(res, profile, 'Profile synced successfully');
  } catch (err) {
    next(err);
  }
};

export const getProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const profile = await getUserProfile(req.user.firebaseUid);
    sendSuccess(res, profile, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateRoleController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const user = await updateUserRole(req.params.firebaseUid || req.user.firebaseUid, value.role);
    sendSuccess(res, user, 'User role updated successfully');
  } catch (err) {
    next(err);
  }
};
