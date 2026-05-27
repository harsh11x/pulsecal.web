import { Request, Response, NextFunction } from 'express';
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
import { logger } from '../../utils/logger';

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
      const apt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      });
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' }
      });

      const amount = Number(order.amount) / 100;
      await createPayment({
        patientId: req.user?.id!,
        appointmentId,
        amount,
        currency: 'INR',
        method: 'RAZORPAY_ONLINE',
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'COMPLETED',
        description: 'Consultation Fee',
      });

      if (apt?.doctorId) {
        const patientName = apt.patient ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim() || 'Patient' : 'Patient';
        const { notifyPaymentReceived } = await import('../../utils/notificationHelper');
        notifyPaymentReceived({
          doctorId: apt.doctorId,
          patientName,
          amount,
          appointmentId,
        }).catch((err) => console.error('Failed to send payment notification:', err));
      }
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
  phone: Joi.string().pattern(/^\d{10}$/).required().messages({ 'string.pattern.base': 'Phone must be exactly 10 digits' }),
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
    if (req.user?.role?.toUpperCase?.() !== 'PATIENT') throw new AppError('Only patients can book appointments with payment', 403);

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
        phone: String(value.phone || ''),
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
    if (req.user?.role?.toUpperCase?.() !== 'PATIENT') throw new AppError('Only patients can complete appointment payment', 403);

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
    const patientPhone = (notes.phone as string) || undefined;

    if (patientPhone && req.user?.id) {
      const prisma = (await import('../../config/database')).default;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { phone: patientPhone },
      });
    }

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

    const payment = await createPayment({
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

    try {
      const { emitPaymentUpdate } = await import('../../utils/socketEmitter');
      emitPaymentUpdate({
        id: (payment as any).id,
        appointmentId: appointment.id,
        doctorId,
        amount: Number(order.amount) / 100,
        status: 'COMPLETED',
      });
    } catch (_) { }

    const { notifyAppointmentCreated } = await import('../../utils/notificationHelper');
    const aptWithRelations = appointment as any;
    const patientName = aptWithRelations.patient
      ? `${aptWithRelations.patient.firstName} ${aptWithRelations.patient.lastName}`.trim() || 'Patient'
      : 'Patient';
    const doctorName = aptWithRelations.doctor
      ? `Dr. ${aptWithRelations.doctor.firstName} ${aptWithRelations.doctor.lastName}`.trim()
      : undefined;

    notifyAppointmentCreated({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      patientName,
      doctorName,
      scheduledAt: appointment.scheduledAt,
      reason: appointment.reason || undefined,
    }).catch((err) => console.error('Failed to send appointment notifications:', err));

    sendSuccess(res, {
      appointment,
      paymentId: razorpay_payment_id,
    }, 'Appointment booked successfully', 201);
  } catch (err: any) {
    next(new AppError(err.message || 'Payment verification failed', 500));
  }
};

// ========== Subscription Upgrade (One-Time Payment via Order) ==========
const PLAN_AMOUNTS: Record<string, number> = {
  STARTER: 1,
  BASIC: 1499,
  PROFESSIONAL: 2999,
  ENTERPRISE: 4999,
};

const createSubscriptionOrderSchema = Joi.object({
  planId: Joi.string().valid('STARTER', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
  duration: Joi.number().valid(1, 3, 6, 12).optional(),
});

const clinicDetailsSchema = Joi.object({
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
});

const verifySubscriptionOrderSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  clinicDetails: clinicDetailsSchema.optional(),
});

const ensureCanManageSubscription = async (req: AuthRequest): Promise<void> => {
  if (req.user?.role === 'ADMIN') return;
  if (req.user?.role !== 'DOCTOR') throw new AppError('Only doctors can manage subscription', 403);
  if (!req.user?.clinicId) return;
  try {
    const clinic = await prisma.clinic.findUnique({ where: { id: req.user.clinicId }, select: { ownerId: true } });
    if (!clinic?.ownerId || clinic.ownerId === req.user.id) return;
    // Fallback: if this user is the only doctor, treat as owner (legacy clinics)
    const doctorCount = await prisma.user.count({ where: { clinicId: req.user.clinicId!, role: 'DOCTOR' } });
    if (doctorCount === 1) {
      await prisma.clinic.update({ where: { id: req.user.clinicId }, data: { ownerId: req.user.id } });
      return;
    }
    throw new AppError('Only the clinic creator (head doctor) can manage subscription', 403);
  } catch (err: any) {
    if (err.message?.includes("ownerId") && err.message?.includes("does not exist")) {
      return;
    }
    throw err;
  }
};

