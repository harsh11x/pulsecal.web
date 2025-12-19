import { Router } from 'express';
import {
  createPaymentController,
  getPaymentsController,
  getPaymentByIdController,
  updatePaymentStatusController,
  deletePaymentController,
} from './payments.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireReceptionist, requireStaff } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, createPaymentController);
router.get('/', authenticate, getPaymentsController);
router.get('/:id', authenticate, getPaymentByIdController);
router.patch('/:id/status', authenticate, requireReceptionist, updatePaymentStatusController);
router.delete('/:id', authenticate, requireStaff, deletePaymentController);

export default router;

