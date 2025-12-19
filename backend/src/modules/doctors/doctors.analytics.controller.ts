import { Response, NextFunction } from 'express';
import { getDoctorAnalytics } from './doctors.analytics.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';

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

    const { period } = req.query;
    const validPeriods = ['day', 'week', 'month', '3months', 'year'];
    const analyticsPeriod = validPeriods.includes(period as string) 
      ? (period as 'day' | 'week' | 'month' | '3months' | 'year')
      : 'day';

    const analytics = await getDoctorAnalytics(doctorId, analyticsPeriod);
    sendSuccess(res, analytics, 'Analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