export const getSubscriptionStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'DOCTOR' && req.user?.role !== 'ADMIN') {
      throw new AppError('Only doctors can view subscription status', 403);
    }
    await ensureCanManageSubscription(req);
    const userId = req.user!.id;

    const [doctorProfile, clinic, lastSubscriptionPayment] = await Promise.all([
      prisma.doctorProfile.findUnique({
        where: { userId },
        select: { subscriptionPlan: true, subscriptionStatus: true, subscriptionExpiresAt: true, razorpaySubscriptionId: true },
      }),
      req.user?.clinicId
        ? prisma.clinic.findUnique({
          where: { id: req.user.clinicId },
          select: { subscriptionPlan: true, subscriptionStatus: true },
        })
        : null,
      prisma.payment.findFirst({
        where: {
          patientId: userId,
          status: 'COMPLETED',
          deletedAt: null,
          description: { contains: 'Subscription' },
        },
        orderBy: { createdAt: 'desc' },
        select: { amount: true, createdAt: true, description: true },
      }),
    ]);

    const storedPlan = clinic?.subscriptionPlan || doctorProfile?.subscriptionPlan || 'BASIC';
    const plan = storedPlan === 'STARTER' ? 'BASIC' : storedPlan;
    const status = clinic?.subscriptionStatus || doctorProfile?.subscriptionStatus || 'PENDING';
    const expiresAt = doctorProfile?.subscriptionExpiresAt;

    sendSuccess(res, {
      plan,
      status,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      autoRenew: Boolean(doctorProfile?.razorpaySubscriptionId && status === 'ACTIVE'),
      lastPaymentAmount: lastSubscriptionPayment ? Number(lastSubscriptionPayment.amount) : null,
      lastPaymentDate: lastSubscriptionPayment?.createdAt ? lastSubscriptionPayment.createdAt.toISOString() : null,
    }, 'Subscription status retrieved');
  } catch (err: any) {
    next(new AppError(err.message || 'Failed to fetch subscription status', 500));
  }
};

export const createSubscriptionOrderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'DOCTOR' && req.user?.role !== 'ADMIN') {
      throw new AppError('Only doctors can upgrade subscription', 403);
    }
    await ensureCanManageSubscription(req);
    const { error, value } = createSubscriptionOrderSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const duration = value.duration || 1; // Default to 1 month
    const baseAmount = PLAN_AMOUNTS[value.planId] ?? 1;
    let multiplier = duration;

    // Apply yearly discount (pay for 10 months, get 12)
    if (duration === 12) {
      multiplier = 10;
    }

    const totalAmount = baseAmount * multiplier;

    const options: any = {
      amount: totalAmount * 100, // paise
      currency: 'INR',
      receipt: `sub_${Date.now()}_${req.user!.id.substring(0, 8)}`,
      notes: {
        type: 'SUBSCRIPTION_UPGRADE',
        userId: req.user!.id,
        planId: value.planId,
        duration: String(duration)
      },
    };

    const order = await razorpay.orders.create(options);

    sendSuccess(
      res,
      {
        orderId: order.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        planId: value.planId,
      },
      'Order created for subscription',
      201
    );
  } catch (err: any) {
    next(new AppError(err.message || 'Failed to create subscription order', 500));
  }
};

