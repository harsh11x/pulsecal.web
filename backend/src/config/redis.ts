import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('error', (error: Error) => {
  logger.error('Redis connection error:', error);
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

