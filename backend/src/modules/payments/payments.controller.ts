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

// Razorpay Integration Controllers

const createRazorpayOrderSchema = Joi.object({
  plan: Joi.string().valid('STARTER', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
});

const verifyRazorpayPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  plan: Joi.string().valid('STARTER', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE').optional(),
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
  }).optional(), // Made optional to handle cases where clinic already exists
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
      STARTER: 100, // ₹1/month - Solo practitioner plan
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

    // Determine if this is a new clinic registration or a renewal
    const isNewRegistration = !req.user.clinicId;
    let clinic;

    if (isNewRegistration) {
      if (!clinicDetails) {
        throw new AppError('Clinic details are required for new clinic registration', 400);
      }

      const { createClinic } = await import('../clinics/clinics.service');

      // Create new clinic
      clinic = await createClinic({
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
        subscriptionPlan: clinicDetails.subscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      // Link user to clinic
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          clinicId: clinic.id,
          onboardingCompleted: true,
          role: 'DOCTOR',
        },
      });

      // Sync role to Firebase Custom Claims
      try {
        if (req.user.firebaseUid) {
          await admin.auth().setCustomUserClaims(req.user.firebaseUid, { role: 'DOCTOR' });
          console.log(`Synced DOCTOR role to Firebase for user ${req.user.id}`);
        }
      } catch (firebaseError) {
        console.error('Failed to sync Firestore role:', firebaseError);
      }

    } else {
      // Existing clinic renewal - check if user already has a clinic
      // Note: In real scenarios we might want to allow updating the plan here
      // For now, we just acknowledge the payment for the existing clinic
      clinic = await prisma.clinic.findUnique({ where: { id: req.user.clinicId! } });
      if (!clinic) {
        // Edge case: User has clinicId but clinic not found
        if (!clinicDetails) {
          throw new AppError('Clinic details required as associated clinic not found', 400);
        }
        // Logic to recreate would go here, but for now treating as error or fallback to create
        const { createClinic } = await import('../clinics/clinics.service');
        clinic = await createClinic({ ...clinicDetails, subscriptionStatus: 'ACTIVE', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id });
        await prisma.user.update({ where: { id: req.user.id }, data: { clinicId: clinic.id, role: 'DOCTOR' } });
      }
    }

    const subscriptionPlan = clinicDetails?.subscriptionPlan || value.plan || 'STARTER';

    // Update or create doctor profile with subscription status
    const existingDoctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (existingDoctorProfile) {
      await prisma.doctorProfile.update({
        where: { userId: req.user.id },
        data: {
          subscriptionPlan: subscriptionPlan,
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          razorpaySubscriptionId: razorpay_payment_id,
          // Only update clinic info if provided (i.e. if it was a new registration/update)
          ...(clinicDetails ? {
            clinicName: clinicDetails.name,
            clinicAddress: `${clinicDetails.address}, ${clinicDetails.city}, ${clinicDetails.state} ${clinicDetails.zipCode}`,
          } : {})
        },
      });
    } else {
      // Create doctor profile if it doesn't exist
      await prisma.doctorProfile.create({
        data: {
          userId: req.user.id,
          licenseNumber: `LIC-${req.user.id.substring(0, 8)}`,
          specialization: 'General',
          subscriptionPlan: subscriptionPlan,
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          razorpaySubscriptionId: razorpay_payment_id,
          ...(clinicDetails ? {
            clinicName: clinicDetails.name,
            clinicAddress: `${clinicDetails.address}, ${clinicDetails.city}, ${clinicDetails.state} ${clinicDetails.zipCode}`,
          } : {})
        },
      });
    }

    // Calculate the actual amount paid based on the plan
    const planAmounts: Record<string, number> = {
      STARTER: 1,
      BASIC: 1499,
      PROFESSIONAL: 2999,
      ENTERPRISE: 4999,
    };
    const amount = planAmounts[subscriptionPlan] || 1499;

    // Create payment record with COMPLETED status
    await createPayment({
      patientId: req.user.id,
      amount,
      currency: 'INR',
      method: 'RAZORPAY_ONLINE',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'COMPLETED',
      description: `Subscription payment for ${subscriptionPlan} plan - Application: PulseCal`,
    });

    sendSuccess(
      res,
      {
        clinic,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        subscriptionStatus: 'ACTIVE',
        message: 'Payment verified and subscription activated successfully!',
      },
      'Payment verified successfully',
      201
    );
  } catch (err: any) {
    console.error('Razorpay payment verification error:', err);
    next(new AppError(err.message || 'Payment verification failed', 500));
  }
};
