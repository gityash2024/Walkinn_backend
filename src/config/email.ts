
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter;

export const initializeEmailTransporter = async () => {
  try {
    transporter = nodemailer.createTransport({
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

    // Verify connection
    await transporter.verify();
    logger.info('Email service initialized successfully');
  } catch (error) {
    logger.error('Error initializing email service:', error);
    throw error;
  }
};

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'EMS <noreply@ems.com>',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@ems.com',
  templates: {
    welcome: 'welcome',
    booking: 'booking-confirmation',
    ticket: 'ticket-confirmation',
    resetPassword: 'reset-password',
    verification: 'email-verification',
    notification: 'notification'
  }
};

export const getEmailTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }
  return transporter;
};