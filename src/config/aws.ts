
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!
  }
});

export const getPresignedUrl = async (bucket: string, key: string): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    logger.error('Error generating presigned URL:', error);
    throw error;
  }
};

export const s3Config = {
  buckets: {
    uploads: process.env.AWS_BUCKET_UPLOADS || 'ems-uploads',
    documents: process.env.AWS_BUCKET_DOCUMENTS || 'ems-documents',
    images: process.env.AWS_BUCKET_IMAGES || 'ems-images'
  },
  region: process.env.AWS_REGION || 'us-east-1',
  acl: 'public-read' as const,  // Type assertion to make it a literal type
  signedUrlExpireSeconds: 60 * 60 // 1 hour
};