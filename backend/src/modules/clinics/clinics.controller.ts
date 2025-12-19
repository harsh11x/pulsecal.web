import { Response, NextFunction } from 'express';
import {
  createClinic,
  getClinics,
  getClinicById,
  updateClinic,
  deleteClinic,
} from './clinics.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const clinicSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  country: Joi.string().optional(),
  phone: Joi.string().required(),
  email: Joi.string().email().optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
});

export const createClinicController = async (
  req: never,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = clinicSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const clinic = await createClinic(value);
    sendSuccess(res, clinic, 'Clinic created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getClinicsController = async (
  req: never,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getClinics(req);
    sendPaginated(
      res,
      result.clinics,
      result.pagination,
      'Clinics retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getClinicByIdController = async (
  req: never,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clinic = await getClinicById(req.params.id);
    sendSuccess(res, clinic, 'Clinic retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateClinicController = async (
  req: never,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = clinicSchema.partial().validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const clinic = await updateClinic(req.params.id, value);
    sendSuccess(res, clinic, 'Clinic updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteClinicController = async (
  req: never,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteClinic(req.params.id);
    sendSuccess(res, result, 'Clinic deleted successfully');
  } catch (err) {
    next(err);
  }
};

