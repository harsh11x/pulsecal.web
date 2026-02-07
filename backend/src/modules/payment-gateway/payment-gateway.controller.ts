import { Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Joi from 'joi';
import { AuthRequest } from '../../middlewares/firebaseAuth.middleware';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { logger } from '../../utils/logger';
import prisma from '../../config/database';
import admin from '../../config/firebase';
import { createPayment } from '../payments/payments.service';

// Validate Environment Variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.error('CRITICAL: Razorpay keys are missing from environment variables');
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'missing_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'missing_secret',
});

// Schemas
const createOrderSchema = Joi.object({
    plan: Joi.string().valid('STARTER', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
    billingCycle: Joi.string().valid('MONTHLY', 'YEARLY').default('MONTHLY'),
});

const verifyPaymentSchema = Joi.object({
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
        subscriptionPlan: Joi.string().valid('STARTER', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE').required(),
    }).optional(),
    plan: Joi.string().valid('STARTER', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE').optional(),
    billingCycle: Joi.string().valid('MONTHLY', 'YEARLY').default('MONTHLY'),
});

export const createOrder = async (req: AuthRequest, res: Response, _next: NextFunction) => {
    try {
        logger.info(`PaymentGateway: Received Create Order Request from User ${req.user?.id}`);

        const { error, value } = createOrderSchema.validate(req.body);
        if (error) {
            logger.warn(`PaymentGateway: Validation Error: ${error.details[0].message}`);
            return sendError(res, error.details[0].message, 400);
        }

        const planPricing: Record<string, number> = {
            STARTER: 99900, // ₹999
            BASIC: 149900, // ₹1499
            PROFESSIONAL: 299900, // ₹2999
            ENTERPRISE: 999900, // ₹9999
        };

        let amount = planPricing[value.plan];
        if (!amount) {
            return sendError(res, 'Invalid subscription plan', 400);
        }

        // Apply yearly multiplier (10 months instead of 12 = 2 months free)
        if (value.billingCycle === 'YEARLY') {
            amount = amount * 10;
        }

        const options = {
            amount,
            currency: 'INR',
            receipt: `order_${Date.now()}_${req.user?.id?.substring(0, 5)}`,
            notes: {
                userId: req.user?.id,
                plan: value.plan,
            },
        };

        logger.info(`PaymentGateway: Creating Razorpay Order with amount ${amount}`);
        // Cast to any to bypass type mismatch with local Razorpay definitions
        const order = await razorpay.orders.create(options as any) as any;
        logger.info(`PaymentGateway: Order Created: ${order.id}`);

        return sendSuccess(res, {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
        }, 'Order created successfully', 201);

    } catch (err: any) {
        logger.error(err, 'PaymentGateway: Order Creation Failed');
        return sendError(res, err.message || 'Failed to create payment order', 500);
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response, _next: NextFunction) => {
    try {
        logger.info(`PaymentGateway: Received Verification Request from User ${req.user?.id}`);

        const { error, value } = verifyPaymentSchema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, clinicDetails, billingCycle } = value;

        // Determine subscription plan early for logging/logic
        const subscriptionPlan = clinicDetails?.subscriptionPlan || value.plan || 'STARTER';
        const cycle = billingCycle || 'MONTHLY';

        // Verify Signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            logger.error(`PaymentGateway: Signature Mismatch! Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
            return sendError(res, 'Invalid payment signature', 400);
        }

        logger.info('PaymentGateway: Signature Verified. Processing Subscription...');

        // START CLINIC LOGIC
        let clinic: any;
        if (!req.user?.clinicId) {
            // New Registration
            if (!clinicDetails) return sendError(res, 'Clinic details missing', 400);

            logger.info('PaymentGateway: Creating New Clinic...');
            // Using Prisma directly
            clinic = await prisma.clinic.create({
                data: {
                    ownerId: req.user!.id,
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
                    staff: { connect: { id: req.user!.id } }
                }
            });

            // Update User Role explicitly
            await prisma.user.update({
                where: { id: req.user!.id },
                data: {
                    clinicId: clinic.id,
                    onboardingCompleted: true,
                    role: 'DOCTOR'
                }
            });

            // Create Doctor Profile
            const existingProfile = await prisma.doctorProfile.findUnique({
                where: { userId: req.user!.id }
            });

            // Prepare clinic address string
            const fullAddress = [
                clinic.address,
                clinic.city,
                clinic.state,
                clinic.zipCode
            ].filter(Boolean).join(", ");

            if (!existingProfile) {
                await prisma.doctorProfile.create({
                    data: {
                        userId: req.user!.id,
                        licenseNumber: `LIC-${req.user!.id.substring(0, 8).toUpperCase()}`, // Temporary
                        specialization: 'General Practice', // Default
                        clinicName: clinic.name,
                        clinicAddress: fullAddress, // Combined address string
                        clinicLatitude: clinic.latitude ? Number(clinic.latitude) : null,
                        clinicLongitude: clinic.longitude ? Number(clinic.longitude) : null,
                        subscriptionStatus: 'ACTIVE',
                        subscriptionPlan: clinic.subscriptionPlan,
                        consultationFee: 0,
                    }
                });
                logger.info('PaymentGateway: Doctor Profile Created');
            } else {
                // Update existing profile with clinic details
                await prisma.doctorProfile.update({
                    where: { userId: req.user!.id },
                    data: {
                        clinicName: clinic.name,
                        clinicAddress: fullAddress, // Combined address string
                        clinicLatitude: clinic.latitude ? Number(clinic.latitude) : null,
                        clinicLongitude: clinic.longitude ? Number(clinic.longitude) : null,
                        subscriptionStatus: 'ACTIVE',
                        subscriptionPlan: clinic.subscriptionPlan,
                    }
                });
                logger.info('PaymentGateway: Doctor Profile Updated');
            }

            // Update Firebase Claims
            if (req.user!.firebaseUid) {
                try {
                    await admin.auth().setCustomUserClaims(req.user!.firebaseUid, { role: 'DOCTOR' });
                    logger.info('PaymentGateway: Firebase Claims Updated');
                } catch (e) {
                    logger.error(e, 'PaymentGateway: Failed to update Firebase Claims');
                }
            }

        } else {
            // Renewal logic
            logger.info('PaymentGateway: Renewal for existing clinic');
            clinic = await prisma.clinic.update({
                where: { id: req.user.clinicId },
                data: {
                    subscriptionStatus: 'ACTIVE',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id
                }
            });
        }

        // Update Doctor Profile
        const expiryDuration = cycle === 'YEARLY'
            ? 365 * 24 * 60 * 60 * 1000 // 1 Year
            : 30 * 24 * 60 * 60 * 1000; // 30 Days

        await prisma.doctorProfile.upsert({
            where: { userId: req.user!.id },
            update: {
                subscriptionPlan: subscriptionPlan,
                subscriptionStatus: 'ACTIVE',
                subscriptionExpiresAt: new Date(Date.now() + expiryDuration),
                razorpaySubscriptionId: razorpay_payment_id
            },
            create: {
                userId: req.user!.id,
                licenseNumber: `LIC-${req.user!.id.substring(0, 8)}`,
                specialization: 'General',
                subscriptionPlan: subscriptionPlan,
                subscriptionStatus: 'ACTIVE',
                subscriptionExpiresAt: new Date(Date.now() + expiryDuration),
                razorpaySubscriptionId: razorpay_payment_id
            }
        });

        // Create Payment Record (Transaction)
        const planAmounts: Record<string, number> = {
            STARTER: 999,
            BASIC: 1499,
            PROFESSIONAL: 2999,
            ENTERPRISE: 9999,
        };
        let amount = planAmounts[subscriptionPlan] || 1499;

        if (cycle === 'YEARLY') {
            amount = amount * 10;
        }

        await createPayment({
            patientId: req.user!.id,
            amount,
            currency: 'INR',
            method: 'RAZORPAY_ONLINE',
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: 'COMPLETED',
            description: `Subscription payment for ${subscriptionPlan} plan (${cycle}) - Application: PulseCal`,
        });

        logger.info('PaymentGateway: Subscription Processed Successfully');

        return sendSuccess(res, {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            status: 'success'
        }, 'Subscription activated successfully', 200);

    } catch (err: any) {
        logger.error(err, 'PaymentGateway: Verification Failed');
        return sendError(res, err.message || 'Payment verification failed', 500);
    }
};
