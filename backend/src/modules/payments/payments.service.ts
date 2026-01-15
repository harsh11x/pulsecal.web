import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';
import { encrypt } from '../../utils/encrypt';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export const createPayment = async (data: {
  patientId: string;
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

  const payment = await prisma.payment.create({
    data: {
      patientId: data.patientId,
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
    status?: string;
  };
  user?: { id: string; role: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    patientId?: string;
    status?: PaymentStatus;
    deletedAt?: null;
  } = {
    deletedAt: null,
  };

  if (req.user?.role === 'PATIENT') {
    where.patientId = req.user.id;
  } else if (req.query.patientId) {
    where.patientId = req.query.patientId;
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

