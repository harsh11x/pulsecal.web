import { Router } from 'express';
import {
  createPaymentController,
  getPaymentsController,
  getPaymentByIdController,
  updatePaymentStatusController,
  deletePaymentController,
  createRazorpaySubscriptionController,
  verifyRazorpaySubscriptionController,
  cancelSubscriptionController,
  getSubscriptionStatusController,
  createSubscriptionOrderController,
  verifySubscriptionOrderController,
  cancelSubscriptionStatusController,
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
  createAppointmentOrderController,
  verifyAppointmentPaymentController,
  razorpayWebhookController,
  createDemoOrderController,
  verifyDemoPaymentController,
} from './payments.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireReceptionist, requireStaff } from '../../middlewares/role.middleware';

const router = Router();


// Razorpay Subscription routes (legacy - Razorpay Plans API)
router.post('/create-subscription', authenticate, createRazorpaySubscriptionController);
router.post('/verify-subscription', authenticate, verifyRazorpaySubscriptionController);
router.post('/cancel-subscription/:id', authenticate, cancelSubscriptionController);
router.post('/razorpay/webhook', razorpayWebhookController);

// Public homepage: Schedule a demo (₹5) — no auth
router.post('/demo/create-order', createDemoOrderController);
router.post('/demo/verify', verifyDemoPaymentController);

// Subscription upgrade via one-time payment (Order-based - simpler, works without Razorpay Plans)
router.get('/subscription/status', authenticate, getSubscriptionStatusController);
router.post('/subscription/create', authenticate, createSubscriptionOrderController);
router.post('/subscription/verify', authenticate, verifySubscriptionOrderController);
router.post('/subscription/cancel', authenticate, cancelSubscriptionStatusController);

// Razorpay One-Time routes
router.post('/create-order', authenticate, createRazorpayOrderController);
router.post('/verify', authenticate, verifyRazorpayPaymentController);

// Patient appointment: pay first, then create appointment
router.post('/appointment/create-order', authenticate, createAppointmentOrderController);
router.post('/appointment/verify', authenticate, verifyAppointmentPaymentController);

// Standard payment routes
router.post('/', authenticate, createPaymentController);
router.get('/', authenticate, getPaymentsController);
router.get('/:id', authenticate, getPaymentByIdController);
router.patch('/:id/status', authenticate, requireReceptionist, updatePaymentStatusController);
router.delete('/:id', authenticate, requireStaff, deletePaymentController);

export default router;


