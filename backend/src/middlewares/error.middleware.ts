import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Always log errors with full details
  const errorDetails = {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    body: req.body,
    statusCode: err instanceof AppError ? err.statusCode : 500,
    userId: (req as any).user?.id,
  };

  if (err instanceof AppError) {
    // Log AppErrors as warnings but with full context
    logger.warn(errorDetails, `AppError (${err.statusCode}): ${err.message}`);
    // Also log to console for PM2 to capture
    console.error(`[AppError ${err.statusCode}] ${req.method} ${req.path}:`, err.message);
    return sendError(res, err.message, err.statusCode);
  }

  // Log unhandled errors with full stack trace
  logger.error(errorDetails, 'Unhandled error (500)');
  // Also log to console for PM2 to capture
  console.error(`[Unhandled Error] ${req.method} ${req.path}:`, err.message);
  console.error('Stack trace:', err.stack);

  sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    500
  );
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
};

