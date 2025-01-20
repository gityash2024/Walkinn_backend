

// src/middleware/upload.ts

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import { AppError } from '../utils/errors';

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine folder based on file type
    if (file.fieldname === 'images') uploadPath += 'images/';
    else if (file.fieldname === 'documents') uploadPath += 'documents/';
    else if (file.fieldname === 'avatar') uploadPath += 'avatars/';
    
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed mime types for different file types
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (file.fieldname === 'images' && !allowedImageTypes.includes(file.mimetype)) {
    cb(new AppError('Only .jpeg, .png and .gif format allowed for images', 400));
  } else if (file.fieldname === 'documents' && !allowedDocumentTypes.includes(file.mimetype)) {
    cb(new AppError('Only .pdf and .doc format allowed for documents', 400));
  } else {
    cb(null, true);
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 files
  }
});
