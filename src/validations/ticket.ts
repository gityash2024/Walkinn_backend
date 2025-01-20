import { check } from 'express-validator';
import { Request } from 'express';
import { APP_CONSTANTS } from '../utils/constants';

// Validate ticket transfer request
export const validateTicketTransfer = [
  check('receiverEmail')
    .trim()
    .notEmpty()
    .withMessage('Receiver email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  check('ticketIds')
    .isArray()
    .withMessage('Ticket IDs must be an array')
    .notEmpty()
    .withMessage('At least one ticket ID is required'),

  check('ticketIds.*')
    .isMongoId()
    .withMessage('Invalid ticket ID format')
];

// Validate ticket verification request
export const validateTicketVerification = [
  check('qrCode')
    .trim()
    .notEmpty()
    .withMessage('QR code is required'),

  check('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty if provided')
];

// Validate ticket bulk generation request
export const validateBulkGeneration = [
  check('eventId')
    .trim()
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Invalid event ID format'),

  check('tierId')
    .trim()
    .notEmpty()
    .withMessage('Ticket tier ID is required')
    .isMongoId()
    .withMessage('Invalid tier ID format'),

  check('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000')
];

// Validate ticket cancellation request
export const validateTicketCancellation = [
  check('reason')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters if provided'),

  check('refundRequired')
    .optional()
    .isBoolean()
    .withMessage('Refund required must be a boolean value')
];

// Validate ticket search/filter request
export const validateTicketSearch = [
  check('status')
    .optional()
    .isIn(Object.values(APP_CONSTANTS.TICKET_STATUS))
    .withMessage('Invalid ticket status'),

  check('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  check('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      // Handle potential undefined req.query
      const startDate = req.query?.startDate;
      if (startDate && new Date(endDate) <= new Date(String(startDate))) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  check('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  check('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validate ticket scanning request
export const validateTicketScan = [
  check('qrCode')
    .trim()
    .notEmpty()
    .withMessage('QR code is required'),

  check('eventId')
    .trim()
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Invalid event ID format'),

  check('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty if provided'),

  check('deviceId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Device ID cannot be empty if provided')
];

// Validate ticket resend request
export const validateTicketResend = [
  check('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),

  check('sendSMS')
    .optional()
    .isBoolean()
    .withMessage('SendSMS must be a boolean value'),

  check('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage('Invalid phone number format')
];

// Validate ticket update request
export const validateTicketUpdate = [
  check('tier')
    .optional()
    .isMongoId()
    .withMessage('Invalid tier ID format'),

  check('status')
    .optional()
    .isIn(Object.values(APP_CONSTANTS.TICKET_STATUS))
    .withMessage('Invalid ticket status'),

  check('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Valid until date must be in the future');
      }
      return true;
    })
];