import { Response, NextFunction } from 'express';
import {
  createEmergencyContact,
  getEmergencyContacts,
  getEmergencyContactById,
  updateEmergencyContact,
  deleteEmergencyContact,
} from './emergencyContacts.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const contactSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  relationship: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().optional(),
  address: Joi.string().optional(),
  isPrimary: Joi.boolean().optional(),
});

export const createEmergencyContactController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = contactSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const contact = await createEmergencyContact({
      patientId: req.user.id,
      ...value,
    });
    sendSuccess(res, contact, 'Emergency contact created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getEmergencyContactsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const contacts = await getEmergencyContacts(req.user.id);
    sendSuccess(res, contacts, 'Emergency contacts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getEmergencyContactByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const contact = await getEmergencyContactById(req.params.id);
    sendSuccess(res, contact, 'Emergency contact retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateEmergencyContactController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = contactSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const contact = await updateEmergencyContact(req.params.id, value);
    sendSuccess(res, contact, 'Emergency contact updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteEmergencyContactController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteEmergencyContact(req.params.id);
    sendSuccess(res, result, 'Emergency contact deleted successfully');
  } catch (err) {
    next(err);
  }
};

