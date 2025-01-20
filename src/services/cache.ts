
import { getRedisClient, redisConfig } from '../config/redis';
import { logger } from '../utils/logger';

export class CacheService {
  private static instance: CacheService;
  private client: any;

  private constructor() {
    this.client = getRedisClient();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheKey = `${redisConfig.keyPrefix}${key}`;
      await this.client.setEx(
        cacheKey,
        ttl || redisConfig.defaultTTL,
        JSON.stringify(data)
      );
    } catch (error) {
      logger.error('Cache set error:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${redisConfig.keyPrefix}${key}`;
      const data = await this.client.get(cacheKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      const cacheKey = `${redisConfig.keyPrefix}${key}`;
      await this.client.del(cacheKey);
    } catch (error) {
      logger.error('Cache delete error:', error);
      throw error;
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(`${redisConfig.keyPrefix}${pattern}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      logger.error('Cache clear all error:', error);
      throw error;
    }
  }
}