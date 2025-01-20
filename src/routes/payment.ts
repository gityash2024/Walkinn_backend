// src/routes/payment.ts
import express, { RequestHandler } from 'express';
import { protect } from '../middleware/auth';
import { validatePayment } from '../validations/payment';
import * as paymentController from '../controllers/payment';

const router = express.Router();

// Webhook route doesn't need authentication
router.post(
  '/webhook',
  paymentController.handlePaymentWebhook as RequestHandler
);

// Protect all routes after this middleware
router.use(protect as RequestHandler);

router.post(
  '/initiate',
  validatePayment as RequestHandler[],
  paymentController.initiatePayment as RequestHandler
);

router.post(
  '/confirm',
  paymentController.confirmPayment as RequestHandler
);

router.post(
  '/verify',
  paymentController.verifyPayment as RequestHandler
);

router.get(
  '/methods',
  paymentController.getPaymentMethods as RequestHandler
);

router.get(
  '/history',
  paymentController.getPaymentHistory as RequestHandler
);

router.get(
  '/:id',
  paymentController.getPaymentDetails as RequestHandler
);

router.get(
  '/:id/transaction',
  paymentController.getPaymentDetails as RequestHandler
);

router.post(
  '/:paymentId/refund',
  paymentController.initiateRefund as RequestHandler
);

export default router;