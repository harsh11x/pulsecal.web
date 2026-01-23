import { Router } from 'express';
import {
  searchDoctorsController,
  getDoctorByIdController,
  getDoctorAvailabilityController,
  getDoctorAnalyticsController,
  getClinicStaffController,
  updateScheduleController,
} from './doctors.controller';
import {
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
} from '../payments/payments.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireDoctor } from '../../middlewares/role.middleware';

const router = Router();

// Subscription routes for doctor onboarding
router.post('/subscription/create', authenticate, createRazorpayOrderController);
router.post('/subscription/verify', authenticate, verifyRazorpayPaymentController);

// Doctor search and profile routes
router.get('/search', authenticate, searchDoctorsController);
router.post('/schedule', authenticate, requireDoctor, updateScheduleController);
router.get('/analytics', authenticate, requireDoctor, getDoctorAnalyticsController);
router.get('/clinic/staff', authenticate, requireDoctor, getClinicStaffController);
router.get('/:id', authenticate, getDoctorByIdController);
router.get('/:id/availability', authenticate, getDoctorAvailabilityController);

export default router;

