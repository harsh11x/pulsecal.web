import { Router } from 'express';
import {
  getAuditLogsController,
  getSystemStatsController,
  getAllClinicsController,
  getClinicDetailsController,
  getDoctorPayoutsController,
  setClinicStatusController,
  deleteClinicAdminController,
  setUserStatusAdminController,
} from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.get('/audit-logs', authenticate, requireAdmin, getAuditLogsController);
router.get('/stats', authenticate, requireAdmin, getSystemStatsController);

// Clinic management
router.get('/clinics', authenticate, requireAdmin, getAllClinicsController);
router.get('/clinics/:id', authenticate, requireAdmin, getClinicDetailsController);
router.patch('/clinics/:id/status', authenticate, requireAdmin, setClinicStatusController);
router.delete('/clinics/:id', authenticate, requireAdmin, deleteClinicAdminController);

// User management (admin can suspend/delete any user)
router.patch('/users/:id/status', authenticate, requireAdmin, setUserStatusAdminController);

router.get('/doctors/payouts', authenticate, requireAdmin, getDoctorPayoutsController);

export default router;
