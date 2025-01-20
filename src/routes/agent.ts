import express from 'express';
import {
  registerAgent,
  getAgentProfile,
  updateAgentProfile,
  getAgentEvents,
  getAgentStats,
  getAllAgents,
  updateAgentStatus
} from '../controllers/agent';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
// import { validateAgent } from '../validations/agent';

const router = express.Router();

router.use(protect as any);

router.post('/register', authorize('agent') as any, upload.array('documents'), registerAgent as any);
router.get('/profile', authorize('agent') as any, getAgentProfile as any);
router.put('/profile', authorize('agent') as any, upload.array('documents'), updateAgentProfile as any);
router.get('/events', authorize('agent') as any, getAgentEvents as any);
router.get('/stats', authorize('agent') as any, getAgentStats as any);

router.get('/', authorize('admin') as any, getAllAgents as any);
router.put('/:id/status', authorize('admin') as any, updateAgentStatus as any);

export default router;