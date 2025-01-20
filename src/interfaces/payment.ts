import { Document } from 'mongoose';
import { Request } from 'express';

export interface IPayment extends Document {
  userId: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: 'card' | 'netbanking' | 'upi' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentGatewayResponse?: any;
  refundId?: string;
  refundAmount?: number;
  refundStatus?: string;
  metadata?: any;
}

export interface PaymentRequest extends Request {
  user: {
    _id: string;
    email: string;
    role: string;
    stripeCustomerId?: string;
  };
}

export interface PaymentWebhookData {
  eventType: string;
  data: any;
}