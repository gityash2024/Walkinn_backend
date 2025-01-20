
import { check } from 'express-validator';
import { APP_CONSTANTS } from '../utils/constants';

export const validateUpdateProfile = [
  check('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  check('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  check('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage('Invalid phone number format'),

  check('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
];

export const validateChangePassword = [
  check('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),

  check('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];