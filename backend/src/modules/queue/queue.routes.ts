import { Router } from 'express';
import {
  addToQueueController,
  getQueueController,
  getQueueStatusController,
  callNextPatientController,
  completeQueueEntryController,
  removeFromQueueController,
} from './queue.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireReceptionist, requireDoctor } from '../../middlewares/role.middleware';
import { checkSubscriptionStatus, checkFeatureAccess } from '../../middlewares/subscription.middleware';


const router = Router();

router.post('/', authenticate, checkSubscriptionStatus as any, checkFeatureAccess('QUEUE_MANAGEMENT') as any, addToQueueController);
router.get('/', authenticate, checkSubscriptionStatus as any, checkFeatureAccess('QUEUE_MANAGEMENT') as any, getQueueController);
router.get('/status', authenticate, checkSubscriptionStatus as any, checkFeatureAccess('QUEUE_MANAGEMENT') as any, getQueueStatusController);
router.post('/next', authenticate, checkSubscriptionStatus as any, checkFeatureAccess('QUEUE_MANAGEMENT') as any, requireDoctor, callNextPatientController);
router.post('/:id/complete', authenticate, checkSubscriptionStatus as any, checkFeatureAccess('QUEUE_MANAGEMENT') as any, requireReceptionist, completeQueueEntryController);
router.delete('/:id', authenticate, checkSubscriptionStatus as any, checkFeatureAccess('QUEUE_MANAGEMENT') as any, removeFromQueueController);

export default router;

