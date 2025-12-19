import { Request, Response, NextFunction } from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
} from './users.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import Joi from 'joi';

const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  profileImage: Joi.string().optional(),
});

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

