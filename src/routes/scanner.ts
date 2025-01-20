import express from 'express';
import {
  registerScanner,
  getScannerProfile,
  updateScannerLocation,
  scanTicket,
  getScannerStats,
  assignScannerToEvent
} from '../controllers/scanner';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect as any);

// Scanner routes
router.post('/register', authorize('scanner') as any, registerScanner as any);
router.get('/profile', authorize('scanner') as any, getScannerProfile as any);
router.put('/location', authorize('scanner') as any, updateScannerLocation as any);
router.post('/scan', authorize('scanner') as any, scanTicket as any);
router.get('/stats', authorize('scanner') as any, getScannerStats as any);

// Admin routes
router.post('/:scannerId/assign', authorize('admin') as any, assignScannerToEvent as any);

export default router;