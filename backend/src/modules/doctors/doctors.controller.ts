import { Response, NextFunction } from 'express';
import { searchDoctors, getDoctorById, getDoctorAvailability } from './doctors.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';

export const searchDoctorsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radius,
      specialization,
      name,
      clinicName,
      minFee,
      maxFee,
      city,
      page,
      limit,
    } = req.query;

    const result = await searchDoctors({
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      radius: radius ? parseFloat(radius as string) : undefined,
      specialization: specialization as string,
      name: name as string,
      clinicName: clinicName as string,
      minFee: minFee ? parseFloat(minFee as string) : undefined,
      maxFee: maxFee ? parseFloat(maxFee as string) : undefined,
      city: city as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    sendSuccess(res, result, 'Doctors retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getDoctorByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await getDoctorById(id);
    sendSuccess(res, doctor, 'Doctor retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getDoctorAvailabilityController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      throw new AppError('Date parameter is required', 400);
    }

    const availability = await getDoctorAvailability(id, new Date(date as string));
    sendSuccess(res, availability, 'Availability retrieved successfully');
  } catch (err) {
    next(err);
  }
};

