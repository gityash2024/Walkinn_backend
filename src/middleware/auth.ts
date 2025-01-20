// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/responses';
import User from '../models/User';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
// export interface AuthRequest extends Request {
//   user?: {
//     _id: string;
//     email: string;
//     role: string;
//   };
// }
// interface AuthRequest extends Request {
//   user?: any;
// }

export const protect = async (req: any, res: Response, next: NextFunction) => {
  try {
    // 1) Get token from header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Please log in to access this resource');
    }

    try {
      // 2) Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      
      // 3) Check if user still exists
      const user = await User.findById((decoded as any).id);
      
      if (!user) {
        return ApiResponse.unauthorized(res, 'The user belonging to this token no longer exists');
      }

      // 4) Add user to request
      req.user = user;
      next();
    } catch (error) {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'You do not have permission to perform this action');
    }
    next();
  };
};

// Middleware to handle refresh tokens
export const handleRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.body.refreshToken;
    
    if (!refreshToken) {
      return ApiResponse.unauthorized(res, 'Refresh token is required');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
      const user = await User.findById((decoded as any).id);

      if (!user || user.refreshToken !== refreshToken) {
        return ApiResponse.unauthorized(res, 'Invalid refresh token');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      res.json({
        success: true,
        accessToken
      });
    } catch (error) {
      return ApiResponse.unauthorized(res, 'Invalid refresh token');
    }
  } catch (error) {
    next(error);
  }
};

export const isActive = async (req: any, res: Response, next: NextFunction) => {
  if (!req.user.isActive) {
    return ApiResponse.forbidden(res, 'Your account is currently inactive');
  }
  next();
};