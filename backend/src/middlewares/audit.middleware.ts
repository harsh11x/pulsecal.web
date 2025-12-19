import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/database';
import { getClientIp, getUserAgent } from '../utils/helpers';
import { AUDIT_ACTIONS } from '../utils/constants';

export const auditLog = (action: string, resourceType: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const originalSend = res.json;
    res.json = function (body: unknown) {
      if (req.user) {
        prisma.auditLog
          .create({
            data: {
              userId: req.user.id,
              action: action as typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS],
              resourceType,
              resourceId: (req.params.id || req.body.id) as string | undefined,
              description: `${action} ${resourceType}`,
              ipAddress: getClientIp(req),
              userAgent: getUserAgent(req),
              metadata: JSON.stringify({
                method: req.method,
                path: req.path,
                body: req.method !== 'GET' ? req.body : undefined,
              }),
            },
          })
          .catch((error: Error) => {
            console.error('Audit log error:', error);
          });
      }
      return originalSend.call(this, body);
    };
    next();
  };
};

