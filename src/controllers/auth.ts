import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ApiResponse } from '../utils/responses';
import { AppError } from '../utils/errors';
import User from '../models/User';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';
import { IUser } from '../interfaces/user';

// Declare global augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id?: string;
        id?: string;
        email?: string;
        role?: string;
        stripeCustomerId?: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  role: string;
}

const generateToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

const generateRefreshToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, username, role, firstName, lastName, phone } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      ApiResponse.badRequest(res, 'Email or username already exists');
      return;
    }

    const user = await User.create({
      email,
      password,
      username,
      role: role || 'user',
      firstName,
      lastName,
      phone
    }) as IUser;

    const token = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    user.refreshToken = refreshToken;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to EMS',
        template: 'welcome',
        data: {
          name: user.firstName || user.username
        }
      });
    } catch (error) {
      logger.error('Error sending welcome email:', error);
    }

    ApiResponse.created(res, {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password') as IUser;
    if (!user || !(await user.comparePassword(password))) {
      ApiResponse.unauthorized(res, 'Invalid credentials');
      return;
    }

    if (!user.isActive) {
      ApiResponse.forbidden(res, 'Your account is currently inactive');
      return;
    }

    const token = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    await user.save();

    ApiResponse.success(res, {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }) as IUser;

    if (!user) {
      ApiResponse.success(res, null, 'If a user with this email exists, a password reset link has been sent.');
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        template: 'reset-password',
        data: {
          name: user.firstName || user.username,
          resetUrl
        }
      });

      ApiResponse.success(res, null, 'Password reset link sent to email');
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      throw new AppError('There was an error sending the email. Please try again later.', 500);
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }) as IUser;

    if (!user) {
      ApiResponse.badRequest(res, 'Invalid or expired reset token');
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Changed Successfully',
        template: 'password-changed',
        data: {
          name: user.firstName || user.username
        }
      });
    } catch (error) {
      logger.error('Error sending password change confirmation email:', error);
    }

    ApiResponse.success(res, null, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      ApiResponse.badRequest(res, 'Refresh token is required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload;
      const user = await User.findById(decoded.id) as IUser;

      if (!user || user.refreshToken !== token) {
        ApiResponse.unauthorized(res, 'Invalid refresh token');
        return;
      }

      const newToken = generateToken(user._id.toString(), user.role);
      const newRefreshToken = generateRefreshToken(user._id.toString(), user.role);

      user.refreshToken = newRefreshToken;
      await user.save();

      ApiResponse.success(res, {
        token: newToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      ApiResponse.unauthorized(res, 'Invalid refresh token');
      return;
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId) as IUser;
    
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    
    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};