import { Router } from 'express';
import {
  searchDoctorsController,
  getDoctorByIdController,
  getDoctorAvailabilityController,
  getDoctorSlotsController,
  getDoctorAnalyticsController,
  getFinancialReportsController,
  getClinicStaffController,
  getDoctorPatientsController,
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

// Doctor search - public (patients need to discover doctors before booking)
router.get('/search', searchDoctorsController);
router.post('/schedule', authenticate, requireDoctor, updateScheduleController);
router.get('/schedule', authenticate, requireDoctor, getDoctorAvailabilityController);
router.get('/analytics', authenticate, requireDoctor, getDoctorAnalyticsController);
router.get('/financial-reports', authenticate, requireDoctor, getFinancialReportsController);
router.get('/clinic/staff', authenticate, requireDoctor, getClinicStaffController);
router.get('/patients', authenticate, requireDoctor, getDoctorPatientsController);
// Doctor profile, availability, slots - public for patient booking flow
router.get('/:id', getDoctorByIdController);
router.get('/:id/availability', getDoctorAvailabilityController);
router.get('/:id/slots', getDoctorSlotsController);

export default router;

