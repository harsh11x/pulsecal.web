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

const router = Router();

router.post('/', authenticate, requireDoctorOrReceptionist, createAppointmentController);
router.get('/', authenticate, getAppointmentsController);
router.get('/:id', authenticate, getAppointmentByIdController);
router.put('/:id', authenticate, requireDoctorOrReceptionist, updateAppointmentController);
router.post('/:id/reschedule', authenticate, rescheduleAppointmentController);
router.post('/:id/cancel', authenticate, cancelAppointmentController);
router.post('/:id/checkin', authenticate, requireReceptionist, checkInAppointmentController);
router.delete('/:id', authenticate, requireDoctorOrReceptionist, deleteAppointmentController);

export default router;

