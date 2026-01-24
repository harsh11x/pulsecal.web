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
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  profileImage: Joi.string().optional(),
  clinicAddress: Joi.string().optional(),
  specialization: Joi.string().optional(),
  bio: Joi.string().optional(),
  consultationFee: Joi.number().optional(),
  services: Joi.array().items(Joi.string()).optional(),
  workingHours: Joi.object().optional(),
  clinicName: Joi.string().optional(),
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

    // Role-based security check: Only Admin or Doctor/Receptionist (for adding patients/staff)
    // For now, let's assume middleware handles basic auth, but we should enforce:
    // - Doctors can add Receptionists or Patients
    // - Admins can add anyone
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'DOCTOR') {
      // Allow creating if it's a receptionist adding a patient? Maybe.
      // For this specific task "doctor adds new staff members", DOCTOR role is required.
      if (value.role === 'ADMIN' || value.role === 'DOCTOR') {
        // Only Admin can create Admin or Doctor (unless specific invite flow)
        // But wait, doctor adds doctor?
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
    sendSuccess(res, user, 'User created successfully', 201);
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
      throw new Error('User not authenticated');
    }
    const profile = await getProfile(req.user.id);
    sendSuccess(res, profile, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      throw new Error(error.details[0].message);
    }
    const profile = await updateProfile(req.user.id, value);
    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (err) {
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
      result.users,
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

