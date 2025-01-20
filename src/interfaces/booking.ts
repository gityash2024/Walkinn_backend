import { Document, Types } from 'mongoose';
import { IUser } from './user';
import { IEvent } from './event';

export interface IBooking extends Document {
  userId: Types.ObjectId | IUser;
  eventId: Types.ObjectId | IEvent;
  tickets: Array<{
    tierId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  agent?: {
    id: Types.ObjectId;
    name: string;
    commission: number;
  };
  refundStatus?: 'none' | 'requested' | 'approved' | 'completed';
  cancelledAt?: Date;
  refundedAt?: Date;
  discountCode?: string;
  createdAt: Date;
  updatedAt: Date;
}