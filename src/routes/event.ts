// src/routes/event.ts

import express from 'express';
import { 
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  toggleFeatureEvent,
  getEventsByOrganizer,
  getFeaturedEvents,
  getUpcomingEvents,
  getEventDetails,
  getEventTickets
} from '../controllers/event';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { validateEvent } from '../validations/event';
import { cache } from '../middleware/cache';

const router = express.Router();

// Wrap middleware/handlers to match Express types
const asyncHandler = (fn: Function) => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise.resolve(fn(req, res, next)).catch(next);

// Public routes
router.get('/', asyncHandler(cache('5m')), asyncHandler(getAllEvents));
router.get('/featured', asyncHandler(cache('5m')), asyncHandler(getFeaturedEvents));
router.get('/upcoming', asyncHandler(cache('5m')), asyncHandler(getUpcomingEvents));
router.get('/:id', asyncHandler(cache('5m')), asyncHandler(getEventById));
router.get('/:id/details', asyncHandler(cache('5m')), asyncHandler(getEventDetails));
router.get('/:id/tickets', asyncHandler(getEventTickets));

// Protected routes
router.use(asyncHandler(protect));

// Organizer routes (admin & agent)
router.post('/', 
  asyncHandler(authorize('admin', 'agent')), 
  upload.array('images', 5), 
  validateEvent, 
  asyncHandler(createEvent)
);

router.put('/:id', 
  asyncHandler(authorize('admin', 'agent')), 
  upload.array('images', 5), 
  validateEvent, 
  asyncHandler(updateEvent)
);

router.delete('/:id', 
  asyncHandler(authorize('admin', 'agent')), 
  asyncHandler(deleteEvent)
);

router.get('/organizer/events', asyncHandler(getEventsByOrganizer));

// Admin only routes
router.put('/:id/status', asyncHandler(authorize('admin')), asyncHandler(updateEventStatus));
router.put('/:id/feature', asyncHandler(authorize('admin')), asyncHandler(toggleFeatureEvent));

export default router;