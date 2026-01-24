import prisma from '../../config/database';

/**
 * Get doctor reviews (Placeholder until review module is fully implemented)
 */
const getDoctorReviews = async (_doctorId: string) => {
  // Temporarily return empty reviews until Prisma client is regenerated
  return {
    recentReviews: [],
    averageRating: 0,
    totalReviews: 0
  }
}

/**
 * Get revenue trends for a period
 */
const getRevenueTrends = async (doctorId: string, period: string, startDate: Date) => {
  const payments = await prisma.payment.findMany({
    where: {
      doctorId,
      updatedAt: { gte: startDate },
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
      Array.from(periodPatients).forEach(p => seenPatients.add(p));

      growth.push({
        date: date.toISOString(),
        newPatients,
        totalPatients: seenPatients.size,
      });
    }
  }

  return growth;
};

/**
 * Get doctor analytics including revenue, appointments, and trends
 */
export const getDoctorAnalytics = async (
  doctorId: string,
  period: 'day' | 'week' | 'month' | '3months' | 'year' | 'custom' = 'day',
  customStartDate?: Date,
  customEndDate?: Date
) => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (period === 'custom' && customStartDate && customEndDate) {
    startDate = new Date(customStartDate);
    endDate = new Date(customEndDate);
  } else {
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
  }

  // Get appointments for the selected period
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: {
        gte: startDate,
        lte: endDate
      },
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

  // Calculate metrics
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledAt);
    return aptDate.toDateString() === now.toDateString();
  }).length;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Parallelize secondary queries
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    yesterdayAppointments,
    weekAppointments,
    monthAppointments,
    yesterdayStats,
    payments
  ] = await Promise.all([
    // Yesterday's appointment count
    prisma.appointment.count({
      where: {
        doctorId,
        scheduledAt: {
          gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
        deletedAt: null,
      },
    }),
    // Week appointments
    prisma.appointment.findMany({
        where: { doctorId, scheduledAt: { gte: weekStart, lte: now }, deletedAt: null },
        select: { id: true, status: true }
    }),
    // Month appointments
    prisma.appointment.findMany({
        where: { doctorId, scheduledAt: { gte: monthStart, lte: now }, deletedAt: null },
        select: { id: true, status: true }
    }),
    // Yesterday stats (completed count, cancellation count)
    prisma.appointment.findMany({
        where: {
            doctorId,
            scheduledAt: {
                gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
                lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            },
            deletedAt: null
        },
        select: { status: true }
    }),
    // Payments for current period appointments
    prisma.payment.findMany({
        where: {
            appointmentId: { in: appointments.filter(a => a.status === 'COMPLETED').map(a => a.id) },
            status: 'COMPLETED'
        }
    })
  ]);

  const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED').length;
  
  // Today's revenue
  const todayPayments = payments.filter(payment => {
    const paidDate = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt);
    return paidDate.toDateString() === now.toDateString();
  });
  const todayRevenue = todayPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  // Yesterday's revenue (requires separate query as it might not be in main 'payments' if period is 'day')
  // We need to fetch yesterday's payments explicitly if they aren't covered by 'appointments' range
  const yesterdayPayments = await prisma.payment.findMany({
    where: {
        doctorId,
        status: 'COMPLETED',
        paidAt: {
            gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
    },
  });
  const yesterdayRevenue = yesterdayPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  // Week/Month Revenue (needs separate payment queries for their ranges)
  const weekCompletedIds = weekAppointments.filter(a => a.status === 'COMPLETED').map(a => a.id);
  const monthCompletedIds = monthAppointments.filter(a => a.status === 'COMPLETED').map(a => a.id);
  
  const [weekPayments, monthPayments] = await Promise.all([
    weekCompletedIds.length ? prisma.payment.findMany({ where: { appointmentId: { in: weekCompletedIds }, status: 'COMPLETED' } }) : [],
    monthCompletedIds.length ? prisma.payment.findMany({ where: { appointmentId: { in: monthCompletedIds }, status: 'COMPLETED' } }) : []
  ]);

  const weekRevenue = weekPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const monthRevenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Cancellation rate
  const cancellationRate = totalAppointments > 0
    ? (cancelledAppointments / totalAppointments) * 100
    : 0;

  const todayCompletedCount = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledAt);
    return aptDate.toDateString() === now.toDateString() && apt.status === 'COMPLETED';
  }).length;

  const yesterdayCompletedCount = yesterdayStats.filter(a => a.status === 'COMPLETED').length;
  const yesterdayCancellations = yesterdayStats.filter(a => a.status === 'CANCELLED').length;

  const weekCompletedCount = weekAppointments.filter(apt => apt.status === 'COMPLETED').length;
  const monthCompletedCount = monthAppointments.filter(apt => apt.status === 'COMPLETED').length;
  const weekCancellations = weekAppointments.filter(apt => apt.status === 'CANCELLED').length;
  const monthCancellations = monthAppointments.filter(apt => apt.status === 'CANCELLED').length;

  // Get reviews
  const { totalReviews, averageRating, recentReviews } = await getDoctorReviews(doctorId);

  // Revenue trends by day/week/month
  const revenueTrends = await getRevenueTrends(doctorId, period, startDate);

  // Patient growth
  const patientGrowth = await getPatientGrowth(doctorId, period, startDate);

  return {
    today: {
      appointments: todayAppointments,
      revenue: Number(todayRevenue.toFixed(2)),
      patients: todayCompletedCount,
      cancellations: appointments.filter(apt => apt.status === 'CANCELLED' && new Date(apt.scheduledAt).toDateString() === now.toDateString()).length,
    },
    yesterday: {
      appointments: yesterdayAppointments,
      revenue: Number(yesterdayRevenue.toFixed(2)),
      patients: yesterdayCompletedCount,
      cancellations: yesterdayCancellations,
    },
    thisWeek: {
      appointments: weekAppointments.length,
      revenue: Number(weekRevenue.toFixed(2)),
      patients: weekCompletedCount,
      cancellations: weekCancellations,
    },
    thisMonth: {
      appointments: monthAppointments.length,
      revenue: Number(monthRevenue.toFixed(2)),
      patients: monthCompletedCount,
      cancellations: monthCancellations,
    },
    revenueData: revenueTrends.map(trend => ({
      date: trend.date,
      revenue: trend.revenue,
      appointments: 0, // Will be populated from appointment trends
    })),
    patientGrowth: patientGrowth.map(growth => ({
      month: growth.date,
      patients: growth.totalPatients,
    })),
    cancellationRate: Number(cancellationRate.toFixed(2)),
    reviews: {
      total: totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      recent: recentReviews
    }
  };
};
