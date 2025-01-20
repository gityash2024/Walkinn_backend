// src/services/qrcode.ts

import QRCode from 'qrcode';
import crypto from 'crypto';
import { logger } from '../utils/logger';

class QRCodeServiceClass {
  private static instance: QRCodeServiceClass;

  private constructor() {}

  public static getInstance(): QRCodeServiceClass {
    if (!QRCodeServiceClass.instance) {
      QRCodeServiceClass.instance = new QRCodeServiceClass();
    }
    return QRCodeServiceClass.instance;
  }

  async generateQRCode(data: string): Promise<string> {
    try {
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      return await QRCode.toDataURL(hash);
    } catch (error) {
      logger.error('QR code generation error:', error);
      throw error;
    }
  }

  async generateTicketQR(ticketId: string, eventId: string): Promise<string> {
    try {
      const data = {
        ticketId,
        eventId,
        timestamp: Date.now()
      };
      return await QRCode.toDataURL(JSON.stringify(data));
    } catch (error) {
      logger.error('Ticket QR code generation error:', error);
      throw error;
    }
  }

  async verifyQRCode(qrData: string): Promise<boolean> {
    try {
      const data = JSON.parse(qrData);
      return Boolean(data.ticketId && data.eventId);
    } catch (error) {
      logger.error('QR code verification error:', error);
      return false;
    }
  }
}

export const QRCodeService = QRCodeServiceClass.getInstance();
export const generateQRCode = (data: string) => QRCodeService.generateQRCode(data);
export const generateTicketQR = (ticketId: string, eventId: string) => QRCodeService.generateTicketQR(ticketId, eventId);
export const verifyQRCode = (qrData: string) => QRCodeService.verifyQRCode(qrData);