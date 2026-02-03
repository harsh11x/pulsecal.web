import { Response, NextFunction } from 'express';
import prisma from '../../config/database';
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
import admin from '../../config/firebase';

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

    // Note: Payment model doesn't have a direct relation to Appointment
    // Real-time notification would need to be handled differently if needed

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


// Razorpay One-Time Payment Integration (For Patients - existing appointment)
const createRazorpayOrderSchema = Joi.object({
  appointmentId: Joi.string().optional(),
  amount: Joi.number().required(),
  currency: Joi.string().default('INR'),
});

const verifyRazorpayPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

export const createRazorpayOrderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createRazorpayOrderSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const options: any = {
      amount: Math.round(value.amount * 100), // Razorpay works in paise
      currency: value.currency,
      receipt: value.appointmentId ? `rcpt_${value.appointmentId}` : `rcpt_${Date.now()}_${req.user?.id?.substring(0, 5)}`,
      notes: {
        ...(value.appointmentId && { appointmentId: value.appointmentId }),
        patientId: req.user?.id
      }
    };

    const order = await razorpay.orders.create(options);

    sendSuccess(res, {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    }, 'Razorpay order created successfully');
  } catch (err: any) {
    next(new AppError(err.message, 500));
  }
};

export const verifyRazorpayPaymentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = verifyRazorpayPaymentSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = value;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Payment Verified. Fetch Order to get notes (appointmentId)
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const appointmentId = order.notes?.appointmentId as string | undefined;

    if (appointmentId) {
      // Existing appointment - update status and create payment
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' }
      });

      await createPayment({
        patientId: req.user?.id!,
        appointmentId,
        amount: Number(order.amount) / 100,
        currency: 'INR',
        method: 'RAZORPAY_ONLINE',
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'COMPLETED',
        description: 'Consultation Fee',
      });
    }

    sendSuccess(res, { paymentId: razorpay_payment_id, appointmentId }, 'Payment verified and appointment confirmed');

  } catch (err: any) {
    next(new AppError(err.message, 500));
  }
};

// ========== Appointment Booking with Payment (Pay First, Then Create) ==========
const createAppointmentOrderSchema = Joi.object({
  doctorId: Joi.string().required(),
  scheduledAt: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  duration: Joi.number().optional().default(30),
  reason: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
  amount: Joi.number().required().min(1),
});

const verifyAppointmentPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

export const createAppointmentOrderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'PATIENT') throw new AppError('Only patients can book appointments with payment', 403);

    const { error, value } = createAppointmentOrderSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const scheduledAt = typeof value.scheduledAt === 'string' ? value.scheduledAt : new Date(value.scheduledAt).toISOString();
    const options: any = {
      amount: Math.round(value.amount * 100),
      currency: 'INR',
      receipt: `apt_${Date.now()}_${req.user.id.substring(0, 5)}`,
      notes: {
        type: 'APPOINTMENT_BOOKING',
        patientId: String(req.user.id),
        doctorId: String(value.doctorId),
        scheduledAt: scheduledAt,
        duration: String(value.duration || 30),
        reason: String(value.reason || ''),
        notes: String(value.notes || ''),
      }
    };

    const order = await razorpay.orders.create(options);

    sendSuccess(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    }, 'Order created. Complete payment to book appointment.', 201);
  } catch (err: any) {
    next(new AppError(err.message || 'Failed to create order', 500));
  }
};

export const verifyAppointmentPaymentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'PATIENT') throw new AppError('Only patients can complete appointment payment', 403);

    const { error, value } = verifyAppointmentPaymentSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = value;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new AppError('Invalid payment signature', 400);
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes || {};
    if (notes.type !== 'APPOINTMENT_BOOKING' || notes.patientId !== req.user?.id) {
      throw new AppError('Invalid order or unauthorized', 400);
    }

    const doctorId = notes.doctorId as string;
    const scheduledAt = new Date(notes.scheduledAt as string);
    const duration = parseInt(notes.duration as string, 10) || 30;
    const reason = (notes.reason as string) || undefined;
    const notesText = (notes.notes as string) || undefined;

    const { createAppointment } = await import('../appointments/appointments.service');
    const appointment = await createAppointment({
      patientId: req.user!.id,
      doctorId,
      scheduledAt,
      duration,
      reason,
      notes: notesText,
      status: 'CONFIRMED',
    });

    await createPayment({
      patientId: req.user!.id,
      doctorId,
      appointmentId: appointment.id,
      amount: Number(order.amount) / 100,
      currency: 'INR',
      method: 'RAZORPAY_ONLINE',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'COMPLETED',
      description: 'Consultation Fee',
    });

    const { emitNewAppointment } = await import('../../utils/socketEmitter');
    const aptWithPatient = appointment as any;
    emitNewAppointment({
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      patientName: aptWithPatient.patient ? `${aptWithPatient.patient.firstName} ${aptWithPatient.patient.lastName}` : 'Unknown Patient',
      scheduledAt: appointment.scheduledAt,
      reason: appointment.reason || undefined,
    });

    sendSuccess(res, {
      appointment,
      paymentId: razorpay_payment_id,
    }, 'Appointment booked successfully', 201);
  } catch (err: any) {
    next(new AppError(err.message || 'Payment verification failed', 500));
  }
};

