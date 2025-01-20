import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import User from '../models/User';
import { UploadService } from '../services/upload';
import { logger } from '../utils/logger';
import { IUser } from '../interfaces/user';


interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password -refreshToken') as IUser;
    if (!user) {
      ApiResponse.notFound(res, 'User not found');
      return;
    }
    ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    const user = await User.findById(req.user?.id) as IUser;
    if (!user) {
      ApiResponse.notFound(res, 'User not found');
      return;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();

    ApiResponse.success(res, {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      ApiResponse.badRequest(res, 'No file uploaded');
      return;
    }

    const user = await User.findById(req.user?.id) as IUser;
    if (!user) {
      ApiResponse.notFound(res, 'User not found');
      return;
    }

    // Fix: Get the instance first, then call the method
    const uploadService = UploadService.getInstance();
    const avatarUrl = await uploadService.uploadFile(req.file, 'avatars', user._id.toString());
    user.avatar = avatarUrl;
    await user.save();

    ApiResponse.success(res, { avatarUrl });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.id).select('+password') as IUser;
    if (!user) {
      ApiResponse.notFound(res, 'User not found');
      return;
    }

    if (!(await user.comparePassword(currentPassword))) {
      ApiResponse.badRequest(res, 'Current password is incorrect');
      return;
    }

    user.password = newPassword;
    await user.save();

    ApiResponse.success(res, null, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const query: any = {};
    
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') }
      ];
    }

    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshToken')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort('-createdAt');

    ApiResponse.success(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) {
      ApiResponse.notFound(res, 'User not found');
      return;
    }
    ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive, role } = req.body;
    
    const user = await User.findById(req.params.id) as IUser;
    if (!user) {
      ApiResponse.notFound(res, 'User not found');
      return;
    }

    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (role) user.role = role;

    await user.save();

    ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      ApiResponse.notFound(res, 'User not found');
      return;
    }

    await user.deleteOne();
    ApiResponse.success(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};