import express, { Request, Response, NextFunction } from 'express';
import {
  generateEventAnalytics,
  getEventAnalytics,
  getDashboardAnalytics
} from '../controllers/analytics';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { cache } from '../middleware/cache';

const router = express.Router();

router.use((req: any, res: Response, next: NextFunction) => {
  protect(req, res, next);
});

router.use((req: any, res: Response, next: NextFunction) => {
  authorize('admin')(req, res, next);
});

router.get('/dashboard', 
  (req: Request, res: Response, next: NextFunction) => {
    cache('5m')(req, res, () => {
      getDashboardAnalytics(req, res, next).catch(next);
    });
  }
);

router.get('/events/:eventId', 
  (req: Request, res: Response, next: NextFunction) => {
    cache('5m')(req, res, () => {
      getEventAnalytics(req, res, next).catch(next);
    });
  }
);

router.post('/events/:eventId/generate', 
  (req: Request, res: Response, next: NextFunction) => {
    generateEventAnalytics(req, res, next).catch(next);
  }
);

export default router;