import { Router } from 'express';
import {
  getReceptionistStatsController,
  getQueueStatusController,
  getClinicDoctorsController,
  linkReceptionistController,
  registerPatientController
} from './receptionists.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireReceptionist } from '../../middlewares/role.middleware';
import { checkSubscriptionStatus, checkFeatureAccess } from '../../middlewares/subscription.middleware';

const router = Router();

router.post('/', authenticate, linkReceptionistController);
router.get('/stats', authenticate, requireReceptionist, getReceptionistStatsController);
router.get('/queue', authenticate, requireReceptionist, getQueueStatusController);
router.get('/doctors', authenticate, requireReceptionist, getClinicDoctorsController);
router.post(
  '/patients',
  authenticate,
  checkSubscriptionStatus as any,
  checkFeatureAccess('RECEPTIONIST_ACCESS') as any,
  requireReceptionist,
  registerPatientController
);


export default router;

