import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: unknown) => {
    logger.debug({ msg: 'Query', ...(typeof e === 'object' ? e : { data: e }) });
  });
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('tenant/user') && message.includes('not found')) {
      logger.error(
        'Database connection failed: invalid DATABASE_URL. If your password contains @, encode it as %40 in both DATABASE_URL and DIRECT_URL.'
      );
    }
    logger.error(error, 'Database connection error');
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error(error, 'Database disconnection error');
  }
};

export default prisma;

