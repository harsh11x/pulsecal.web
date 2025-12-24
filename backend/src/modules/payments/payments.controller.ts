import { Response, NextFunction } from 'express';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
} from './payments.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

const createPaymentSchema = Joi.object({
  appointmentId: Joi.string().optional(),
  amount: Joi.number().required(),
  currency: Joi.string().optional(),
  method: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'CASH', 'BANK_TRANSFER').required(),
  cardData: Joi.string().optional(),
  description: Joi.string().optional(),
});

const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED').required(),
  transactionId: Joi.string().optional(),
});

export const createPaymentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createPaymentSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const payment = await createPayment({
      patientId: req.user.id,
      ...value,
    });
    sendSuccess(res, payment, 'Payment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getPaymentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getPayments({
      ...req,
      user: req.user,
    });
    sendPaginated(
      res,
      result.payments,
      result.pagination,
      'Payments retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getPaymentByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payment = await getPaymentById(
      req.params.id,
      req.user?.id,
      req.user?.role
    );
    sendSuccess(res, payment, 'Payment retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updatePaymentStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = updatePaymentStatusSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const payment = await updatePaymentStatus(
      req.params.id,
      value.status,
      value.transactionId
    );

    // Emit real-time notification to doctor if payment has appointment
    if (payment.appointmentId && payment.appointment?.doctorId) {
      const { emitPaymentUpdate } = await import('../../utils/socketEmitter');
      emitPaymentUpdate({
        id: payment.id,
        appointmentId: payment.appointmentId || undefined,
        doctorId: payment.appointment.doctorId,
        amount: Number(payment.amount),
        status: payment.status,
      });
    }

    sendSuccess(res, payment, 'Payment status updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deletePaymentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deletePayment(req.params.id);
    sendSuccess(res, result, 'Payment deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Razorpay Integration Controllers

const createRazorpayOrderSchema = Joi.object({
  plan: Joi.string().valid('BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
});

const verifyRazorpayPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  clinicDetails: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    latitude: Joi.number().allow(null).optional(),
    longitude: Joi.number().allow(null).optional(),
    subscriptionPlan: Joi.string().valid('BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
  }).required(),
});

export const createRazorpayOrderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createRazorpayOrderSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Plan pricing (in paise for Razorpay - multiply by 100)
    const planPricing: Record<string, number> = {
      BASIC: 149900, // ₹1499
      PROFESSIONAL: 299900, // ₹2999
      ENTERPRISE: 499900, // ₹4999
    };

    const amount = planPricing[value.plan];
    if (!amount) {
      throw new AppError('Invalid subscription plan', 400);
    }

    // Create Razorpay order
    const options = {
      amount, // amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: req.user.id,
        plan: value.plan,
      },
    };

    const order = await razorpay.orders.create(options);

    sendSuccess(
      res,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      'Razorpay order created successfully',
      201
    );
  } catch (err: any) {
    console.error('Razorpay order creation error:', err);
    next(new AppError(err.message || 'Failed to create payment order', 500));
  }
};

export const verifyRazorpayPaymentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = verifyRazorpayPaymentSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, clinicDetails } = value;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Payment verified successfully - create clinic
    const { createClinic } = await import('../clinics/clinics.service');

    const clinic = await createClinic({
      name: clinicDetails.name,
      address: clinicDetails.address,
      city: clinicDetails.city,
      state: clinicDetails.state,
      zipCode: clinicDetails.zipCode,
      country: clinicDetails.country,
      phone: clinicDetails.phone,
      email: clinicDetails.email,
      latitude: clinicDetails.latitude,
      longitude: clinicDetails.longitude,
    });

    // TODO: Update clinic with subscription details after adding fields to schema
    // subscriptionPlan: clinicDetails.subscriptionPlan,
    // subscriptionStatus: 'ACTIVE',
    // ownerId: req.user.id,

    // Create payment record
    await createPayment({
      patientId: req.user.id,
      amount: razorpay_order_id.includes('BASIC') ? 1499 : razorpay_order_id.includes('PROFESSIONAL') ? 2999 : 4999,
      currency: 'INR',
      method: 'CREDIT_CARD',
      transactionId: razorpay_payment_id,
      description: `Subscription payment for ${clinicDetails.subscriptionPlan} plan`,
    });

    // TODO: Update payment status to COMPLETED after adding status field to createPayment

    sendSuccess(
      res,
      {
        clinic,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
      'Payment verified and clinic created successfully',
      201
    );
  } catch (err: any) {
    console.error('Razorpay payment verification error:', err);
    next(new AppError(err.message || 'Payment verification failed', 500));
  }
};
