import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Get doctor analytics including revenue, appointments, and trends
 */
export const getDoctorAnalytics = async (doctorId: string, period: 'day' | 'week' | 'month' | '3months' | 'year' = 'day') => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '3months':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Get appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: startDate },
      deletedAt: null,
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

  // Get payments for completed appointments
  const completedAppointmentIds = appointments
    .filter(apt => apt.status === 'COMPLETED')
    .map(apt => apt.id);

  const payments = await prisma.payment.findMany({
    where: {
      appointmentId: { in: completedAppointmentIds },
      status: 'COMPLETED',
    },
  });

  // Calculate metrics
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledAt);
    return aptDate.toDateString() === now.toDateString();
  }).length;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayAppointments = await prisma.appointment.count({
    where: {
      doctorId,
      scheduledAt: {
        gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      },
      deletedAt: null,
    },
  });

  const confirmedAppointments = appointments.filter(apt => 
    ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(apt.status)
  ).length;

  const cancelledAppointments = appointments.filter(apt => 
    apt.status === 'CANCELLED'
  ).length;

  const totalRevenue = payments.reduce((sum, payment) => 
    sum + Number(payment.amount), 0
  );

  // Today's revenue
  const todayPayments = payments.filter(payment => {
    const paidDate = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt);
    return paidDate.toDateString() === now.toDateString();
  });
  const todayRevenue = todayPayments.reduce((sum, payment) => 
    sum + Number(payment.amount), 0
  );

  // Yesterday's revenue
  const yesterdayPayments = await prisma.payment.findMany({
    where: {
      appointmentId: { in: completedAppointmentIds },
      status: 'COMPLETED',
      paidAt: {
        gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      },
    },
  });
  const yesterdayRevenue = yesterdayPayments.reduce((sum, payment) => 
    sum + Number(payment.amount), 0
  );

  // Revenue trends by day/week/month
  const revenueTrends = await getRevenueTrends(doctorId, period, startDate);

  // Appointment trends
  const appointmentTrends = await getAppointmentTrends(doctorId, period, startDate);

  // Patient growth
  const patientGrowth = await getPatientGrowth(doctorId, period, startDate);

  // Cancellation rate
  const cancellationRate = totalAppointments > 0 
    ? (cancelledAppointments / totalAppointments) * 100 
    : 0;

  return {
    period,
    summary: {
      totalAppointments,
      todayAppointments,
      yesterdayAppointments,
      confirmedAppointments,
      cancelledAppointments,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      todayRevenue: Number(todayRevenue.toFixed(2)),
      yesterdayRevenue: Number(yesterdayRevenue.toFixed(2)),
      revenueChange: yesterdayRevenue > 0 
        ? Number((((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(2))
        : 0,
      cancellationRate: Number(cancellationRate.toFixed(2)),
      totalPatients: new Set(appointments.map(apt => apt.patientId)).size,
    },
    trends: {
      revenue: revenueTrends,
      appointments: appointmentTrends,
      patientGrowth,
    },
  };
};

/**
 * Get revenue trends for a period
 */
const getRevenueTrends = async (doctorId: string, period: string, startDate: Date) => {
  const payments = await prisma.payment.findMany({
    where: {
      appointment: {
        doctorId,
        status: 'COMPLETED',
        scheduledAt: { gte: startDate },
      },
      status: 'COMPLETED',
    },
    select: {
      amount: true,
      paidAt: true,
      createdAt: true,
    },
  });

  const trends: { date: string; revenue: number }[] = [];
  const now = new Date();

  if (period === 'day') {
    // Hourly breakdown for today
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(now);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const hourRevenue = payments
        .filter(p => {
          const paidDate = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
          return paidDate >= hourStart && paidDate < hourEnd;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      trends.push({
        date: hourStart.toISOString(),
        revenue: Number(hourRevenue.toFixed(2)),
      });
    }
  } else if (period === 'week' || period === 'month') {
    // Daily breakdown
    const days = period === 'week' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRevenue = payments
        .filter(p => {
          const paidDate = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
          return paidDate >= date && paidDate < nextDate;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      trends.push({
        date: date.toISOString(),
        revenue: Number(dayRevenue.toFixed(2)),
      });
    }
  } else if (period === '3months' || period === 'year') {
    // Weekly or monthly breakdown
    const intervals = period === '3months' ? 12 : 12; // 12 weeks or 12 months
    const intervalType = period === '3months' ? 'week' : 'month';

    for (let i = intervals - 1; i >= 0; i--) {
      const date = new Date(now);
      if (intervalType === 'week') {
        date.setDate(date.getDate() - (i * 7));
      } else {
        date.setMonth(date.getMonth() - i);
      }
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      if (intervalType === 'week') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const intervalRevenue = payments
        .filter(p => {
          const paidDate = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
          return paidDate >= date && paidDate < nextDate;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      trends.push({
        date: date.toISOString(),
        revenue: Number(intervalRevenue.toFixed(2)),
      });
    }
  }

  return trends;
};

/**
 * Get appointment trends
 */
const getAppointmentTrends = async (doctorId: string, period: string, startDate: Date) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: startDate },
      deletedAt: null,
    },
    select: {
      scheduledAt: true,
      status: true,
    },
  });

  const trends: { date: string; scheduled: number; confirmed: number; completed: number; cancelled: number }[] = [];
  const now = new Date();

  if (period === 'day') {
    // Hourly breakdown
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(now);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const hourApps = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledAt);
        return aptDate >= hourStart && aptDate < hourEnd;
      });

      trends.push({
        date: hourStart.toISOString(),
        scheduled: hourApps.length,
        confirmed: hourApps.filter(a => a.status === 'CONFIRMED').length,
        completed: hourApps.filter(a => a.status === 'COMPLETED').length,
        cancelled: hourApps.filter(a => a.status === 'CANCELLED').length,
      });
    }
  } else {
    // Daily breakdown
    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === '3months' ? 90 : 365;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayApps = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledAt);
        return aptDate >= date && aptDate < nextDate;
      });

      trends.push({
        date: date.toISOString(),
        scheduled: dayApps.length,
        confirmed: dayApps.filter(a => a.status === 'CONFIRMED').length,
        completed: dayApps.filter(a => a.status === 'COMPLETED').length,
        cancelled: dayApps.filter(a => a.status === 'CANCELLED').length,
      });
    }
  }

  return trends;
};

/**
 * Get patient growth trends
 */
const getPatientGrowth = async (doctorId: string, period: string, startDate: Date) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: startDate },
      deletedAt: null,
    },
    select: {
      patientId: true,
      scheduledAt: true,
    },
  });

  // Get unique patients per time period
  const now = new Date();
  const growth: { date: string; newPatients: number; totalPatients: number }[] = [];

  if (period === 'month' || period === '3months' || period === 'year') {
    const intervals = period === 'month' ? 1 : period === '3months' ? 3 : 12;
    const seenPatients = new Set<string>();

    for (let i = intervals - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setMonth(nextDate.getMonth() + 1);

      const periodApps = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledAt);
        return aptDate >= date && aptDate < nextDate;
      });

      const periodPatients = new Set(periodApps.map(apt => apt.patientId));
      const newPatients = Array.from(periodPatients).filter(id => !seenPatients.has(id)).length;
      seenPatients.add(...Array.from(periodPatients));

      growth.push({
        date: date.toISOString(),
        newPatients,
        totalPatients: seenPatients.size,
      });
    }
  }

  return growth;
};

