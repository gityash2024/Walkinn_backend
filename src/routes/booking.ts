import express, { Request, Response, NextFunction } from 'express';
import {
  createBooking,
  confirmBooking,
  getBookingDetails,
  getUserBookings,
  cancelBooking,
  updateBooking,
  getBookingHistory,
  getAgentBookings,
  applyDiscount,
  validateBookingAvailability
} from '../controllers/booking';
import { protect, authorize } from '../middleware/auth';
import { validateBooking } from '../validations/booking';
import { rateLimiter } from '../middleware/rateLimiter';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../utils/responses';

interface AuthRequest extends Request {
  user: {
    _id: string;
    email: string;
    username: string;
    firstName?: string;
    role: string;
  };
}

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    ApiResponse.badRequest(res, 'Validation failed', errors.array());
    return;
  }
  next();
};

const router = express.Router();

const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>) => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        return next(new Error('Authentication required'));
      }
      await fn(authReq, res, next);
    } catch (error) {
      next(error);
    }
  };

const rateLimitHandler = (resource: string, limit: number) => 
  (req: Request, res: Response, next: NextFunction): void => {
    rateLimiter(resource, limit)(req, res, next);
  };

router.use(protect as any);

router.post(
  '/', 
  validateBooking,
  handleValidationErrors,
  rateLimitHandler('booking', 5),
  asyncHandler(createBooking)
);

router.post(
  '/:id/confirm', 
  asyncHandler(confirmBooking)
);

router.get(
  '/my-bookings', 
  asyncHandler(getUserBookings)
);

router.get(
  '/history', 
  asyncHandler(getBookingHistory)
);

router.get(
  '/:id', 
  asyncHandler(getBookingDetails)
);

router.post(
  '/:id/cancel', 
  asyncHandler(cancelBooking)
);

router.post(
  '/validate', 
  asyncHandler(validateBookingAvailability)
);

router.post(
  '/:id/discount', 
  asyncHandler(applyDiscount)
);

router.get(
  '/agent-bookings', 
  authorize('agent') as any, 
  asyncHandler(getAgentBookings)
);

router.put(
  '/:id', 
  authorize('admin') as any, 
  asyncHandler(updateBooking)
);

export default router;