export const verifySubscriptionOrderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'DOCTOR' && req.user?.role !== 'ADMIN') {
      throw new AppError('Only doctors can verify subscription payment', 403);
    }
    await ensureCanManageSubscription(req);
    const { error, value } = verifySubscriptionOrderSchema.validate(req.body);
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
    const notes = (order.notes || {}) as Record<string, string>;
    if (notes.type !== 'SUBSCRIPTION_UPGRADE' || notes.userId !== req.user?.id) {
      throw new AppError('Invalid order or unauthorized', 400);
    }

    const planId = notes.planId as string;
    const userId = notes.userId;
    const duration = parseInt(notes.duration || '1', 10);
    const { clinicDetails } = value;

    if (clinicDetails) {
      const payment = (await razorpay.payments.fetch(razorpay_payment_id)) as any;
      const subscriptionPlan = clinicDetails.subscriptionPlan || planId;
      let expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + duration);

      await syncSubscriptionState({
        userId,
        plan: subscriptionPlan,
        subscriptionId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        expiresAt,
        clinicDetails,
      });

      await recordSubscriptionPayment({
        userId,
        subscriptionId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: Number((payment as any)?.amount || order.amount) / 100,
        plan: subscriptionPlan,
        signature: razorpay_signature,
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { clinicId: true },
      });
      const clinic = user?.clinicId
        ? await prisma.clinic.findUnique({ where: { id: user.clinicId } })
        : null;

      sendSuccess(
        res,
        { planId: subscriptionPlan, status: 'ACTIVE', expiresAt, clinic },
        'Subscription activated successfully'
      );
      return;
    }

    const existingProfile = await prisma.doctorProfile.findUnique({
      where: { userId },
      select: { subscriptionExpiresAt: true, subscriptionStatus: true }
    });

    let expiresAt = existingProfile?.subscriptionExpiresAt && existingProfile.subscriptionExpiresAt > new Date()
      ? new Date(existingProfile.subscriptionExpiresAt)
      : new Date();

    // Add duration to the calculated start time
    expiresAt.setMonth(expiresAt.getMonth() + duration);

    await prisma.doctorProfile.upsert({
      where: { userId },
      create: {
        userId,
        licenseNumber: `LIC-${userId.substring(0, 8)}`,
        specialization: 'General',
        subscriptionPlan: planId,
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiresAt,
      },
      update: {
        subscriptionPlan: planId,
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiresAt,
      },
    });

    if (req.user?.clinicId) {
      await prisma.clinic.update({
        where: { id: req.user.clinicId },
        data: {
          subscriptionPlan: planId,
          subscriptionStatus: 'ACTIVE',
        },
      });
    }

    await createPayment({
      patientId: userId,
      amount: Number(order.amount) / 100,
      currency: 'INR',
      method: 'RAZORPAY_ONLINE',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'COMPLETED',
      description: `Subscription: ${planId}`,
    });

    sendSuccess(res, { planId, status: 'ACTIVE', expiresAt }, 'Subscription activated successfully');
  } catch (err: any) {
    next(new AppError(err.message || 'Subscription verification failed', 500));
  }
};

export const cancelSubscriptionStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'DOCTOR' && req.user?.role !== 'ADMIN') {
      throw new AppError('Only doctors can cancel subscription', 403);
    }
    await ensureCanManageSubscription(req);
    const userId = req.user!.id;

    const profile = await prisma.doctorProfile.findUnique({
      where: { userId },
      select: { razorpaySubscriptionId: true },
    });

    if (profile?.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(profile.razorpaySubscriptionId, false);
      } catch (err) {
        console.error('Failed to cancel Razorpay subscription', err);
        throw new AppError('Failed to cancel auto-payment at Razorpay', 502);
      }
    }

    await prisma.doctorProfile.updateMany({
      where: { userId },
      data: { subscriptionStatus: 'PENDING', subscriptionPlan: 'BASIC' },
    });

    if (req.user?.clinicId) {
      await prisma.clinic.update({
        where: { id: req.user.clinicId },
        data: { subscriptionStatus: 'PENDING', subscriptionPlan: 'BASIC' },
      });
    }

    sendSuccess(res, { status: 'CANCELLED' }, 'Monthly auto-payment cancellation scheduled');
  } catch (err: any) {
    next(new AppError(err.message || 'Failed to cancel subscription', 500));
  }
};