// Razorpay Subscription Integration
const createRazorpaySubscriptionSchema = Joi.object({
  plan: Joi.string().valid('STARTER', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
});

const verifyRazorpaySubscriptionSchema = Joi.object({
  razorpay_payment_id: Joi.string().required(),
  razorpay_subscription_id: Joi.string().required(),
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
    subscriptionPlan: Joi.string().valid('STARTER', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
  }).optional(),
});

export const createRazorpaySubscriptionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createRazorpaySubscriptionSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Mapping Plan Types to Razorpay Plan IDs (These should be in .env)
    const PLAN_IDS: Record<string, string> = {
      STARTER: process.env.RAZORPAY_PLAN_STARTER || 'plan_starter_id',
      BASIC: process.env.RAZORPAY_PLAN_BASIC || 'plan_basic_id',
      PROFESSIONAL: process.env.RAZORPAY_PLAN_PROFESSIONAL || 'plan_professional_id',
      ENTERPRISE: process.env.RAZORPAY_PLAN_ENTERPRISE || 'plan_enterprise_id',
    };

    const planId = PLAN_IDS[value.plan];
    if (!planId) {
      throw new AppError('Plan ID not configured for this subscription type', 500);
    }

    // Create Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // 10 years (or make it effectively infinite/large)
      quantity: 1,
      notes: {
        userId: req.user.id,
        planType: value.plan,
      }
    });

    sendSuccess(
      res,
      {
        subscriptionId: subscription.id,
        key: process.env.RAZORPAY_KEY_ID,
      },
      'Subscription created successfully',
      201
    );
  } catch (err: any) {
    console.error('Razorpay subscription creation error:', err);
    next(new AppError(err.message || 'Failed to create subscription', 500));
  }
};

export const verifyRazorpaySubscriptionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = verifyRazorpaySubscriptionSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, clinicDetails } = value;

    // Verify Signature
    // Signature for Subscriptions: hmac_sha256(razorpay_payment_id + | + razorpay_subscription_id, secret)
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new AppError('Invalid subscription signature', 400);
    }

    // Determine Logic: New Clinic vs Existing
    const isNewRegistration = !req.user.clinicId;
    let clinic;
    const subscriptionPlan = clinicDetails?.subscriptionPlan || 'STARTER'; // Default or retrieve from sub notes if possible

    if (isNewRegistration) {
      if (!clinicDetails) throw new AppError('Clinic details required for new registration', 400);

      const { createClinic } = await import('../clinics/clinics.service');
      clinic = await createClinic({
        ...clinicDetails,
        subscriptionStatus: 'ACTIVE',
        razorpayOrderId: razorpay_subscription_id, // Storing sub ID in order ID field or new field
        razorpayPaymentId: razorpay_payment_id,
      });

      await prisma.user.update({
        where: { id: req.user.id },
        data: { clinicId: clinic.id, onboardingCompleted: true, role: 'DOCTOR' },
      });

      // Update Firebase Role
      try {
        if (req.user.firebaseUid) {
          await admin.auth().setCustomUserClaims(req.user.firebaseUid, { role: 'DOCTOR' });
        }
      } catch (e) { console.error('Firebase role sync failed', e); }

    } else {
      // Renewal or Update
      clinic = await prisma.clinic.update({
        where: { id: req.user.clinicId! },
        data: {
          subscriptionPlan: subscriptionPlan as any,
          subscriptionStatus: 'ACTIVE',
          razorpayOrderId: razorpay_subscription_id,
          // We should probably store subscription ID in a dedicated field
        }
      });
    }

    // Update Doctor Profile
    await prisma.doctorProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        licenseNumber: `LIC-${req.user.id.substring(0, 8)}`, // Placeholder
        specialization: 'General',
        subscriptionPlan: subscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        razorpaySubscriptionId: razorpay_subscription_id,
        ...(clinicDetails ? {
          clinicName: clinicDetails.name,
          clinicAddress: `${clinicDetails.address}, ${clinicDetails.city}`,
        } : {})
      },
      update: {
        subscriptionPlan: subscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        razorpaySubscriptionId: razorpay_subscription_id,
      }
    });

    // Record Payment
    await createPayment({
      patientId: req.user.id,
      amount: 0, // It's a subscription, amount is handled by Razorpay auto-debit. We might want to record the first payment amount if known.
      currency: 'INR',
      method: 'RAZORPAY_SUBSCRIPTION',
      transactionId: razorpay_payment_id,
      razorpayPaymentId: razorpay_payment_id,
      description: `Subscription Activation: ${razorpay_subscription_id}`,
      status: 'COMPLETED',
    });

    sendSuccess(res, { clinic, subscriptionId: razorpay_subscription_id }, 'Subscription activated successfully');

  } catch (err: any) {
    console.error('Subscription verification error:', err);
    next(new AppError(err.message || 'Subscription verification failed', 500));
  }
};

export const cancelSubscriptionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // Subscription ID
    if (!id) throw new AppError('Subscription ID required', 400);

    // Cancel at end of cycle
    await razorpay.subscriptions.cancel(id, false);

    // Update DB status to 'CANCELLED_PENDING' or similar if we track it
    // Ideally we wait for webhook, but we can optimistically update or just notify user

    sendSuccess(res, null, 'Subscription cancellation scheduled at end of billing cycle');
  } catch (err: any) {
    next(new AppError(err.message, 500));
  }
};
