import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiResponse } from '../utils/responses';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().reduce((acc: any, error: any) => {
      acc[error.param] = error.msg;
      return acc;
    }, {});

    ApiResponse.badRequest(res, 'Validation Error', formattedErrors);
  };
};

// Custom validator middleware for specific entities
export const validateId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return ApiResponse.badRequest(res, `Invalid ${paramName} format`);
    }
    next();
  };
};

// File validation middleware
export const validateFile = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'No file uploaded');
    }

    const file = req.file;

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return ApiResponse.badRequest(res, 'Invalid file type');
    }

    // Check file size
    if (file.size > maxSize) {
      return ApiResponse.badRequest(res, `File size should be less than ${maxSize / (1024 * 1024)}MB`);
    }

    next();
  };
};