// Razorpay Subscription Integration (auto-debit monthly billing)
const createRazorpaySubscriptionSchema = Joi.object({
  plan: Joi.string().valid('BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
});

const verifyRazorpaySubscriptionSchema = Joi.object({
  razorpay_payment_id: Joi.string().required(),
  razorpay_subscription_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  plan: Joi.string().valid('BASIC', 'PROFESSIONAL', 'ENTERPRISE').optional(),
  clinicDetails: clinicDetailsSchema.optional(),
});

const RAZORPAY_MONTHLY_PLAN_ENV: Record<string, string> = {
  BASIC: 'RAZORPAY_PLAN_BASIC',
  PROFESSIONAL: 'RAZORPAY_PLAN_PROFESSIONAL',
  ENTERPRISE: 'RAZORPAY_PLAN_ENTERPRISE',
};

const RAZORPAY_MONTHLY_PLAN_CONFIG: Record<string, {
  name: string;
  amount: number;
  description: string;
}> = {
  BASIC: {
    name: 'PulseCal Basic Monthly',
    amount: 149900,
    description: 'Basic plan for small clinics (Up to 3 Doctors)',
  },
  PROFESSIONAL: {
    name: 'PulseCal Professional Monthly',
    amount: 299900,
    description: 'Professional plan for growing clinics (Up to 10 Doctors, Unlimited Appointments)',
  },
  ENTERPRISE: {
    name: 'PulseCal Enterprise Monthly',
    amount: 499900,
    description: 'Enterprise solution (Unlimited Doctors)',
  },
};

const getRazorpayMonthlyPlanId = async (plan: string): Promise<string> => {
  const envKey = RAZORPAY_MONTHLY_PLAN_ENV[plan];
  const planId = envKey ? process.env[envKey] : undefined;
  if (planId && planId.startsWith('plan_') && !planId.includes('_monthly')) {
    try {
      const configuredPlan = await (razorpay.plans.fetch(planId) as Promise<any>);
      if (configuredPlan?.id) {
        return configuredPlan.id;
      }
    } catch (err) {
      logger.warn(
        { err, plan, planId, envKey },
        'Configured Razorpay plan ID is not valid for the current Razorpay keys. Falling back to lookup/create.'
      );
    }
  }

  const config = RAZORPAY_MONTHLY_PLAN_CONFIG[plan];
  if (!config) throw new AppError(`Invalid Razorpay subscription plan: ${plan}`, 400);

  const plansResponse = await (razorpay.plans.all({
    count: 100,
  } as any) as Promise<any>);
  const existingPlan = (plansResponse.items || []).find((item: any) =>
    item?.period === 'monthly' &&
    item?.interval === 1 &&
    Number(item?.item?.amount) === config.amount &&
    item?.notes?.plan_type === plan &&
    item?.notes?.billing_cycle === 'MONTHLY'
  );

  if (existingPlan?.id) {
    logger.warn(
      { plan, planId: existingPlan.id, envKey },
      `Using existing Razorpay monthly plan. Add ${envKey}=${existingPlan.id} to .env to skip lookup.`
    );
    return existingPlan.id;
  }

  const createdPlan = await (razorpay.plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name: config.name,
      amount: config.amount,
      currency: 'INR',
      description: config.description,
    },
    notes: {
      plan_type: plan,
      billing_cycle: 'MONTHLY',
    },
  } as any) as Promise<any>);

  logger.warn(
    { plan, planId: createdPlan.id, envKey },
    `Created Razorpay monthly plan automatically. Add ${envKey}=${createdPlan.id} to .env.`
  );

  return createdPlan.id;
};

const toDateFromRazorpaySeconds = (value?: number | null): Date | null => {
  if (!value) return null;
  return new Date(value * 1000);
};

const oneMonthFrom = (from: Date): Date => {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
};

