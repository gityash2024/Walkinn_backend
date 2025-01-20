
import { createClient } from 'redis';
import { logger } from '../utils/logger';

let redisClient: any;

export const initializeRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (error: any) => {
      logger.error('Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const redisConfig = {
  keyPrefix: 'ems:',
  defaultTTL: 3600, // 1 hour
  cacheDurations: {
    events: 300, // 5 minutes
    venues: 600, // 10 minutes
    userProfile: 1800, // 30 minutes
    analytics: 1800 // 30 minutes
  }
};

// Helper functions for common Redis operations
export const redisHelper = {
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const client = getRedisClient();
    const finalKey = `${redisConfig.keyPrefix}${key}`;
    await client.set(finalKey, JSON.stringify(value), { EX: ttl || redisConfig.defaultTTL });
  },

  async get(key: string): Promise<any> {
    const client = getRedisClient();
    const finalKey = `${redisConfig.keyPrefix}${key}`;
    const value = await client.get(finalKey);
    return value ? JSON.parse(value) : null;
  },

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    const finalKey = `${redisConfig.keyPrefix}${key}`;
    await client.del(finalKey);
  },

  async clearPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    const keys = await client.keys(`${redisConfig.keyPrefix}${pattern}`);
    if (keys.length > 0) {
      await client.del(keys);
    }
  }
};