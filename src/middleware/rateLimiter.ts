import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { ApiResponse } from '../utils/responses';
import { logger } from '../utils/logger';

interface ExtendedRequest extends Request {
  user?: {
    id?: string;
    _id?: string;
  };
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const defaultLimits: { [key: string]: RateLimitConfig } = {
  default: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute
  auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 requests per 15 minutes
  booking: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 requests per hour
  payment: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 requests per hour
};

export const rateLimiter = (type: string = 'default', customMax?: number) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const redisClient = getRedisClient();
    const limit = defaultLimits[type] || defaultLimits.default;
    
    // Safely handle user ID extraction
    const userId = req.user?.id || req.user?._id || 'anonymous';
    const key = `ratelimit:${type}:${req?.ip || 'unknown'}:${userId}`;

    try {
      // Get current count
      const current = await redisClient.get(key);
      const count = current ? parseInt(current) : 0;

      // Check if limit exceeded
      if (count >= (customMax || limit.max)) {
        logger.warn(`Rate limit exceeded for ${key}`);
        return ApiResponse.error(res, 'Too many requests', 429);
      }

      // Increment count
      if (count === 0) {
        await redisClient.setex(key, Math.floor(limit.windowMs / 1000), '1');
      } else {
        await redisClient.incr(key);
      }

      // Set headers
      res.setHeader('X-RateLimit-Limit', customMax || limit.max);
      res.setHeader('X-RateLimit-Remaining', (customMax || limit.max) - (count + 1));

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      next();
    }
  };
};