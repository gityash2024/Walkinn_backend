import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Config } from '../config/aws';
import { logger } from '../utils/logger';

export class UploadService {
  private static instance: UploadService;
  private s3Client: S3Client;
  public static readonly bucketName = s3Config.buckets.uploads;

  private constructor() {
    this.s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!
      }
    });
  }

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  async uploadFile(file: Express.Multer.File, folder: string, fileName?: string): Promise<string> {
    try {
      const key = `${folder}/${fileName || Date.now()}-${file.originalname}`;
      
      const command = new PutObjectCommand({
        Bucket: UploadService.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      });

      await this.s3Client.send(command);
      return `https://${UploadService.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
    } catch (error) {
      logger.error('File upload error:', error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: UploadService.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error('File deletion error:', error);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: UploadService.bucketName,
        Key: key
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      logger.error('Signed URL generation error:', error);
      throw error;
    }
  }
}