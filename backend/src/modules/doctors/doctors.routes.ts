import { Router } from 'express';
import {
  searchDoctorsController,
  getDoctorByIdController,
  getDoctorAvailabilityController,
} from './doctors.controller';
import { getDoctorAnalyticsController } from './doctors.analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireDoctor } from '../../middlewares/role.middleware';

const router = Router();

router.get('/search', authenticate, searchDoctorsController);
router.get('/analytics', authenticate, requireDoctor, getDoctorAnalyticsController);
router.get('/:id', authenticate, getDoctorByIdController);
router.get('/:id/availability', authenticate, getDoctorAvailabilityController);

export default router;

