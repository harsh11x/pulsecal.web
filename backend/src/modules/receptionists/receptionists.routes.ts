import { Router } from 'express';
import {
  getReceptionistStatsController,
  getQueueStatusController,
  linkReceptionistController,
} from './receptionists.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireReceptionist } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, linkReceptionistController);
router.get('/stats', authenticate, requireReceptionist, getReceptionistStatsController);
router.get('/queue', authenticate, requireReceptionist, getQueueStatusController);

export default router;

