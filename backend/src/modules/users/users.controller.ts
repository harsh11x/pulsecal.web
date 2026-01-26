import { Request, Response, NextFunction } from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  createUser,
} from './users.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import { logger } from '../../utils/logger';
import Joi from 'joi';

const createUserSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN').required(),
  clinicId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  isEmailVerified: Joi.boolean().optional(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional(),
  phone: Joi.string().allow('', null).optional(),
  dateOfBirth: Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)).optional(),
  profileImage: Joi.string().allow('', null).optional(),
  clinicAddress: Joi.string().allow('', null).optional(),
  specialization: Joi.string().allow('', null).optional(),
  bio: Joi.string().allow('', null).optional(),
  consultationFee: Joi.number().allow(null).optional(),
  services: Joi.array().items(Joi.string()).optional(),
  workingHours: Joi.object().unknown(true).optional(),
  clinicName: Joi.string().allow('', null).optional(),
});

export const createUserController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    logger.info({ creatorId: req.user?.id, newUserRole: value.role }, 'Creating new user');

    // Role-based security check
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'DOCTOR') {
      if (value.role === 'ADMIN' || value.role === 'DOCTOR') {
        if (req.user?.role !== 'ADMIN' && value.role === 'ADMIN') {
          throw new AppError('Unauthorized to create Admin user', 403);
        }
      }
    }

    // Force clinicId if creator is a doctor/staff
    if (req.user?.clinicId && !value.clinicId) {
      value.clinicId = req.user.clinicId;
    }

    const user = await createUser(value);
    logger.info({ userId: user.id }, 'User created successfully');
    sendSuccess(res, user, 'User created successfully', 201);
  } catch (err: any) {
    logger.error({ error: err.message, stack: err.stack }, 'Error in createUserController');
    next(err);
  }
};

export const getProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('User not authenticated', 401);
    }
    const profile = await getProfile(req.user.id);
    sendSuccess(res, profile, 'Profile retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message, userId: req.user?.id }, 'Error in getProfileController');
    next(err);
  }
};

export const updateProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('User not authenticated', 401);
    }
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    
    logger.info({ userId: req.user.id, fields: Object.keys(value) }, 'Updating profile');
    const profile = await updateProfile(req.user.id, value);
    logger.info({ userId: req.user.id }, 'Profile updated successfully');
    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (err: any) {
    logger.error({ error: err.message, userId: req.user?.id }, 'Error in updateProfileController');
    next(err);
  }
};

export const getAllUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAllUsers(req);
    sendPaginated(
      res,
      result.data,
      result.pagination,
      'Users retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getUserByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getUserById(req.params.id);
    sendSuccess(res, user, 'User retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateUserStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { isActive } = req.body;
    const user = await updateUserStatus(req.params.id, isActive);
    sendSuccess(res, user, 'User status updated successfully');
  } catch (err) {
    next(err);
  }
};
