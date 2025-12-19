import { Router } from 'express';
import {
  createReminderController,
  getRemindersController,
  getReminderByIdController,
  updateReminderController,
  markReminderCompletedController,
  deleteReminderController,
} from './reminders.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePatient } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requirePatient, createReminderController);
router.get('/', authenticate, getRemindersController);
router.get('/:id', authenticate, getReminderByIdController);
router.put('/:id', authenticate, requirePatient, updateReminderController);
router.post('/:id/complete', authenticate, requirePatient, markReminderCompletedController);
router.delete('/:id', authenticate, requirePatient, deleteReminderController);

export default router;

