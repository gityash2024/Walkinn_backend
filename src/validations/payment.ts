import { check } from 'express-validator';

export const validatePayment = [
  check('bookingId')
    .trim()
    .notEmpty()
    .withMessage('Booking ID is required')
    .isMongoId()
    .withMessage('Invalid booking ID'),

  check('paymentMethod')
    .trim()
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['card', 'netbanking', 'upi', 'wallet'])
    .withMessage('Invalid payment method'),

  check('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  check('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Invalid currency code')
];

export const validateRefund = [
  check('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number'),

  check('reason')
    .optional()
    .isString()
    .isIn(['duplicate', 'fraudulent', 'requested_by_customer'])
    .withMessage('Invalid refund reason')
];