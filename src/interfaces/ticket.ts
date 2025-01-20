import { Document, Types } from 'mongoose';
import { IUser } from './user';
import { IEvent } from './event';

interface IScanHistory {
  scannedBy: Types.ObjectId;
  scannedAt: Date;
  location?: string;
}

interface ITicketTier {
  id: Types.ObjectId;
  name: string;
  price: number;
  type: 'single' | 'couple' | 'group';
}

export interface ITicket extends Document {
  eventId: Types.ObjectId | IEvent;
  userId: Types.ObjectId | IUser;
  bookingId: Types.ObjectId;
  tier: ITicketTier;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  qrCode: string;
  validUntil: Date;
  usedAt?: Date;
  scanHistory: IScanHistory[];
}