import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times: number) => {
    return null; // Fail fast locally
  },
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('error', (error: Error) => {
  logger.warn('Redis connection error (continuing without Redis):', error.message);
  // @ts-ignore
  redisClient.silenceUndefinedWarnings = true;
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.ping();
    logger.info('Redis connection verified');
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
};

export default redisClient;

