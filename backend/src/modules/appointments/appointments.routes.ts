import { Router } from 'express';
import {
  createAppointmentController,
  getAppointmentsController,
  getAppointmentByIdController,
  updateAppointmentController,
  rescheduleAppointmentController,
  cancelAppointmentController,
  checkInAppointmentController,
  deleteAppointmentController,
} from './appointments.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireDoctorOrReceptionist, requireReceptionist } from '../../middlewares/role.middleware';

import { checkSubscriptionStatus } from '../../middlewares/subscription.middleware';

const router = Router();

router.post('/', authenticate, checkSubscriptionStatus as any, requireDoctorOrReceptionist, createAppointmentController);
router.get('/', authenticate, checkSubscriptionStatus as any, getAppointmentsController);
router.get('/:id', authenticate, checkSubscriptionStatus as any, getAppointmentByIdController);
router.put('/:id', authenticate, checkSubscriptionStatus as any, requireDoctorOrReceptionist, updateAppointmentController);
router.post('/:id/reschedule', authenticate, checkSubscriptionStatus as any, rescheduleAppointmentController); // Allow all roles
router.post('/:id/cancel', authenticate, checkSubscriptionStatus as any, cancelAppointmentController); // Allow all roles
router.post('/:id/checkin', authenticate, checkSubscriptionStatus as any, requireDoctorOrReceptionist, checkInAppointmentController);
router.delete('/:id', authenticate, checkSubscriptionStatus as any, requireDoctorOrReceptionist, deleteAppointmentController);

export default router;