const syncSubscriptionState = async (data: {
  userId: string;
  plan: string;
  subscriptionId: string;
  paymentId?: string;
  expiresAt?: Date | null;
  status?: 'ACTIVE' | 'PENDING' | 'EXPIRED';
  clinicDetails?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    latitude?: number | null;
    longitude?: number | null;
  };
}) => {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, clinicId: true, firebaseUid: true },
  });
  if (!user) throw new AppError('Subscription user not found', 404);

  let clinicId = user.clinicId;
  if (!clinicId && data.clinicDetails) {
    const clinic = await prisma.clinic.create({
      data: {
        ownerId: data.userId,
        name: data.clinicDetails.name,
        address: data.clinicDetails.address,
        city: data.clinicDetails.city,
        state: data.clinicDetails.state,
        zipCode: data.clinicDetails.zipCode,
        country: data.clinicDetails.country,
        phone: data.clinicDetails.phone,
        email: data.clinicDetails.email,
        latitude: data.clinicDetails.latitude ?? null,
        longitude: data.clinicDetails.longitude ?? null,
        subscriptionPlan: data.plan,
        subscriptionStatus: data.status || 'ACTIVE',
        razorpayOrderId: data.subscriptionId,
        razorpayPaymentId: data.paymentId,
        staff: { connect: { id: data.userId } },
      },
    });
    clinicId = clinic.id;

    await prisma.user.update({
      where: { id: data.userId },
      data: { clinicId, onboardingCompleted: true, role: 'DOCTOR' },
    });

    if (user.firebaseUid) {
      try {
        await admin.auth().setCustomUserClaims(user.firebaseUid, { role: 'DOCTOR' });
      } catch (err) {
        console.error('Firebase role sync failed', err);
      }
    }
  } else if (clinicId) {
    await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        subscriptionPlan: data.plan,
        subscriptionStatus: data.status || 'ACTIVE',
        razorpayOrderId: data.subscriptionId,
        razorpayPaymentId: data.paymentId,
      },
    });
  }

  const clinicAddress = data.clinicDetails
    ? [data.clinicDetails.address, data.clinicDetails.city, data.clinicDetails.state, data.clinicDetails.zipCode]
      .filter(Boolean)
      .join(', ')
    : undefined;

  await prisma.doctorProfile.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      licenseNumber: `LIC-${data.userId.substring(0, 8)}`,
      specialization: 'General',
      subscriptionPlan: data.plan,
      subscriptionStatus: data.status || 'ACTIVE',
      subscriptionExpiresAt: data.expiresAt || oneMonthFrom(new Date()),
      razorpaySubscriptionId: data.subscriptionId,
      ...(data.clinicDetails ? {
        clinicName: data.clinicDetails.name,
        clinicAddress,
        clinicLatitude: data.clinicDetails.latitude ?? null,
        clinicLongitude: data.clinicDetails.longitude ?? null,
      } : {}),
    },
    update: {
      subscriptionPlan: data.plan,
      subscriptionStatus: data.status || 'ACTIVE',
      subscriptionExpiresAt: data.expiresAt || oneMonthFrom(new Date()),
      razorpaySubscriptionId: data.subscriptionId,
      ...(data.clinicDetails ? {
        clinicName: data.clinicDetails.name,
        clinicAddress,
        clinicLatitude: data.clinicDetails.latitude ?? null,
        clinicLongitude: data.clinicDetails.longitude ?? null,
      } : {}),
    },
  });
};

