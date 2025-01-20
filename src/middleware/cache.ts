
import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export const cache = (duration: string | number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip cache if it's a non-GET request
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    const redisClient = getRedisClient();

    try {
      const cachedResponse = await redisClient.get(key);
      
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Store the original send function
      const sendResponse = res.json;
      
      // Override the send function
      res.json = function(body: any): Response {
        // Convert duration string to seconds
        const seconds = typeof duration === 'string' 
          ? parseInt(duration.replace('m', '')) * 60 
          : duration;

        // Store the response in cache
        redisClient.setex(key, seconds, JSON.stringify(body))
          .catch((err: Error) => logger.error('Cache storage error:', err));

        return sendResponse.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Clear cache by pattern
export const clearCache = async (pattern: string): Promise<void> => {
  try {
    const redisClient = getRedisClient();
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error('Clear cache error:', error);
  }
};