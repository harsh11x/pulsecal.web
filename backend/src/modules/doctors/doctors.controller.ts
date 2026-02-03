import { Response, NextFunction } from 'express';
import { searchDoctors, getDoctorById, getDoctorAvailability, getDoctorSlots } from './doctors.service';
import { getDoctorAnalytics } from './doctors.analytics.service';
import { getClinicStaff } from './doctors.staff.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export const updateScheduleController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { date, workingHours, slotDuration, blockedSlots } = req.body;

    if (!date || !workingHours) {
      throw new AppError('Date and workingHours are required', 400);
    }

    logger.info({ userId, date }, 'Updating doctor schedule');

    // Fetch existing profile
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError('Doctor profile not found', 404);
    }

    // Update workingHours
    const currentWorkingHours = (profile.workingHours as any) || {};
    
    // Determine day of week from date
    const dateObj = new Date(date);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dateObj.getDay()];

    const updatedData = {
        ...currentWorkingHours,
        [dayName]: {
            start: workingHours.start,
            end: workingHours.end,
            isOpen: true
        },
        exceptions: {
            ...(currentWorkingHours.exceptions || {}),
            [date]: blockedSlots || []
        },
        defaultSettings: {
            workingHours,
            slotDuration: slotDuration || 30
        }
    };

    await prisma.doctorProfile.update({
        where: { userId },
        data: {
            workingHours: updatedData
        }
    });

    logger.info({ userId }, 'Schedule updated successfully');
    sendSuccess(res, { workingHours: updatedData }, 'Schedule updated successfully');
  } catch (err: any) {
    logger.error({ error: err.message, userId: req.user?.id }, 'Error in updateScheduleController');
    next(err);
  }
};

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
      services,
      search,
      reason,
    } = req.query;

    const result = await searchDoctors({
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      radius: radius ? parseFloat(radius as string) : 10,
      specialization: specialization as string,
      name: name as string,
      clinicName: clinicName as string,
      minFee: minFee ? parseFloat(minFee as string) : undefined,
      maxFee: maxFee ? parseFloat(maxFee as string) : undefined,
      city: city as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      services: services as string,
      search: search as string,
      reason: reason as string,
    });

    sendSuccess(res, result, 'Doctors retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error in searchDoctorsController');
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
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error in getDoctorByIdController');
    next(err);
  }
};

export const getDoctorAvailabilityController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = req.params.id || req.user?.id;
    if (!doctorId) {
      throw new AppError('Doctor ID required', 400);
    }
    const { date } = req.query;
    const dateObj = date ? new Date(date as string) : new Date();
    
    logger.info({ doctorId, date }, 'Fetching doctor availability');
    const availability = await getDoctorAvailability(doctorId, dateObj);
    sendSuccess(res, availability, 'Availability retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message, doctorId: req.params.id || req.user?.id }, 'Error in getDoctorAvailabilityController');
    next(err);
  }
};

export const getDoctorSlotsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = req.params.id;
    if (!doctorId) {
      throw new AppError('Doctor ID required', 400);
    }
    const days = parseInt((req.query.days as string) || '10', 10);
    const slots = await getDoctorSlots(doctorId, Math.min(days, 14));
    sendSuccess(res, slots, 'Slots retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message, doctorId: req.params.id }, 'Error in getDoctorSlotsController');
    next(err);
  }
};

export const getDoctorAnalyticsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      throw new AppError('User not authenticated', 401);
    }

    logger.info({ doctorId }, 'Fetching doctor analytics');

    // Verify user has a doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId }
    });
    
    if (!doctorProfile) {
      logger.warn({ doctorId }, 'Doctor profile not found');
      throw new AppError('Doctor profile not found. Please complete your profile setup.', 404);
    }
    
    const { period, startDate, endDate } = req.query;

    const analytics = await getDoctorAnalytics(
      doctorId,
      (period as any) || 'day',
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    logger.info({ doctorId }, 'Analytics retrieved successfully');
    sendSuccess(res, analytics, 'Analytics retrieved successfully');
  } catch (err: any) {
    // Enhanced error logging
    const errorInfo = {
      error: err.message,
      stack: err.stack,
      doctorId: req.user?.id,
      errorName: err.name,
      errorCode: err.code,
      query: req.query,
    };
    logger.error(errorInfo, 'Error in getDoctorAnalyticsController');
    // Also log to console for PM2
    console.error('[getDoctorAnalyticsController ERROR]', errorInfo);
    next(err);
  }
};

export const getClinicStaffController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const staff = await getClinicStaff(userId);
    sendSuccess(res, staff, 'Clinic staff retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message, userId: req.user?.id }, 'Error in getClinicStaffController');
    next(err);
  }
};
