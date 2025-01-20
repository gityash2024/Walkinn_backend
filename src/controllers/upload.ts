import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import File from '../models/File';
import { UploadService } from '../services/upload';

interface CustomRequest extends Request {
  user: {
    _id: string;
    id?: string;
    email?: string;
    role: string;
    stripeCustomerId?: string;
  };
}

export const uploadFile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'No file uploaded');
    }

    const { purpose, relatedModel, relatedId } = req.body;

    const uploadService = UploadService.getInstance();

    const url = await uploadService.uploadFile(
      req.file, 
      purpose.toLowerCase(), 
      relatedId
    );

    const file = await File.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileType: req.file.mimetype,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: url,
      bucket: UploadService.bucketName,
      key: `${purpose.toLowerCase()}/${relatedId}-${req.file.originalname}`,
      uploadedBy: req.user._id,
      relatedTo: {
        model: relatedModel,
        id: relatedId
      },
      purpose,
      status: 'active'
    });

    ApiResponse.created(res, { file });
  } catch (error) {
    next(error);
  }
};

export const uploadMultipleFiles = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return ApiResponse.badRequest(res, 'No files uploaded');
    }

    const { purpose, relatedModel, relatedId } = req.body;

    const uploadService = UploadService.getInstance();

    const uploadPromises = req.files.map(async (file) => {
      const url = await uploadService.uploadFile(
        file, 
        purpose.toLowerCase(), 
        relatedId
      );

      return File.create({
        originalName: file.originalname,
        fileName: file.filename,
        fileType: file.mimetype,
        mimeType: file.mimetype,
        size: file.size,
        url: url,
        bucket: UploadService.bucketName,
        key: `${purpose.toLowerCase()}/${relatedId}-${file.originalname}`,
        uploadedBy: req.user._id,
        relatedTo: {
          model: relatedModel,
          id: relatedId
        },
        purpose,
        status: 'active'
      });
    });

    const files = await Promise.all(uploadPromises);
    ApiResponse.created(res, { files });
  } catch (error) {
    next(error);
  }
};

export const getFile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return ApiResponse.notFound(res, 'File not found');
    }

    const uploadService = UploadService.getInstance();

    if (!file.isPublic && 
        file.uploadedBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have permission to access this file');
    }

    if (file.bucket && file.key) {
      const presignedUrl = await uploadService.getSignedUrl(file.key);
      file.url = presignedUrl;
    }

    ApiResponse.success(res, { file });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return ApiResponse.notFound(res, 'File not found');
    }

    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have permission to delete this file');
    }

    const uploadService = UploadService.getInstance();

    if (file.bucket && file.key) {
      await uploadService.deleteFile(file.key);
    }

    await file.deleteOne();
    ApiResponse.success(res, null, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
};