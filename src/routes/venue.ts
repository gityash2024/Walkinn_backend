import express from 'express';
import {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
  checkVenueAvailability
} from '../controllers/venue';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { cache } from '../middleware/cache';

const router = express.Router();

router.get('/', cache('5m') as any, getVenues as any);
router.get('/:id', cache('5m') as any, getVenueById as any);
router.get('/:venueId/availability', checkVenueAvailability as any);

router.use(protect as any);
router.use(authorize('admin') as any);

router.post('/', upload.array('images', 5),  createVenue as any);
router.put('/:id', upload.array('images', 5),  updateVenue as any);
router.delete('/:id', deleteVenue as any);

export default router;