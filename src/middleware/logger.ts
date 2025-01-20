import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import morgan from 'morgan';
import { logger } from '../utils/logger';

// Custom token for request body
morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const sanitizedBody = { ...req.body };
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    return JSON.stringify(sanitizedBody);
  }
  return '';
});

// Simple request logging middleware using morgan
export const requestLogger = morgan(
  ':method :url :status :response-time ms :body',
  {
    stream: {
      write: (message: string) => logger.http(message.trim())
    }
  }
);

// Error logging middleware with explicit type
export const errorLogger: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('Error:', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      user: req.user ? { 
        id: req.user._id || req.user.id,
        role: req.user.role 
      } : null
    }
  });
  next(err);
};

// Activity logging middleware
export const activityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const activity = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      userId: req.user?._id || req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    logger.info('Activity:', activity);
  });

  next();
};