const recordSubscriptionPayment = async (data: {
  userId: string;
  subscriptionId: string;
  paymentId: string;
  amount: number;
  plan: string;
  status?: 'COMPLETED' | 'FAILED';
  signature?: string;
}) => {
  const existing = await prisma.payment.findFirst({
    where: {
      razorpayPaymentId: data.paymentId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (existing) return;

  await createPayment({
    patientId: data.userId,
    amount: data.amount,
    currency: 'INR',
    method: 'RAZORPAY_ONLINE',
    transactionId: data.paymentId,
    razorpayOrderId: data.subscriptionId,
    razorpayPaymentId: data.paymentId,
    razorpaySignature: data.signature,
    status: data.status || 'COMPLETED',
    description: `Auto subscription payment for ${data.plan} plan (${data.subscriptionId})`,
  });
};

const createMonthlySubscriptionOrder = async (userId: string, plan: string) => {
  const baseAmount = PLAN_AMOUNTS[plan] ?? PLAN_AMOUNTS.BASIC;
  const order = await razorpay.orders.create({
    amount: baseAmount * 100,
    currency: 'INR',
    receipt: `sub_${Date.now()}_${userId.substring(0, 8)}`,
    notes: {
      type: 'SUBSCRIPTION_UPGRADE',
      userId,
      planId: plan,
      duration: '1',
    },
  });

  return {
    orderId: order.id,
    key: process.env.RAZORPAY_KEY_ID,
    amount: order.amount,
    plan,
  };
};

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
    await ensureCanManageSubscription(req);

    // Prefer Razorpay Subscriptions (true monthly auto-debit) when the account supports it.
    try {
      const razorpayPlanId = await getRazorpayMonthlyPlanId(value.plan);
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_notify: 1,
        total_count: 120,
        quantity: 1,
        notes: {
          userId: req.user.id,
          planType: value.plan,
          billingCycle: 'MONTHLY',
        },
      });

      sendSuccess(
        res,
        {
          mode: 'subscription',
          subscriptionId: subscription.id,
          key: process.env.RAZORPAY_KEY_ID,
          plan: value.plan,
          billingCycle: 'MONTHLY',
        },
        'Monthly auto-payment subscription created successfully',
        201
      );
      return;
    } catch (subscriptionErr: any) {
      logger.warn(
        { err: subscriptionErr, plan: value.plan, userId: req.user.id },
        'Razorpay subscription API unavailable; falling back to one-time order checkout'
      );
    }

    // Fallback: same one-time order flow used by signup (works with standard Razorpay keys).
    const orderCheckout = await createMonthlySubscriptionOrder(req.user.id, value.plan);
    sendSuccess(
      res,
      {
        mode: 'order',
        ...orderCheckout,
      },
      'Subscription payment order created successfully',
      201
    );
  } catch (err: any) {
    console.error('Subscription checkout creation error:', err);
    if (err instanceof AppError) {
      next(err);
      return;
    }

    const razorpayMessage =
      err?.error?.description ||
      err?.error?.reason ||
      err?.error?.field ||
      err?.description ||
      err?.message ||
      'Failed to create subscription';
    next(new AppError(`Payment setup failed: ${razorpayMessage}`, 500));
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

    const [subscription, payment] = await Promise.all([
      razorpay.subscriptions.fetch(razorpay_subscription_id) as Promise<any>,
      razorpay.payments.fetch(razorpay_payment_id) as Promise<any>,
    ]);
    const notes = (subscription?.notes || {}) as Record<string, string>;
    const subscriptionPlan = value.plan || clinicDetails?.subscriptionPlan || notes.planType;
    if (!subscriptionPlan) throw new AppError('Subscription plan missing from Razorpay subscription', 400);
    if (notes.userId && notes.userId !== req.user.id) throw new AppError('Subscription belongs to another user', 403);

    await syncSubscriptionState({
      userId: req.user.id,
      plan: subscriptionPlan,
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      expiresAt: toDateFromRazorpaySeconds(subscription?.current_end) || oneMonthFrom(new Date()),
      clinicDetails,
    });

    await recordSubscriptionPayment({
      userId: req.user.id,
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      amount: Number(payment?.amount || 0) / 100,
      plan: subscriptionPlan,
      signature: razorpay_signature,
    });

    sendSuccess(res, { subscriptionId: razorpay_subscription_id }, 'Monthly auto-payment subscription activated successfully');

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

export const razorpayWebhookController = async (
  req: Request & { rawBody?: string },
  res: Response
): Promise<void> => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(500).json({ success: false, message: 'Razorpay webhook secret not configured' });
    return;
  }

  const rawBody = req.rawBody || JSON.stringify(req.body);
  const signature = req.get('x-razorpay-signature') || '';
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    res.status(400).json({ success: false, message: 'Invalid Razorpay webhook signature' });
    return;
  }

  const event = req.body?.event as string | undefined;
  const subscription = req.body?.payload?.subscription?.entity;
  const payment = req.body?.payload?.payment?.entity;
  const subscriptionId = subscription?.id || payment?.subscription_id;

  try {
    if (!subscriptionId) {
      res.status(200).json({ success: true, ignored: true });
      return;
    }

    const profile = await prisma.doctorProfile.findFirst({
      where: { razorpaySubscriptionId: subscriptionId },
      select: { userId: true, subscriptionPlan: true },
    });
    const notes = (subscription?.notes || {}) as Record<string, string>;
    const userId = notes.userId || profile?.userId;
    const plan = notes.planType || profile?.subscriptionPlan;

    if (!userId || !plan) {
      logger.warn({ event, subscriptionId }, 'Razorpay webhook ignored: subscription owner not found');
      res.status(200).json({ success: true, ignored: true });
      return;
    }

    if (event === 'subscription.charged' || event === 'payment.captured') {
      await syncSubscriptionState({
        userId,
        plan,
        subscriptionId,
        paymentId: payment?.id,
        expiresAt: toDateFromRazorpaySeconds(subscription?.current_end) || oneMonthFrom(new Date()),
      });

      if (payment?.id) {
        await recordSubscriptionPayment({
          userId,
          subscriptionId,
          paymentId: payment.id,
          amount: Number(payment.amount || 0) / 100,
          plan,
        });
      }
    } else if (
      event === 'subscription.cancelled' ||
      event === 'subscription.halted' ||
      event === 'subscription.completed'
    ) {
      await syncSubscriptionState({
        userId,
        plan,
        subscriptionId,
        expiresAt: toDateFromRazorpaySeconds(subscription?.current_end),
        status: 'EXPIRED',
      });
    } else if (event === 'subscription.activated' || event === 'subscription.resumed') {
      await syncSubscriptionState({
        userId,
        plan,
        subscriptionId,
        expiresAt: toDateFromRazorpaySeconds(subscription?.current_end) || oneMonthFrom(new Date()),
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error(err, 'Razorpay webhook processing failed');
    res.status(500).json({ success: false });
  }
};
