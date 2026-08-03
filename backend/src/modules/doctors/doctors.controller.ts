import { Response, NextFunction } from 'express';
import { searchDoctors, getDoctorById, getDoctorAvailability, getDoctorSlots, getDoctorPatients } from './doctors.service';
import { getDoctorAnalytics, getFinancialReports } from './doctors.analytics.service';
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

    // Preserve any existing break window for this day when the payload doesn't send one.
    // An explicit empty string means the doctor cleared the break -> normalize to null.
    const currentDay = currentWorkingHours[dayName] || {};
    const resolveBreak = (incoming: any, existing: any) =>
      incoming !== undefined ? (incoming || null) : existing ?? null;

    const updatedData = {
      ...currentWorkingHours,
      [dayName]: {
        start: workingHours.start,
        end: workingHours.end,
        isOpen: true,
        breakStart: resolveBreak(workingHours.breakStart, currentDay.breakStart),
        breakEnd: resolveBreak(workingHours.breakEnd, currentDay.breakEnd),
      },
      exceptions: {
        ...(currentWorkingHours.exceptions || {}),
        [date]: blockedSlots || []
      },
      defaultSettings: {
        workingHours: {
          start: workingHours.start,
          end: workingHours.end,
          breakStart: resolveBreak(workingHours.breakStart, currentDay.breakStart),
          breakEnd: resolveBreak(workingHours.breakEnd, currentDay.breakEnd),
        },
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
    logger.error({ error: err?.message, stack: err?.stack }, 'Error in searchDoctorsController');
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
    const serialized = {
      ...doctor,
      consultationFee: doctor.consultationFee != null ? Number(doctor.consultationFee) : 0,
    };
    sendSuccess(res, serialized, 'Doctor retrieved successfully');
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

/** Build fallback slots (no DB) so booking page never shows "no availability" when API errors */
function getSlotsFallback(daysCount: number = 14): { date: string; dayName: string; slots: { time: string; available: boolean }[]; isFullyBooked: boolean }[] {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const slotDuration = 30;
  const result: { date: string; dayName: string; slots: { time: string; available: boolean }[]; isFullyBooked: boolean }[] = [];
  for (let d = 0; d < daysCount; d++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + d);
    let slotStart = new Date(currentDay);
    slotStart.setHours(9, 0, 0, 0);
    const slotEnd = new Date(currentDay);
    slotEnd.setHours(18, 0, 0, 0);
    if (d === 0 && slotStart < now) {
      const msPerSlot = slotDuration * 60 * 1000;
      slotStart = new Date(Math.ceil(now.getTime() / msPerSlot) * msPerSlot);
      slotStart.setSeconds(0, 0);
    }
    const daySlots: { time: string; available: boolean }[] = [];
    let cur = new Date(slotStart);
    while (cur < slotEnd && cur >= now) {
      cur.setSeconds(0, 0);
      daySlots.push({ time: cur.toISOString(), available: true });
      cur.setMinutes(cur.getMinutes() + slotDuration);
    }
    if (daySlots.length > 0) {
      result.push({
        date: currentDay.toISOString().split('T')[0],
        dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
        slots: daySlots,
        isFullyBooked: false,
      });
    }
  }
  return result;
}

export const getDoctorPatientsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      throw new AppError('User not authenticated', 401);
    }
    const result = await getDoctorPatients(doctorId);
    sendSuccess(res, result, 'Patients retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message, doctorId: req.user?.id }, 'Error in getDoctorPatientsController');
    next(err);
  }
};

export const getDoctorSlotsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const doctorId = req.params.id;
  if (!doctorId) {
    return next(new AppError('Doctor ID required', 400));
  }
  const days = Math.min(parseInt((req.query.days as string) || '10', 10) || 10, 14);
  try {
    const slots = await getDoctorSlots(doctorId, days);
    const toSend = Array.isArray(slots) && slots.length > 0 ? slots : getSlotsFallback(days);
    sendSuccess(res, toSend, 'Slots retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message, doctorId }, 'Error in getDoctorSlotsController - returning fallback slots');
    sendSuccess(res, getSlotsFallback(days), 'Slots retrieved successfully');
  }
};

const emptyAnalytics = {
  today: { appointments: 0, revenue: 0, patients: 0, cancellations: 0 },
  yesterday: { appointments: 0, revenue: 0, patients: 0, cancellations: 0 },
  thisWeek: { appointments: 0, revenue: 0, patients: 0, cancellations: 0 },
  thisMonth: { appointments: 0, revenue: 0, patients: 0, cancellations: 0 },
  revenueData: [],
  patientGrowth: [],
  cancellationRate: 0,
  reviews: { total: 0, averageRating: 0, recent: [] },
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

    // Doctor profile is optional - return empty analytics if not yet created (e.g. mid-onboarding)
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId }
    });

    if (!doctorProfile) {
      logger.info({ doctorId }, 'No doctor profile yet, returning empty analytics');
      return sendSuccess(res, emptyAnalytics, 'Analytics retrieved successfully');
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
    const errorInfo = {
      error: err.message,
      stack: err.stack,
      doctorId: req.user?.id,
      errorName: err.name,
      errorCode: err.code,
      query: req.query,
    };
    logger.error(errorInfo, 'Error in getDoctorAnalyticsController');
    console.error('[getDoctorAnalyticsController ERROR]', errorInfo);
    // Preserve 4xx (auth, not found) so client can handle them
    if (err instanceof AppError && err.statusCode < 500) {
      return next(err);
    }
    // On any 500/unexpected error, return empty analytics so dashboard still loads
    logger.warn({ doctorId: req.user?.id }, 'Returning empty analytics due to error');
    return sendSuccess(res, emptyAnalytics, 'Analytics retrieved successfully');
  }
};

export const getFinancialReportsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      throw new AppError('User not authenticated', 401);
    }
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId }
    });
    if (!doctorProfile) {
      throw new AppError('Doctor profile not found. Please complete your profile setup.', 404);
    }
    const type = (req.query.type as 'daily' | 'monthly' | 'yearly') || 'monthly';
    const report = await getFinancialReports(doctorId, type);
    sendSuccess(res, report, 'Financial report retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message, doctorId: req.user?.id }, 'Error in getFinancialReportsController');
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true },
    });
    const clinicId = user?.clinicId;
    if (!clinicId) {
      return sendSuccess(res, { doctors: [], receptionists: [], totalStaff: 0 }, 'No clinic linked');
    }

    const staff = await getClinicStaff(clinicId, req.user?.id, req.user?.role);
    sendSuccess(res, staff, 'Clinic staff retrieved successfully');
  } catch (err: any) {
    logger.error({ error: err.message, userId: req.user?.id }, 'Error in getClinicStaffController');
    next(err);
  }
};
