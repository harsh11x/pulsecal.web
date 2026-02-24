import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';
import { encrypt } from '../../utils/encrypt';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export const createPayment = async (data: {
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  amount: number;
  currency?: string;
  method: string;
  cardData?: string;
  description?: string;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
}) => {
  const encryptedCardData = data.cardData ? encrypt(data.cardData) : null;
  const status = data.status || 'PENDING';

  let doctorId = data.doctorId;

  // If appointmentId is provided but doctorId is not, fetch it from the appointment
  if (data.appointmentId && !doctorId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      select: { doctorId: true }
    });
    if (appointment) {
      doctorId = appointment.doctorId;
    }
  }

  const payment = await prisma.payment.create({
    data: {
      patientId: data.patientId,
      doctorId,
      appointmentId: data.appointmentId,
      amount: data.amount,
      currency: data.currency || 'INR',
      method: data.method as PaymentMethod,
      encryptedCardData,
      description: data.description,
      transactionId: data.transactionId,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      status,
      paidAt: status === 'COMPLETED' ? new Date() : undefined,
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return payment;
};

export const getPayments = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    patientId?: string;
    doctorId?: string;
    status?: string;
  };
  user?: { id: string; role: string; clinicId?: string | null };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: any = {
    deletedAt: null,
  };

  if (req.user?.role === 'PATIENT') {
    where.patientId = req.user.id;
  } else if (req.user?.role === 'DOCTOR') {
    // Doctor should see payments where they are the recipient (doctorId) OR the payer (patientId - for subscriptions)
    where.OR = [
      { doctorId: req.user.id },
      { patientId: req.user.id }
    ];
  } else if (req.user?.role === 'RECEPTIONIST' && req.user.clinicId) {
    // Receptionist can see all payments for THEIR clinic
    where.doctor = { clinicId: req.user.clinicId };
  } else if (req.user?.role !== 'ADMIN') {
    // Fail-safe: Non-admin users with no specific role/clinic match should see nothing
    where.OR = [{ doctorId: 'non-existent' }, { patientId: 'non-existent' }];
  }

  if (req.query.patientId) {
    // Patients can only see their own payments
    if (req.user?.role === 'PATIENT' && req.query.patientId !== req.user.id) {
      where.patientId = 'non-existent';
    } else {
      where.patientId = req.query.patientId;
    }
  }

  if (req.query.doctorId) {
    // Doctors can only see their own receipts/payments
    if (req.user?.role === 'DOCTOR' && req.query.doctorId !== req.user.id) {
      // Note: Doctors might see payments where they are patientId=userId (subscriptions)
      // so we keep the OR logic but restrict the doctorId filter part
      where.doctorId = req.user.id;
    } else if (req.user?.role === 'RECEPTIONIST' && req.user.clinicId) {
      // Receptionists can filter by doctor, but ONLY within their clinic
      where.doctorId = req.query.doctorId;
      where.doctor = { clinicId: req.user.clinicId };
    } else {
      where.doctorId = req.query.doctorId;
    }
  }

  if (req.query.status) {
    where.status = req.query.status as PaymentStatus;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPaymentById = async (
  paymentId: string,
  userId?: string,
  userRole?: string
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (
    userId &&
    userRole !== 'ADMIN' &&
    userRole !== 'RECEPTIONIST' &&
    payment.patientId !== userId
  ) {
    throw new AppError('Unauthorized', 403);
  }

  return payment;
};

export const updatePaymentStatus = async (
  paymentId: string,
  status: string,
  transactionId?: string
) => {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: status as PaymentStatus,
      transactionId,
      paidAt: status === 'COMPLETED' ? new Date() : undefined,
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return payment;
};

export const deletePayment = async (paymentId: string) => {
  await prisma.payment.update({
    where: { id: paymentId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Payment deleted successfully' };
};

