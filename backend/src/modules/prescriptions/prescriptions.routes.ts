import { Router } from 'express';
import {
  createPrescriptionController,
  getPrescriptionsController,
  getPrescriptionByIdController,
  requestRefillController,
  updatePrescriptionController,
  deletePrescriptionController,
} from './prescriptions.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireDoctor, requireStaff } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requireDoctor, createPrescriptionController);
router.get('/', authenticate, getPrescriptionsController);
router.get('/:id', authenticate, getPrescriptionByIdController);
router.post('/:id/refill', authenticate, requestRefillController);
router.put('/:id', authenticate, requireDoctor, updatePrescriptionController);
router.delete('/:id', authenticate, requireStaff, deletePrescriptionController);

export default router;

