import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';

export const createClinic = async (data: {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  maxDoctors?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}) => {
  // Determine maxDoctors based on plan
  const planLimits: Record<string, number> = {
    STARTER: 1,
    BASIC: 5,
    PROFESSIONAL: 10,
    ENTERPRISE: 9999,
  };

  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country || 'India',
      phone: data.phone,
      email: data.email,
      latitude: data.latitude,
      longitude: data.longitude,
      subscriptionPlan: data.subscriptionPlan || 'STARTER',
      subscriptionStatus: data.subscriptionStatus || 'ACTIVE',
      maxDoctors: data.maxDoctors || planLimits[data.subscriptionPlan || 'STARTER'] || 1,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
    },
  });

  return clinic;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getClinics = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    city?: string;
    state?: string;
    search?: string;
    latitude?: string;
    longitude?: string;
    radius?: string; // km, default 10
  };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);
  const lat = req.query.latitude ? parseFloat(req.query.latitude) : undefined;
  const lng = req.query.longitude ? parseFloat(req.query.longitude) : undefined;
  let radius = req.query.radius ? parseFloat(req.query.radius) : 10;
  if (radius > 50) radius = 50; // Cap at 50km to prevent global results

  const where: any = {
    isActive: true,
    deletedAt: null,
  };

  if (lat !== undefined && lng !== undefined) {
    where.latitude = { not: null };
    where.longitude = { not: null };
  }

  if (req.query.city && req.query.city.trim()) {
    where.city = { contains: req.query.city.trim(), mode: 'insensitive' };
  }

  if (req.query.state) {
    where.state = req.query.state;
  }

  if (req.query.search) {
    where.OR = [
      { name: { contains: req.query.search, mode: 'insensitive' } },
      { address: { contains: req.query.search, mode: 'insensitive' } },
    ];
  }

  let clinics = await prisma.clinic.findMany({
    where,
    skip: lat && lng ? 0 : skip,
    take: lat && lng ? 500 : limit,
    orderBy: { [orderBy]: order },
    include: {
      staff: {
        where: { role: 'DOCTOR', isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          doctorProfile: {
            select: {
              specialization: true,
              consultationFee: true,
              services: true,
              workingHours: true,
              clinicLatitude: true,
              clinicLongitude: true,
            },
          },
        },
      },
    },
  });

  // Filter by 10km radius if lat/lng provided
  if (lat !== undefined && lng !== undefined) {
    clinics = clinics.filter((c) => {
      const clat = c.latitude ? Number(c.latitude) : null;
      const clng = c.longitude ? Number(c.longitude) : null;
      if (!clat || !clng) return false;
      return calculateDistance(lat, lng, clat, clng) <= radius;
    }).map((c) => {
      const clat = c.latitude ? Number(c.latitude) : 0;
      const clng = c.longitude ? Number(c.longitude) : 0;
      const distance = calculateDistance(lat, lng, clat, clng);
      return { ...c, distance: Math.round(distance * 10) / 10 };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  const total = clinics.length;
  const paginatedClinics = lat && lng ? clinics.slice(skip, skip + limit) : clinics;

  return {
    clinics: paginatedClinics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getClinicById = async (clinicId: string) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      staff: {
        where: { role: 'DOCTOR', isActive: true, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
          doctorProfile: {
            select: {
              specialization: true,
              consultationFee: true,
              services: true,
              workingHours: true,
              bio: true,
            },
          },
        },
      },
    },
  });

  if (!clinic) {
    throw new AppError('Clinic not found', 404);
  }

  return clinic;
};

export const updateClinic = async (
  clinicId: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
  }
) => {
  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data,
  });

  return clinic;
};

export const deleteClinic = async (clinicId: string) => {
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Clinic deleted successfully' };
};

