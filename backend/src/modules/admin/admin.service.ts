import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AuditAction } from '@prisma/client';

export const getAuditLogs = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (req.query.userId) {
    where.userId = req.query.userId;
  }

  if (req.query.action) {
    where.action = req.query.action as AuditAction;
  }

  if (req.query.resourceType) {
    where.resourceType = req.query.resourceType;
  }

  if (req.query.startDate || req.query.endDate) {
    where.createdAt = {};
    if (req.query.startDate) {
      where.createdAt.gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      where.createdAt.lte = new Date(req.query.endDate);
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSystemStats = async () => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAppointments,
    activeAppointments,
    totalMedicalRecords,
    totalPrescriptions,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: 'PATIENT', deletedAt: null } }),
    prisma.user.count({ where: { role: 'DOCTOR', deletedAt: null } }),
    prisma.appointment.count({ where: { deletedAt: null } }),
    prisma.appointment.count({
      where: {
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        deletedAt: null,
      },
    }),
    prisma.medicalRecord.count({ where: { deletedAt: null } }),
    prisma.prescription.count({ where: { deletedAt: null } }),
  ]);

  return {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalClinics: await prisma.clinic.count({ where: { deletedAt: null } }),
    totalAppointments,
    activeAppointments,
    totalMedicalRecords,
    totalPrescriptions,
  };
};

// Get all clinics with stats for admin dashboard
export const getAllClinicsWithStats = async (req: {
  query: {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
  };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);

  const where: {
    deletedAt?: null;
    name?: { contains: string; mode: 'insensitive' };
    subscriptionStatus?: string;
  } = {
    deletedAt: null,
  };

  if (req.query.search) {
    where.name = { contains: req.query.search, mode: 'insensitive' };
  }

  if (req.query.status) {
    where.subscriptionStatus = req.query.status;
  }

  const clinics = await prisma.clinic.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      staff: {
        where: { deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Calculate stats for each clinic
  const clinicsWithStats = await Promise.all(
    clinics.map(async (clinic) => {
      const doctorIds = clinic.staff
        .filter((s) => s.role === 'DOCTOR')
        .map((s) => s.id);

      const [totalBookings, pastBookings, futureBookings, totalRevenue] =
        await Promise.all([
          prisma.appointment.count({
            where: {
              doctorId: { in: doctorIds },
              deletedAt: null,
            },
          }),
          prisma.appointment.count({
            where: {
              doctorId: { in: doctorIds },
              scheduledAt: { lt: new Date() },
              deletedAt: null,
            },
          }),
          prisma.appointment.count({
            where: {
              doctorId: { in: doctorIds },
              scheduledAt: { gte: new Date() },
              deletedAt: null,
            },
          }),
          prisma.payment.aggregate({
            where: {
              doctorId: { in: doctorIds },
              status: 'COMPLETED',
              deletedAt: null,
            },
            _sum: { amount: true },
          }),
        ]);

      return {
        id: clinic.id,
        name: clinic.name,
        city: clinic.city,
        state: clinic.state,
        phone: clinic.phone,
        email: clinic.email,
        subscriptionPlan: clinic.subscriptionPlan,
        subscriptionStatus: clinic.subscriptionStatus,
        isActive: clinic.isActive,
        createdAt: clinic.createdAt,
        doctorCount: clinic.staff.filter((s) => s.role === 'DOCTOR').length,
        receptionistCount: clinic.staff.filter((s) => s.role === 'RECEPTIONIST').length,
        totalBookings,
        pastBookings,
        futureBookings,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
      };
    })
  );

  const total = await prisma.clinic.count({ where });

  return {
    clinics: clinicsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get detailed clinic info for admin
export const getClinicDetails = async (clinicId: string) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      staff: {
        where: { deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          profileImage: true,
          createdAt: true,
          doctorProfile: {
            select: {
              specialization: true,
              consultationFee: true,
              subscriptionStatus: true,
            },
          },
        },
      },
    },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  const doctorIds = clinic.staff.filter((s) => s.role === 'DOCTOR').map((s) => s.id);

  // Get appointments
  const [pastAppointments, futureAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: { in: doctorIds },
        scheduledAt: { lt: new Date() },
        deletedAt: null,
      },
      take: 50,
      orderBy: { scheduledAt: 'desc' },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId: { in: doctorIds },
        scheduledAt: { gte: new Date() },
        deletedAt: null,
      },
      take: 50,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
  ]);

  // Get revenue stats
  const payments = await prisma.payment.findMany({
    where: {
      doctorId: { in: doctorIds },
      status: 'COMPLETED',
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      amount: true,
      currency: true,
      method: true,
      description: true,
      createdAt: true,
    },
  });

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    ...clinic,
    doctors: clinic.staff.filter((s) => s.role === 'DOCTOR'),
    receptionists: clinic.staff.filter((s) => s.role === 'RECEPTIONIST'),
    stats: {
      totalDoctors: clinic.staff.filter((s) => s.role === 'DOCTOR').length,
      totalReceptionists: clinic.staff.filter((s) => s.role === 'RECEPTIONIST').length,
      totalPastAppointments: pastAppointments.length,
      totalFutureAppointments: futureAppointments.length,
      totalRevenue,
    },
    pastAppointments,
    futureAppointments,
    recentPayments: payments,
  };
};
