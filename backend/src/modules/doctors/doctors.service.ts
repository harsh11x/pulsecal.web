import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

type DoctorSearchRow = {
  userId: string;
  specialization: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  clinicCity: string | null;
  consultationFee: unknown;
  bio: string | null;
  services: string[] | null;
  clinicLatitude: number | null;
  clinicLongitude: number | null;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
};

const parseFee = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Map DB row → patient-facing doctor card payload (always includes location fields). */
const mapDoctorSearchRow = (d: DoctorSearchRow) => ({
  id: d.userId,
  userId: d.userId,
  firstName: d.firstName ?? '',
  lastName: d.lastName ?? '',
  specialization: d.specialization ?? 'General',
  clinicName: d.clinicName ?? null,
  clinicAddress: d.clinicAddress ?? null,
  clinicCity: d.clinicCity ?? null,
  clinicLatitude: d.clinicLatitude != null ? Number(d.clinicLatitude) : null,
  clinicLongitude: d.clinicLongitude != null ? Number(d.clinicLongitude) : null,
  consultationFee: parseFee(d.consultationFee),
  bio: d.bio ?? null,
  services: Array.isArray(d.services) ? d.services : [],
  profileImage: d.profileImage ?? null,
});

/**
 * Reverse geocode lat/lng to city using Nominatim
 */
async function reverseGeocodeToCity(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'PulseCal-Healthcare/1.0' },
    });
    const data = (await res.json()) as { address?: { city?: string; town?: string; village?: string; county?: string; state?: string } };
    const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || data?.address?.state;
    return city || null;
  } catch {
    return null;
  }
}

/**
 * Search doctors with city filtering (city from param or derived from lat/lng geolocation)
 * Returns doctors with clinicLatitude/clinicLongitude for map display
 */
