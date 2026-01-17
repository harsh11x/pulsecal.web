import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times: number) => {
    // Fail fast locally, can adjust logic for prod if needed
    if (times > 3) return null;
    return Math.min(times * 50, 2000);
  },
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('error', (error: Error) => {
  logger.warn({ err: error }, 'Redis connection error (continuing without Redis)');
  // @ts-ignore
  redisClient.silenceUndefinedWarnings = true;
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.ping();
    logger.info('Redis connection verified');
  } catch (error) {
    logger.error({ err: error }, 'Redis connection error');
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error({ err: error }, 'Error disconnecting Redis');
  }
};

export default redisClient;
