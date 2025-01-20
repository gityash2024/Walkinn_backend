
import { check } from 'express-validator';
import { APP_CONSTANTS } from '../utils/constants';

export const validateRegister = [
  check('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  check('role')
    .optional()
    .isIn(Object.values(APP_CONSTANTS.ROLES))
    .withMessage('Invalid role')
];

export const validateLogin = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
];

export const validateResetPassword = [
  check('token')
    .trim()
    .notEmpty()
    .withMessage('Token is required'),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];
