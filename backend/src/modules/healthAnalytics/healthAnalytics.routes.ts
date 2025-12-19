import { Router } from 'express';
import {
  createHealthMetricController,
  getHealthMetricsController,
  getHealthMetricByIdController,
  updateHealthMetricController,
  deleteHealthMetricController,
} from './healthAnalytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePatient } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requirePatient, createHealthMetricController);
router.get('/', authenticate, getHealthMetricsController);
router.get('/:id', authenticate, getHealthMetricByIdController);
router.put('/:id', authenticate, requirePatient, updateHealthMetricController);
router.delete('/:id', authenticate, requirePatient, deleteHealthMetricController);

export default router;

