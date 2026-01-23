import { Response, NextFunction } from 'express';
import { searchDoctors, getDoctorById, getDoctorAvailability } from './doctors.service';
import { getDoctorAnalytics } from './doctors.analytics.service';
import { getClinicStaff } from './doctors.staff.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import prisma from '../../config/database';

export const updateScheduleController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('User not authenticated', 401);

    const { date, workingHours, slotDuration, blockedSlots } = req.body;

    // Fetch existing profile
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw new AppError('Doctor profile not found', 404);

    // Update workingHours. We store generic workingHours AND specific blocked slots
    // We'll store blockedSlots in a special 'exceptions' key within workingHours JSON
    // This is a workaround since we can't easily add a new table/column
    const currentWorkingHours = (profile.workingHours as any) || {};

    // Update generic daily hours (if provided)
    if (workingHours) {
        // workingHours from frontend is { start: "09:00", end: "17:00" }
        // We need to apply this to all days or specific days?
        // Frontend DoctorScheduleManager sends a single `workingHours` object for the *selected date* context
        // But also allows configuring generic hours.
        // For MVP, let's assume we update the generic schedule for the day of week corresponding to `date`
        // OR just update the whole structure if provided.
        // The frontend sends `workingHours` as simple object { start, end }.
        // We'll leave existing structure intact and just update exceptions if needed.
        // Actually, the prompt says "modifying clinic time schedules".
        // Let's just save what we get into a merged object.
    }

    const updatedData = {
        ...currentWorkingHours,
        // Save exceptions/blocked slots for this date
        exceptions: {
            ...(currentWorkingHours.exceptions || {}),
            [date]: blockedSlots
        },
        // Also save generic config if we want to persist the "default" state
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

    sendSuccess(res, null, 'Schedule updated successfully');
  } catch (err) {
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

export const getDoctorAnalyticsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = req.user!.id;
    const { period, startDate, endDate } = req.query;

    const analytics = await getDoctorAnalytics(
      doctorId,
      (period as any) || 'day',
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    sendSuccess(res, analytics, 'Analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getClinicStaffController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clinicId = req.user!.clinicId;

    if (!clinicId) {
      throw new AppError('User is not associated with a clinic', 400);
    }

    const staff = await getClinicStaff(clinicId);
    sendSuccess(res, staff, 'Clinic staff retrieved successfully');
  } catch (err) {
    next(err);
  }
};
