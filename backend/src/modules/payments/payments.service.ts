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

  // Role-based filtering
  const userRole = req.user?.role?.toUpperCase();
  const userId = req.user?.id;
  const userClinicId = req.user?.clinicId;

  if (userRole === 'PATIENT') {
    where.patientId = userId;
  } else if (userRole === 'DOCTOR') {
    // Doctor should see payments where they are the recipient (doctorId) OR the payer (patientId - for subscriptions)
    where.OR = [
      { doctorId: userId },
      { patientId: userId }
    ];
  } else if (userRole === 'RECEPTIONIST') {
    if (userClinicId) {
      // Receptionist can see all payments for THEIR clinic
      where.doctor = { clinicId: userClinicId };
      // Allow filtering by doctor within their own clinic
      if (req.query.doctorId) {
        where.doctorId = req.query.doctorId as string;
      }
    } else {
      where.doctorId = 'non-existent';
    }
  } else if (userRole !== 'ADMIN') {
    // Fail-safe: Non-admin users with no specific role/clinic match should see nothing
    where.OR = [{ doctorId: 'non-existent' }, { patientId: 'non-existent' }];
  }

  // Handle explicit patientId filter (for Admins or authorized receptionists)
  if (req.query.patientId && userRole !== 'PATIENT') {
    where.patientId = req.query.patientId as string;
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

  const role = userRole?.toUpperCase();

  if (userId && role !== 'ADMIN') {
    if (role === 'RECEPTIONIST') {
      // Receptionist can see payments for their clinic.
      // We need to check if the payment relates to a doctor in their clinic.
      if (!payment.doctorId) {
        // If no doctor assigned, patients can see it, but receptionists? 
        // Let's assume receptionists only see clinic-scoped payments.
        throw new AppError('Unauthorized: Payment has no clinic affiliation', 403);
      }

      const doctor = await prisma.user.findUnique({
        where: { id: payment.doctorId },
        select: { clinicId: true }
      });

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { clinicId: true } });

      if (!doctor || doctor.clinicId !== user?.clinicId) {
        throw new AppError('Unauthorized: Payment belongs to another clinic', 403);
      }
    } else if (role === 'DOCTOR') {
      // Doctor can see if they are the doctor or the patient
      if (payment.doctorId !== userId && payment.patientId !== userId) {
        throw new AppError('Unauthorized: Not your payment', 403);
      }
    } else if (payment.patientId !== userId) {
      // Patients and any other role
      throw new AppError('Unauthorized', 403);
    }
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

