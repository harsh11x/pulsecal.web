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
}) => {
  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country || 'USA',
      phone: data.phone,
      email: data.email,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  return clinic;
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
  };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: {
    city?: string;
    state?: string;
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      address?: { contains: string; mode: 'insensitive' };
    }>;
    isActive?: boolean;
    deletedAt?: null;
  } = {
    isActive: true,
    deletedAt: null,
  };

  if (req.query.city) {
    where.city = req.query.city;
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

  const [clinics, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
    }),
    prisma.clinic.count({ where }),
  ]);

  return {
    clinics,
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

