import { Router } from 'express';
import {
  createTelemedicineSessionController,
  getTelemedicineSessionController,
  startSessionController,
  endSessionController,
} from './telemedicine.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireDoctor } from '../../middlewares/role.middleware';

const router = Router();

router.post('/:appointmentId', authenticate, requireDoctor, createTelemedicineSessionController);
router.get('/:appointmentId', authenticate, getTelemedicineSessionController);
router.post('/:appointmentId/start', authenticate, requireDoctor, startSessionController);
router.post('/:appointmentId/end', authenticate, requireDoctor, endSessionController);

export default router;

