import express from 'express';
import {
  getTicketById,
  getUserTickets,
  verifyTicket,
  generateTicket,
  resendTicket,
  cancelTicket,
  transferTicket,
  getEventTickets,
  validateTicket,
  getTicketHistory,
  downloadTicket,
  bulkGenerateTickets
} from '../controllers/ticket';
import { protect, authorize } from '../middleware/auth';
import { validateTicketTransfer } from '../validations/ticket';

const router = express.Router();

router.use(protect as express.RequestHandler);

// User routes
router.get('/my-tickets', getUserTickets as express.RequestHandler);
router.get('/history', getTicketHistory as express.RequestHandler);
router.get('/:id', getTicketById as express.RequestHandler);
router.get('/:id/download', downloadTicket as express.RequestHandler);
router.post('/:id/transfer', validateTicketTransfer, transferTicket as express.RequestHandler);
router.post('/:id/cancel', cancelTicket as express.RequestHandler);
router.get('/:id/generate', generateTicket as express.RequestHandler);
router.post('/:id/resend', resendTicket as express.RequestHandler);

// Agent/Scanner routes
router.post('/verify', 
  authorize('admin', 'agent', 'scanner') as express.RequestHandler,
  verifyTicket as express.RequestHandler
);

router.post('/validate', 
  authorize('admin', 'agent', 'scanner') as express.RequestHandler,
  validateTicket as express.RequestHandler
);

router.get('/event/:eventId', 
  authorize('admin', 'agent') as express.RequestHandler,
  getEventTickets as express.RequestHandler
);

// Admin routes
router.post('/bulk-generate', 
  authorize('admin') as express.RequestHandler,
  bulkGenerateTickets as express.RequestHandler
);

export default router;