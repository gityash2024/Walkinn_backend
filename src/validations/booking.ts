
import { check } from 'express-validator';
import { APP_CONSTANTS } from '../utils/constants';

export const validateBooking = [
  check('eventId')
    .trim()
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Invalid event ID'),
  
  check('tickets')
    .isArray()
    .withMessage('Tickets must be an array')
    .notEmpty()
    .withMessage('At least one ticket is required'),
  
  check('tickets.*.tierId')
    .trim()
    .notEmpty()
    .withMessage('Ticket tier ID is required')
    .isMongoId()
    .withMessage('Invalid ticket tier ID'),
  
  check('tickets.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  check('agentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid agent ID')
];
