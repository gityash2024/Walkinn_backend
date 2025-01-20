
import { WebSocket } from 'ws';
import { getRedisClient } from '../config/redis';
import { sendEmail } from './email';
import { sendSMS } from './sms';
import { logger } from '../utils/logger';

interface Notification {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  email?: boolean;
  sms?: boolean;
  push?: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private wsClients: Map<string, WebSocket>;
  private redis: any;

  private constructor() {
    this.wsClients = new Map();
    this.redis = getRedisClient();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  addWSClient(userId: string, ws: WebSocket): void {
    this.wsClients.set(userId, ws);
  }

  removeWSClient(userId: string): void {
    this.wsClients.delete(userId);
  }

  async sendNotification(notification: Notification): Promise<void> {
    try {
      // Store notification in database
      await this.storeNotification(notification);

      // Send real-time notification if user is connected
      if (notification.push && this.wsClients.has(notification.userId)) {
        const ws = this.wsClients.get(notification.userId);
        ws?.send(JSON.stringify(notification));
      }

      // Send email notification
      if (notification.email) {
        await sendEmail({
          to: notification.userId,
          subject: notification.title,
          template: 'notification',
          data: notification
        });
      }

      // Send SMS notification
      if (notification.sms) {
        await sendSMS({
          to: notification.userId,
          message: `${notification.title}: ${notification.message}`
        });
      }

      logger.info(`Notification sent to user ${notification.userId}`);
    } catch (error) {
      logger.error('Notification sending error:', error);
      throw error;
    }
  }

  private async storeNotification(notification: Notification): Promise<void> {
    try {
      const key = `notifications:${notification.userId}`;
      const value = JSON.stringify({
        ...notification,
        timestamp: new Date(),
        read: false
      });
      
      await this.redis.lPush(key, value);
      await this.redis.lTrim(key, 0, 99); // Keep last 100 notifications
    } catch (error) {
      logger.error('Notification storage error:', error);
      throw error;
    }
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const key = `notifications:${userId}`;
      const notifications = await this.redis.lRange(key, 0, -1);
      return notifications
        .map(n => JSON.parse(n))
        .filter(n => !n.read);
    } catch (error) {
      logger.error('Get notifications error:', error);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const key = `notifications:${userId}`;
      const notifications = await this.redis.lRange(key, 0, -1);
      
      const updatedNotifications = notifications.map(n => {
        const notification = JSON.parse(n);
        if (notification.id === notificationId) {
          notification.read = true;
        }
        return JSON.stringify(notification);
      });

      await this.redis.del(key);
      for (const notification of updatedNotifications) {
        await this.redis.rPush(key, notification);
      }
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      throw error;
    }
  }
}