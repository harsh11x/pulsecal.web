import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationParams = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string, 10) || 20)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getSortParams = (req: Request): {
  orderBy: string;
  order: 'asc' | 'desc';
} => {
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) || 'desc';

  return {
    orderBy: sortBy,
    order: sortOrder === 'asc' ? 'asc' : 'desc',
  };
};

export const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};

