import { Response, NextFunction, Request } from 'express';
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
  req: Request,
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
  req: Request,
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
  req: Request,
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Create a new schema where all keys are optional for update
    const updateSchema = Joi.object({
      name: Joi.string().optional(),
      address: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      country: Joi.string().optional(),
      phone: Joi.string().optional(),
      email: Joi.string().email().optional(),
      website: Joi.string().uri().optional().allow(''),
      description: Joi.string().optional().allow(''),
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
    }).min(1);

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Access Control: Only Admin or the Clinic Owner (Doctor) can update
    // Assuming req.user is populated by auth middleware
    if (req.user?.role !== 'ADMIN') {
        if (req.user?.clinicId !== req.params.id) {
             throw new AppError('You do not have permission to update this clinic', 403);
        }
    }

    const clinic = await updateClinic(req.params.id, value);
    sendSuccess(res, clinic, 'Clinic updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteClinicController = async (
  req: Request,
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

