import { Router } from 'express';
import { createOrder, verifyPayment } from './payment-gateway.controller';
import { authenticate } from '../../middlewares/firebaseAuth.middleware';

const router = Router();

// Protect these routes with clean Auth middleware
router.post('/create-order', authenticate, createOrder);
router.post('/verify', authenticate, verifyPayment);

export default router;
