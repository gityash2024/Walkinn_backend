import express from 'express';
import {
  createReview,
  getEventReviews,
  updateReviewStatus,
  deleteReview,
  getUserReviews
} from '../controllers/review';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { cache } from '../middleware/cache';

const router = express.Router();

// Public routes
router.get('/events/:eventId', cache('5m') as any, getEventReviews as any);

// Protected routes
router.use(protect as any);

router.post('/', upload.array('images', 3), createReview as any);
router.get('/user', getUserReviews as any);
router.delete('/:id', deleteReview as any);

// Admin routes
router.put('/:id/status', authorize('admin') as any, updateReviewStatus as any);

export default router;