import { Response, NextFunction } from 'express';
import { searchDoctors, getDoctorById, getDoctorAvailability } from './doctors.service';
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
    if (!userId) throw new AppError('User not authenticated', 401);

    const { date, workingHours, slotDuration, blockedSlots } = req.body;

    logger.info({ userId, date }, 'Updating doctor schedule');

    // Fetch existing profile
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw new AppError('Doctor profile not found', 404);

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
            [date]: blockedSlots
        },
        defaultSettings: {
            workingHours,
            slotDuration
        }
    };

    await prisma.doctorProfile.update({
        where: { userId },
        data: {
            workingHours: updatedData
        }
    });

    logger.info({ userId }, 'Schedule updated successfully');
    sendSuccess(res, null, 'Schedule updated successfully');
  } catch (err) {
    logger.error({ error: err }, 'Error in updateScheduleController');
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
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      services: services as string,
      search: search as string,
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
    const availability = await getDoctorAvailability(id, date as string);
    sendSuccess(res, availability, 'Availability retrieved successfully');
  } catch (err) {
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
    logger.error(
      { 
        error: err.message, 
        stack: err.stack,
        doctorId: req.user?.id 
      }, 
      'Error in getDoctorAnalyticsController'
    );
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
    if (!userId) throw new AppError('User not authenticated', 401);

    const staff = await getClinicStaff(userId);
    sendSuccess(res, staff, 'Clinic staff retrieved successfully');
  } catch (err) {
    next(err);
  }
};
