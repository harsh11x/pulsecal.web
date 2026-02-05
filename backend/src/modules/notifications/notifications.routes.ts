import { Router } from 'express';
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
} from './notifications.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getNotificationsController);
router.put('/read-all', authenticate, markAllAsReadController);
router.put('/:id/read', authenticate, markAsReadController);

export default router;
