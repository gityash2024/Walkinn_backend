
import { check } from 'express-validator';
import { APP_CONSTANTS } from '../utils/constants';

export const validateEvent = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  check('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),

  check('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),

  check('type')
    .trim()
    .notEmpty()
    .withMessage('Event type is required')
    .isIn(Object.values(APP_CONSTANTS.EVENT_TYPES))
    .withMessage('Invalid event type'),

  check('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format')
    .custom((startDate) => {
      if (new Date(startDate) < new Date()) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  check('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  check('venue')
    .notEmpty()
    .withMessage('Venue details are required'),

  check('ticketTiers')
    .isArray()
    .withMessage('Ticket tiers must be an array')
    .notEmpty()
    .withMessage('At least one ticket tier is required'),

  check('ticketTiers.*.name')
    .trim()
    .notEmpty()
    .withMessage('Ticket tier name is required'),

  check('ticketTiers.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  check('ticketTiers.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  check('ticketTiers.*.type')
    .isIn(Object.values(APP_CONSTANTS.TICKET_TYPES))
    .withMessage('Invalid ticket type')
];