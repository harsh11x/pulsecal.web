import { Router } from 'express';
import {
  createPaymentController,
  getPaymentsController,
  getPaymentByIdController,
  updatePaymentStatusController,
  deletePaymentController,
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
} from './payments.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireReceptionist, requireStaff } from '../../middlewares/role.middleware';

const router = Router();

// Razorpay routes
router.post('/create-order', authenticate, createRazorpayOrderController);
router.post('/verify', authenticate, verifyRazorpayPaymentController);

// Standard payment routes
router.post('/', authenticate, createPaymentController);
router.get('/', authenticate, getPaymentsController);
router.get('/:id', authenticate, getPaymentByIdController);
router.patch('/:id/status', authenticate, requireReceptionist, updatePaymentStatusController);
router.delete('/:id', authenticate, requireStaff, deletePaymentController);

export default router;


