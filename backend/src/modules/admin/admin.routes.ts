import { Router } from 'express';
import {
  getAuditLogsController,
  getSystemStatsController,
  getAllClinicsController,
  getClinicDetailsController,
} from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.get('/audit-logs', authenticate, requireAdmin, getAuditLogsController);
router.get('/stats', authenticate, requireAdmin, getSystemStatsController);

// Clinic management routes
router.get('/clinics', authenticate, requireAdmin, getAllClinicsController);
router.get('/clinics/:id', authenticate, requireAdmin, getClinicDetailsController);

export default router;
