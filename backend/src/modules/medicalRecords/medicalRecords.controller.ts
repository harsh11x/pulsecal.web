import { Response, NextFunction } from 'express';
import {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
} from './medicalRecords.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const createRecordSchema = Joi.object({
  patientId: Joi.string().required(),
  doctorId: Joi.string().optional(),
  appointmentId: Joi.string().optional(),
  recordType: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  diagnosis: Joi.string().optional(),
  treatment: Joi.string().optional(),
  sensitiveData: Joi.string().optional(),
  fileUrl: Joi.string().optional(),
  fileName: Joi.string().optional(),
});

const updateRecordSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  diagnosis: Joi.string().optional(),
  treatment: Joi.string().optional(),
  sensitiveData: Joi.string().optional(),
  fileUrl: Joi.string().optional(),
  fileName: Joi.string().optional(),
});

export const createMedicalRecordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createRecordSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const record = await createMedicalRecord({
      ...value,
      doctorId: value.doctorId || req.user.id,
    });
    sendSuccess(res, record, 'Medical record created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getMedicalRecordsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getMedicalRecords({
      ...req,
      user: req.user,
    });
    sendPaginated(
      res,
      result.records,
      result.pagination,
      'Medical records retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getMedicalRecordByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const record = await getMedicalRecordById(
      req.params.id,
      req.user?.id,
      req.user?.role
    );
    sendSuccess(res, record, 'Medical record retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateMedicalRecordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = updateRecordSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const record = await updateMedicalRecord(req.params.id, value);
    sendSuccess(res, record, 'Medical record updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteMedicalRecordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteMedicalRecord(req.params.id);
    sendSuccess(res, result, 'Medical record deleted successfully');
  } catch (err) {
    next(err);
  }
};

