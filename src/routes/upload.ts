import express, { Request, Response, NextFunction } from 'express';
import {
  uploadFile,
  uploadMultipleFiles,
  getFile,
  deleteFile
} from '../controllers/upload';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

router.use((req: any, res: Response, next: NextFunction) => {
  protect(req, res, next);
});

router.post('/single', 
  upload.single('file'), 
  (req: any, res: Response, next: NextFunction) => {
    uploadFile(req, res, next).catch(next);
  }
);

router.post('/multiple', 
  upload.array('files', 5), 
  (req: any, res: Response, next: NextFunction) => {
    uploadMultipleFiles(req, res, next).catch(next);
  }
);

router.get('/:id', 
  (req: any, res: Response, next: NextFunction) => {
    getFile(req, res, next).catch(next);
  }
);

router.delete('/:id', 
  (req: any, res: Response, next: NextFunction) => {
    deleteFile(req, res, next).catch(next);
  }
);

export default router;