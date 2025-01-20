
import { Twilio } from 'twilio';
import { smsConfig } from '../config/sms';
import { logger } from '../utils/logger';

interface SMSOptions {
  to: string;
  message: string;
  template?: string;
  data?: any;
}

export class SMSService {
  private static instance: SMSService;
  private client: Twilio;

  private constructor() {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  private compileTemplate(template: string, data: any): string {
    return template.replace(/{{(\w+)}}/g, (match, key) => data[key] || '');
  }

  async sendSMS(options: SMSOptions): Promise<void> {
    try {
      let message = options.message;

      if (options.template && options.data) {
        const template = smsConfig.templates[options.template as keyof typeof smsConfig.templates];
        message = this.compileTemplate(template, options.data);
      }

      await this.client.messages.create({
        body: message,
        to: options.to,
        from: smsConfig.from
      });

      logger.info(`SMS sent successfully to ${options.to}`);
    } catch (error) {
      logger.error('SMS sending error:', error);
      throw error;
    }
  }

  async sendBulkSMS(options: SMSOptions[]): Promise<void> {
    try {
      const promises = options.map(option => this.sendSMS(option));
      await Promise.all(promises);
      logger.info(`Bulk SMS sent successfully to ${options.length} recipients`);
    } catch (error) {
      logger.error('Bulk SMS sending error:', error);
      throw error;
    }
  }

  async sendOTP(phone: string): Promise<string> {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.sendSMS({
        to: phone,
        template: 'otp',
        data: {
          otp,
          validityMinutes: smsConfig.otpValidityMinutes
        }
      });
      return otp;
    } catch (error) {
      logger.error('OTP sending error:', error);
      throw error;
    }
  }
}