export const searchDoctors = async (params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  specialization?: string;
  name?: string;
  clinicName?: string;
  minFee?: number;
  maxFee?: number;
  city?: string;
  page?: number;
  limit?: number;
  services?: string;
  search?: string;
  reason?: string;
}) => {
  const emptyResult = () => ({
    doctors: [] as any[],
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  });

  try {
    let {
      latitude,
      longitude,
      specialization,
      name,
      clinicName,
      minFee,
      maxFee,
      city,
      page = 1,
      limit = 50,
      services,
      search,
      reason,
    } = params;

    page = Number.isFinite(page) ? page : 1;
    limit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;
    const skip = (page - 1) * limit;

    // When city not provided but lat/lng are, reverse geocode to get city
    if ((!city || !city.trim()) && latitude != null && longitude != null) {
      const derivedCity = await reverseGeocodeToCity(latitude, longitude);
      if (derivedCity) city = derivedCity;
    }

    const hasFilters = !!(city && city.trim()) || !!(search || reason) || !!specialization || !!clinicName || !!services || minFee !== undefined || maxFee !== undefined;
    const onlySearchOrReason = hasFilters && !(city && city.trim()) && !specialization && !clinicName && !services && minFee === undefined && maxFee === undefined && !!(search || reason);

    // SEARCH-ONLY: raw SQL with ILIKE so search bar works without Prisma relation issues
    if (onlySearchOrReason && (search || reason)) {
      const term = `${(search || reason || '').trim()}`;
      if (term.length > 0) {
        try {
          const limitNum = Math.min(limit, 200);
          const pattern = `%${term.replace(/%/g, '\\%')}%`;
          const raw = await prisma.$queryRaw<DoctorSearchRow[]>`
          SELECT dp."userId", dp.specialization,
                 COALESCE(NULLIF(TRIM(dp."clinicName"), ''), c.name) AS "clinicName",
                 COALESCE(NULLIF(TRIM(dp."clinicAddress"), ''), c.address) AS "clinicAddress",
                 NULLIF(TRIM(c.city), '') AS "clinicCity",
                 dp."consultationFee",
                 dp.bio, dp.services, dp."clinicLatitude", dp."clinicLongitude",
                 u."firstName", u."lastName", u."profileImage"
          FROM doctor_profiles dp
          INNER JOIN users u ON u.id = dp."userId" AND u.role = 'DOCTOR'
          LEFT JOIN clinics c ON c.id = u."clinicId"
          WHERE (
            u."firstName" ILIKE ${pattern}
            OR u."lastName" ILIKE ${pattern}
            OR dp.specialization ILIKE ${pattern}
            OR dp."clinicName" ILIKE ${pattern}
            OR dp."clinicAddress" ILIKE ${pattern}
            OR c.city ILIKE ${pattern}
            OR c.address ILIKE ${pattern}
            OR c.name ILIKE ${pattern}
          )
          ORDER BY u."firstName" ASC, u."lastName" ASC
          LIMIT ${limitNum}
        `;
          const mappedDoctors = raw.map(mapDoctorSearchRow);
          return {
            doctors: mappedDoctors,
            pagination: { page, limit, total: mappedDoctors.length, totalPages: 1 },
          };
        } catch (searchErr: any) {
          console.error('[searchDoctors search-raw]', searchErr?.message);
          return emptyResult();
        }
      }
    }

    // NO FILTERS: use raw SQL so we never hit Prisma schema/relation issues. Returns ALL doctors.
    if (!hasFilters) {
      try {
        const limitNum = Math.min(limit, 200);
        const skipNum = skip;
        const [countRow] = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM doctor_profiles dp
        INNER JOIN users u ON u.id = dp."userId" AND u.role = 'DOCTOR'
      `;
        const total = Number(countRow?.count ?? 0);
        const raw = await prisma.$queryRaw<DoctorSearchRow[]>`
        SELECT dp."userId", dp.specialization,
               COALESCE(NULLIF(TRIM(dp."clinicName"), ''), c.name) AS "clinicName",
               COALESCE(NULLIF(TRIM(dp."clinicAddress"), ''), c.address) AS "clinicAddress",
               NULLIF(TRIM(c.city), '') AS "clinicCity",
               dp."consultationFee",
               dp.bio, dp.services, dp."clinicLatitude", dp."clinicLongitude",
               u."firstName", u."lastName", u."profileImage"
        FROM doctor_profiles dp
        INNER JOIN users u ON u.id = dp."userId" AND u.role = 'DOCTOR'
        LEFT JOIN clinics c ON c.id = u."clinicId"
        ORDER BY u."firstName" ASC, u."lastName" ASC
        LIMIT ${limitNum} OFFSET ${skipNum}
      `;
        const mappedDoctors = raw.map(mapDoctorSearchRow);
        return {
          doctors: mappedDoctors,
          pagination: { page, limit, total, totalPages: total > 0 ? Math.ceil(total / limit) : 0 },
        };
      } catch (rawErr: any) {
        console.error('[searchDoctors raw]', rawErr?.message, rawErr?.stack);
        return emptyResult();
      }
    }

    // WITH FILTERS: use Prisma
    const where: any = {
      user: { isActive: true },
    };
    if (specialization) where.specialization = specialization;
    if (clinicName) where.clinicName = { contains: clinicName, mode: 'insensitive' };
    if (city && city.trim()) {
      const cityTerm = city.trim();
      where.AND = [{
        OR: [
          { clinicAddress: { contains: cityTerm, mode: 'insensitive' } },
          { user: { clinic: { city: { contains: cityTerm, mode: 'insensitive' } } } },
        ],
      }];
    }
    if (services) where.services = { has: services };
    const searchOrReason = search || reason;
    if (searchOrReason) {
      const term = (searchOrReason as string).toLowerCase().trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { user: { OR: [{ firstName: { contains: term, mode: 'insensitive' } }, { lastName: { contains: term, mode: 'insensitive' } }] } },
          { clinicName: { contains: term, mode: 'insensitive' } },
          { specialization: { contains: term, mode: 'insensitive' } },
          { services: { has: term } },
        ],
      });
    }
    if (minFee !== undefined || maxFee !== undefined) {
      where.consultationFee = {};
      if (minFee !== undefined) where.consultationFee.gte = minFee;
      if (maxFee !== undefined) where.consultationFee.lte = maxFee;
    }

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            clinic: { select: { name: true, address: true, city: true } },
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
      skip,
      take: limit,
    });

    let filteredDoctors = doctors;
    if (name) {
      const nameLower = name.toLowerCase();
      filteredDoctors = filteredDoctors.filter((d) => {
        const first = d.user?.firstName ?? '';
        const last = d.user?.lastName ?? '';
        return `${first} ${last}`.trim().toLowerCase().includes(nameLower);
      });
    }
    if (reason) {
      const reasonLower = reason.toLowerCase();
      filteredDoctors = filteredDoctors.filter((d) => {
        const specMatch = d.specialization?.toLowerCase().includes(reasonLower);
        const servicesMatch = Array.isArray(d.services) && d.services.some((s: string) => s.toLowerCase().includes(reasonLower));
        return specMatch || servicesMatch;
      });
    }

    const total = filteredDoctors.length;
    const slice = filteredDoctors.slice(0, limit);
    const mappedDoctors = slice.map((d) => {
      const clinic = (d.user as any)?.clinic as { name?: string; address?: string; city?: string } | null | undefined;
      const clinicName = (d.clinicName && d.clinicName.trim()) || clinic?.name || null;
      const clinicAddress = (d.clinicAddress && d.clinicAddress.trim()) || clinic?.address || null;
      const clinicCity = clinic?.city?.trim() || null;
      return mapDoctorSearchRow({
        userId: d.userId,
        specialization: d.specialization,
        clinicName,
        clinicAddress,
        clinicCity,
        consultationFee: d.consultationFee,
        bio: d.bio,
        services: d.services,
        clinicLatitude: d.clinicLatitude,
        clinicLongitude: d.clinicLongitude,
        firstName: d.user?.firstName ?? null,
        lastName: d.user?.lastName ?? null,
        profileImage: d.user?.profileImage ?? null,
      });
    });

    return {
      doctors: mappedDoctors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  } catch (err: any) {
    console.error('[searchDoctors]', err?.message, err?.stack);
    return emptyResult();
  }
};

/**
 * Get doctor by ID with full profile
 */
export const getDoctorById = async (doctorId: string) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: doctorId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
    },
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  return doctor;
};

/**
 * Get doctor availability for a specific date
 */
export const getDoctorAvailability = async (doctorId: string, date: Date) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: doctorId },
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // Get existing appointments for the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
    },
    select: {
      scheduledAt: true,
      duration: true,
    },
  });

  // Parse working hours
  const workingHours = doctor.workingHours as any;
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = workingHours?.[dayName];

  if (!daySchedule || !daySchedule.isOpen) {
    return { available: false, slots: [] };
  }

  // Generate available time slots
  const slots: string[] = [];
  const [startHour, startMin] = daySchedule.start.split(':').map(Number);
  const [endHour, endMin] = daySchedule.end.split(':').map(Number);

  const startTime = new Date(date);
  startTime.setHours(startHour, startMin, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMin, 0, 0);

  // Optional break period (e.g. lunch) — patients cannot book during the break
  const parseTime = (value: any) => {
    if (!value) return null;
    const [h, m] = String(value).split(':').map(Number);
    if (!Number.isFinite(h)) return null;
    const t = new Date(date);
    t.setHours(h, Number.isFinite(m) ? m : 0, 0, 0);
    return t;
  };
  const breakStartTime = parseTime(daySchedule.breakStart);
  const breakEndTime = parseTime(daySchedule.breakEnd);
  const hasBreak = !!breakStartTime && !!breakEndTime && breakStartTime < breakEndTime;

  const slotDuration = 30; // 30 minutes per slot
  let currentTime = new Date(startTime);

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

    // Skip slots that overlap the configured break
    if (hasBreak) {
      if (currentTime < breakEndTime && slotEnd > breakStartTime) {
        currentTime = new Date(breakEndTime);
        continue;
      }
    }

    // Check if slot conflicts with existing appointments
    const hasConflict = appointments.some((apt) => {
      const aptStart = new Date(apt.scheduledAt);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
      return (currentTime < aptEnd && slotEnd > aptStart);
    });

    if (!hasConflict && currentTime >= new Date()) {
      slots.push(currentTime.toISOString());
    }

    currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
  }

  return { available: true, slots };
};

/**
 * Get all patients who have booked appointments with this doctor.
 * Used by the "Add Medical Record" dialog — a doctor can only add a
 * record for a patient who has actually come to them.
 */
export const getDoctorPatients = async (doctorId: string) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      deletedAt: null,
      // Only patients who actually visited the doctor (exclude cancelled / no-shows)
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: {
      patientId: true,
      scheduledAt: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });

  // Distinct patients, plus per-patient visit stats
  const visitStats = new Map<string, { count: number; lastVisitAt: Date }>();
  const patientIds: string[] = [];
  for (const apt of appointments) {
    if (!visitStats.has(apt.patientId)) {
      patientIds.push(apt.patientId);
      visitStats.set(apt.patientId, { count: 0, lastVisitAt: apt.scheduledAt });
    }
    const stat = visitStats.get(apt.patientId)!;
    stat.count += 1;
    if (apt.scheduledAt > stat.lastVisitAt) stat.lastVisitAt = apt.scheduledAt;
  }

  if (patientIds.length === 0) {
    return { patients: [], total: 0 };
  }

  const [patients, recentRecords] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { in: patientIds },
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        profileImage: true,
      },
      orderBy: { firstName: 'asc' },
    }),
    prisma.medicalRecord.findMany({
      where: {
        patientId: { in: patientIds },
        doctorId,
        deletedAt: null,
      },
      select: {
        patientId: true,
        title: true,
        diagnosis: true,
        recordDate: true,
      },
      orderBy: { recordDate: 'desc' },
      take: 200, // cap query; we'll trim per patient below
    }),
  ]);

  // Group recent records per patient (up to 3 each)
  const recordsByPatient = new Map<string, { title: string; diagnosis: string; recordDate: Date }[]>();
  for (const rec of recentRecords) {
    if (!rec.patientId) continue;
    const list = recordsByPatient.get(rec.patientId) || [];
    if (list.length < 3) {
      list.push({ title: rec.title, diagnosis: rec.diagnosis || '', recordDate: rec.recordDate });
      recordsByPatient.set(rec.patientId, list);
    }
  }

  const enriched = patients.map((p) => {
    const stats = visitStats.get(p.id);
    const records = recordsByPatient.get(p.id) || [];
    return {
      ...p,
      appointmentCount: stats?.count || 0,
      lastVisitAt: stats?.lastVisitAt ? stats.lastVisitAt.toISOString() : null,
      recentRecords: records.map((r) => ({
        title: r.title,
        diagnosis: r.diagnosis,
        recordDate: r.recordDate.toISOString(),
      })),
    };
  });

  return { patients: enriched, total: enriched.length };
};

/**
 * Get available slots for multiple days (for patient booking).
 * Always returns at least 14 days of slots (9am–6pm default) so booking never shows "no availability".
 */
export const getDoctorSlots = async (doctorId: string, daysParam: number = 10) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: doctorId },
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.min(daysParam, 14));

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: start, lt: end },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: {
      scheduledAt: true,
      duration: true, // Fetch duration for accurate blocking
    },
  });

  const workingHours = (doctor.workingHours as any) || {};
  // Get configured slot duration or default to 30 mins
  const configuredSlotDuration = workingHours.defaultSettings?.slotDuration || 30;
  const defaultStart = 9;
  const defaultEnd = 18;

  const result: { date: string; dayName: string; slots: { time: string; available: boolean }[]; isFullyBooked: boolean }[] = [];

  for (let d = 0; d < daysParam; d++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + d);
    currentDay.setHours(0, 0, 0, 0);

    const dayName = currentDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = workingHours[dayName];
    const isOpen = daySchedule?.isOpen !== false;
    const [startHour, startMin] = (daySchedule?.start || `${defaultStart}:00`).split(':').map(Number);
    const [endHour, endMin] = (daySchedule?.end || `${defaultEnd}:00`).split(':').map(Number);

    // Optional daily break — patients cannot book during this window
    const parseBreakTime = (value: any) => {
      if (!value) return null;
      const [h, m] = String(value).split(':').map(Number);
      if (!Number.isFinite(h)) return null;
      const t = new Date(currentDay);
      t.setHours(h, Number.isFinite(m) ? m : 0, 0, 0);
      return t;
    };
    const breakStartTime = parseBreakTime(daySchedule?.breakStart);
    const breakEndTime = parseBreakTime(daySchedule?.breakEnd);
    const hasBreak = !!breakStartTime && !!breakEndTime && breakStartTime < breakEndTime;

    const daySlots: { time: string; available: boolean }[] = [];
    let hasAvailable = false;

    if (isOpen) {
      let slotStart = new Date(currentDay);
      slotStart.setHours(startHour, startMin, 0, 0);
      const slotEnd = new Date(currentDay);
      slotEnd.setHours(endHour, endMin, 0, 0);

      // For today: start from "now" rounded up to next slot so we always have future slots
      if (d === 0 && slotStart < now) {
        const msPerSlot = configuredSlotDuration * 60 * 1000;
        slotStart = new Date(Math.ceil(now.getTime() / msPerSlot) * msPerSlot);
        slotStart.setSeconds(0, 0);
        if (slotStart >= slotEnd) slotStart = new Date(currentDay);
      }

      let current = new Date(slotStart);
      while (current < slotEnd) {
        // Skip slots inside the configured break window
        if (hasBreak && current < breakEndTime && (current.getTime() + configuredSlotDuration * 60000) > breakStartTime.getTime()) {
          current = new Date(breakEndTime);
          continue;
        }
        if (current >= now) {
          const currentSlotStart = new Date(current);
          const currentSlotEnd = new Date(current.getTime() + configuredSlotDuration * 60000);

          // Find ANY colliding appointment
          const collision = existingAppointments.find(apt => {
            const aptStart = new Date(apt.scheduledAt);
            const aptDuration = apt.duration || 30;
            const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);

            // Range collision: (StartA < EndB) and (EndA > StartB)
            return currentSlotStart < aptEnd && currentSlotEnd > aptStart;
          });

          if (collision) {
            // If collision, jump current time to the END of this appointment
            const aptStart = new Date(collision.scheduledAt);
            const aptDuration = collision.duration || 30;
            const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);

            // Ensure we actually move forward to avoid infinite loops if calculation is off
            if (aptEnd > current) {
              current = aptEnd;
            } else {
              // Failsafe: just move by 1 minute if for some reason aptEnd <= current
              current.setMinutes(current.getMinutes() + 1);
            }
            // Continue loop to check this new time
            continue;
          }

          // No collision -> Valid slot
          hasAvailable = true;
          daySlots.push({ time: currentSlotStart.toISOString(), available: true });
        }

        // Advance by slot duration for the next slot
        current.setMinutes(current.getMinutes() + configuredSlotDuration);
      }
    }

    if (daySlots.length > 0) {
      result.push({
        date: currentDay.toISOString().split('T')[0],
        dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
        slots: daySlots,
        isFullyBooked: !hasAvailable,
      });
    }
  }

  // Fallback: if no days (e.g. workingHours closed all), return 14 days 9am–6pm all available
  if (result.length === 0) {
    const fallbackStart = 9;
    const fallbackEnd = 18;
    for (let d = 0; d < 14; d++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + d);
      currentDay.setHours(0, 0, 0, 0);
      let slotStart = new Date(currentDay);
      slotStart.setHours(fallbackStart, 0, 0, 0);
      const slotEnd = new Date(currentDay);
      slotEnd.setHours(fallbackEnd, 0, 0, 0);
      if (d === 0 && slotStart < now) {
        const msPerSlot = configuredSlotDuration * 60 * 1000;
        slotStart = new Date(Math.ceil(now.getTime() / msPerSlot) * msPerSlot);
        slotStart.setSeconds(0, 0);
      }
      const daySlots: { time: string; available: boolean }[] = [];
      let cur = new Date(slotStart);
      while (cur < slotEnd && cur >= now) {
        cur.setSeconds(0, 0);
        const currentSlotStart = new Date(cur);
        const currentSlotEnd = new Date(cur.getTime() + configuredSlotDuration * 60000);

        // Check for collision with any existing appointment in fallback mode too
        const collision = existingAppointments.find(apt => {
          const aptStart = new Date(apt.scheduledAt);
          const aptDuration = apt.duration || 30;
          const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);
          return currentSlotStart < aptEnd && currentSlotEnd > aptStart;
        });

        if (collision) {
          const aptStart = new Date(collision.scheduledAt);
          const aptDuration = collision.duration || 30;
          const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);
          if (aptEnd > cur) {
            cur = aptEnd;
          } else {
            cur.setMinutes(cur.getMinutes() + 1);
          }
          continue;
        }

        daySlots.push({ time: cur.toISOString(), available: true });
        cur.setMinutes(cur.getMinutes() + configuredSlotDuration);
      }
      if (daySlots.length > 0) {
        result.push({
          date: currentDay.toISOString().split('T')[0],
          dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
          slots: daySlots,
          isFullyBooked: daySlots.every((s) => !s.available),
        });
      }
    }
  }

  return result;
};

