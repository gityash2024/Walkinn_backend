import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs/promises';
import Handlebars from 'handlebars';
import { emailConfig } from '../config/email';
import { logger } from '../utils/logger';

export interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: any;
  attachments?: any[];
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async compileTemplate(templateName: string, data: any): Promise<string> {
    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
      const template = await fs.readFile(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error) {
      logger.error('Template compilation error:', error);
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const html = await this.compileTemplate(options.template, options.data);

      const mailOptions = {
        from: emailConfig.from,
        to: options.email,
        subject: options.subject,
        html,
        attachments: options.attachments
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.email}`);
    } catch (error) {
      logger.error('Email sending error:', error);
      throw error;
    }
  }

  async sendBulkEmails(options: EmailOptions[]): Promise<void> {
    try {
      const promises = options.map(option => this.sendEmail(option));
      await Promise.all(promises);
      logger.info(`Bulk emails sent successfully to ${options.length} recipients`);
    } catch (error) {
      logger.error('Bulk email sending error:', error);
      throw error;
    }
  }

  async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
    } catch (error) {
      logger.error('Email service connection verification failed:', error);
      throw error;
    }
  }
}

// Singleton instance for use throughout the application
const emailService = EmailService.getInstance();

// Helper function to simplify email sending
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  await emailService.sendEmail(options);
};

// Helper function for bulk emails
export const sendBulkEmails = async (options: EmailOptions[]): Promise<void> => {
  await emailService.sendBulkEmails(options);
};

// Export the service instance for direct access if needed
export default emailService;