import { Router } from 'express';
import {
  createClinicController,
  getClinicsController,
  getClinicByIdController,
  updateClinicController,
  deleteClinicController,
} from './clinics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.get('/', getClinicsController);
router.get('/:id', getClinicByIdController);
router.post('/', authenticate, requireAdmin, createClinicController);
router.put('/:id', authenticate, requireAdmin, updateClinicController);
router.delete('/:id', authenticate, requireAdmin, deleteClinicController);

export default router;

