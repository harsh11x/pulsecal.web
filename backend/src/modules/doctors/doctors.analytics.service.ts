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
/** Exclude subscription payments (filter in JS to avoid Prisma nullable + NOT contains issues) */
const isSubscriptionPayment = (p: { description?: string | null }) =>
  p.description?.toLowerCase().includes('subscription') ?? false;

const getRevenueTrends = async (doctorId: string, period: string, startDate: Date) => {
  const allPayments = await prisma.payment.findMany({
    where: {
      doctorId,
      deletedAt: null,
      status: 'COMPLETED',
      OR: [
        { paidAt: { gte: startDate } },
        { paidAt: null, createdAt: { gte: startDate } }
      ],
    },
    select: {
      amount: true,
      paidAt: true,
      createdAt: true,
      description: true,
    },
  });
  const payments = allPayments.filter(p => !isSubscriptionPayment(p));

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

      const periodPatients = new Set(periodApps.map(apt => apt.patientId).filter((id): id is string => id !== null));
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
  try {
    if (!doctorId || typeof doctorId !== 'string') {
      throw new Error('Invalid doctor ID');
    }

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
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
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

    // Calculate metrics - exclude CANCELLED from appointment counts
    const nonCancelledStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED'];
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledAt);
      return aptDate >= todayStart && aptDate < todayEnd && nonCancelledStatuses.includes(apt.status);
    }).length;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Parallelize secondary queries
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    const [
      yesterdayAppointments,
      weekAppointments,
      monthAppointments,
      yesterdayStats,
      allConsultationPayments
    ] = await Promise.all([
      // Yesterday's appointment count (exclude CANCELLED)
      prisma.appointment.count({
        where: {
          doctorId,
          scheduledAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
          deletedAt: null,
          status: { not: 'CANCELLED' },
        },
      }),
      // Week appointments (include scheduledAt for chart breakdown)
      prisma.appointment.findMany({
        where: { doctorId, scheduledAt: { gte: weekStart, lte: now }, deletedAt: null },
        select: { id: true, status: true, scheduledAt: true }
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
          scheduledAt: { gte: yesterdayStart, lt: todayStart },
          deletedAt: null
        },
        select: { status: true }
      }),
      // All COMPLETED payments for this doctor (exclude subscription in JS to avoid Prisma nullable filter issues)
      prisma.payment.findMany({
        where: {
          doctorId,
          status: 'COMPLETED',
          deletedAt: null,
        },
        select: { amount: true, paidAt: true, createdAt: true, description: true }
      })
    ]);


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

    const getPaidDate = (p: { paidAt: Date | null; createdAt: Date }) => p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
    const payments = allConsultationPayments.filter((p: { description?: string | null }) => !isSubscriptionPayment(p));

    const todayRevenue = payments
      .filter(p => {
        const d = getPaidDate(p);
        return d >= todayStart && d < todayEnd;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const yesterdayRevenue = payments
      .filter(p => {
        const d = getPaidDate(p);
        return d >= yesterdayStart && d < todayStart;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const weekRevenue = payments
      .filter(p => {
        const d = getPaidDate(p);
        return d >= weekStart && d <= now;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const monthRevenue = payments
      .filter(p => {
        const d = getPaidDate(p);
        return d >= monthStart && d <= now;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearRevenue = payments
      .filter(p => {
        const d = getPaidDate(p);
        return d >= yearStart && d <= now;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Cancellation rate - use month-wide data for meaningful metric
    const monthTotal = monthAppointments.length;
    const monthCancelled = monthCancellations;
    const cancellationRate = monthTotal > 0
      ? (monthCancelled / monthTotal) * 100
      : 0;

    // Get reviews
    const { totalReviews, averageRating, recentReviews } = await getDoctorReviews(doctorId);

    // Revenue trends by day/week/month - use 'week' for better dashboard defaults
    const trendPeriod = period === 'day' ? 'week' : period;
    const revenueTrends = await getRevenueTrends(doctorId, trendPeriod, period === 'day' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) : startDate);

    // Patient growth - use month for meaningful data (growth only supports month/3months/year)
    const growthPeriod = ['day', 'week'].includes(period) ? 'month' : period;
    const patientGrowth = await getPatientGrowth(doctorId, growthPeriod, new Date(now.getFullYear(), now.getMonth() - 2, 1));

    // Build revenueData with appointment counts per day (for charts)
    const appointmentsByDay = new Map<string, number>();
    weekAppointments.forEach((apt: { scheduledAt: Date }) => {
      const d = new Date(apt.scheduledAt).toISOString().split('T')[0];
      appointmentsByDay.set(d, (appointmentsByDay.get(d) || 0) + 1);
    });

    const revenueDataFormatted = revenueTrends.map(t => {
      const d = new Date(t.date);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = period === 'day'
        ? d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: displayDate,
        dateKey,
        revenue: t.revenue,
        appointments: appointmentsByDay.get(dateKey) || 0,
      };
    });

    const patientGrowthFormatted = patientGrowth.map(g => {
      const d = new Date(g.date);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        patients: g.totalPatients,
        newPatients: g.newPatients,
      };
    });

    return {
      today: {
        appointments: todayAppointments,
        revenue: Number(todayRevenue.toFixed(2)),
        patients: todayCompletedCount,
        cancellations: appointments.filter(apt => {
          const aptDate = new Date(apt.scheduledAt);
          return aptDate >= todayStart && aptDate < todayEnd && apt.status === 'CANCELLED';
        }).length,
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
      thisYear: period === 'year' ? (() => {
        const yearAppointments = appointments.filter(apt => apt.scheduledAt >= yearStart && apt.scheduledAt <= now);
        return {
          appointments: yearAppointments.length,
          revenue: Number(yearRevenue.toFixed(2)),
          patients: yearAppointments.filter(apt => apt.status === 'COMPLETED').length,
          cancellations: yearAppointments.filter(apt => apt.status === 'CANCELLED').length,
        };
      })() : undefined,
      revenueData: revenueDataFormatted,
      patientGrowth: patientGrowthFormatted,
      cancellationRate: Number(cancellationRate.toFixed(2)),
      reviews: {
        total: totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
        recent: recentReviews
      }
    };
  } catch (error: any) {
    console.error('Error in getDoctorAnalytics:', error.message, error.stack);
    throw error;
  }
};

/**
 * Get financial reports in format expected by DoctorFinancialReports component
 */
export const getFinancialReports = async (
  doctorId: string,
  type: 'daily' | 'monthly' | 'yearly' = 'monthly'
) => {
  const periodMap = { daily: 'week' as const, monthly: 'month' as const, yearly: 'year' as const };
  const analytics = await getDoctorAnalytics(doctorId, periodMap[type]);

  const periodData = type === 'daily'
    ? analytics.thisWeek
    : type === 'yearly' && analytics.thisYear
      ? analytics.thisYear
      : analytics.thisMonth;

  const totalAppointments = periodData.appointments;
  const totalRevenue = periodData.revenue;
  const confirmedAppointments = periodData.patients;
  const cancelledAppointments = periodData.cancellations;

  const periodLabel = type === 'daily'
    ? 'Last 7 days'
    : type === 'monthly'
      ? 'This month'
      : 'This year';

  const revenueData = analytics.revenueData || [];

  const dailyBreakdown = type === 'daily'
    ? revenueData.map((r: any) => ({
      date: new Date(r.date).toISOString().split('T')[0],
      revenue: r.revenue || 0,
      appointments: 0,
    }))
    : undefined;

  const monthlyBreakdown = (type === 'monthly' || type === 'yearly')
    ? revenueData.map((r: any) => ({
      month: new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: r.revenue || 0,
      appointments: 0,
    }))
    : undefined;

  return {
    period: periodLabel,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalAppointments,
    confirmedAppointments,
    cancelledAppointments,
    averageRevenuePerVisit: confirmedAppointments > 0
      ? Number((totalRevenue / confirmedAppointments).toFixed(2))
      : 0,
    dailyBreakdown,
    monthlyBreakdown: monthlyBreakdown || (dailyBreakdown?.map((d: any) => ({
      month: d.date,
      revenue: d.revenue,
      appointments: d.appointments,
    }))),
  };
};
