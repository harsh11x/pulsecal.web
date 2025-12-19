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

const router = Router();

router.post('/', authenticate, addToQueueController);
router.get('/', authenticate, getQueueController);
router.get('/status', authenticate, getQueueStatusController);
router.post('/next', authenticate, requireDoctor, callNextPatientController);
router.post('/:id/complete', authenticate, requireReceptionist, completeQueueEntryController);
router.delete('/:id', authenticate, removeFromQueueController);

export default router;

