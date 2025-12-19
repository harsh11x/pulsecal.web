import { Router } from 'express';
import {
  getAuditLogsController,
  getSystemStatsController,
} from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.get('/audit-logs', authenticate, requireAdmin, getAuditLogsController);
router.get('/stats', authenticate, requireAdmin, getSystemStatsController);

export default router;

