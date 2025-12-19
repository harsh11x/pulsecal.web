import { Response, NextFunction } from 'express';
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  requestRefill,
  updatePrescription,
  deletePrescription,
} from './prescriptions.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const createPrescriptionSchema = Joi.object({
  patientId: Joi.string().required(),
  doctorId: Joi.string().required(),
  appointmentId: Joi.string().optional(),
  medicationName: Joi.string().required(),
  dosage: Joi.string().required(),
  frequency: Joi.string().required(),
  quantity: Joi.number().required(),
  refills: Joi.number().default(0),
  instructions: Joi.string().optional(),
  expiresAt: Joi.date().optional(),
});

const updatePrescriptionSchema = Joi.object({
  medicationName: Joi.string().optional(),
  dosage: Joi.string().optional(),
  frequency: Joi.string().optional(),
  quantity: Joi.number().optional(),
  refills: Joi.number().optional(),
  instructions: Joi.string().optional(),
  status: Joi.string().optional(),
});

export const createPrescriptionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createPrescriptionSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const prescription = await createPrescription(value);
    sendSuccess(res, prescription, 'Prescription created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getPrescriptions({
      ...req,
      user: req.user,
    });
    sendPaginated(
      res,
      result.prescriptions,
      result.pagination,
      'Prescriptions retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const prescription = await getPrescriptionById(
      req.params.id,
      req.user?.id,
      req.user?.role
    );
    sendSuccess(res, prescription, 'Prescription retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const requestRefillController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const prescription = await requestRefill(req.params.id);
    sendSuccess(res, prescription, 'Refill requested successfully');
  } catch (err) {
    next(err);
  }
};

export const updatePrescriptionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = updatePrescriptionSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const prescription = await updatePrescription(req.params.id, value);
    sendSuccess(res, prescription, 'Prescription updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deletePrescriptionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deletePrescription(req.params.id);
    sendSuccess(res, result, 'Prescription deleted successfully');
  } catch (err) {
    next(err);
  }
};

