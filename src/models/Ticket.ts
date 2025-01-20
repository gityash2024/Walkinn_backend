import mongoose from 'mongoose';
import { ITicket } from '../interfaces';

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  tier: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: String,
    price: Number,
    type: {
      type: String,
      enum: ['single', 'couple', 'group']
    }
  },
  status: {
    type: String,
    enum: ['active', 'used', 'cancelled', 'expired'],
    default: 'active'
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usedAt: Date,
  scanHistory: [{
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scannedAt: {
      type: Date,
      default: Date.now
    },
    location: String
  }]
}, {
  timestamps: true
});

ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ userId: 1 });
ticketSchema.index({ bookingId: 1 });
ticketSchema.index({ qrCode: 1 });

export default mongoose.model<ITicket>('Ticket', ticketSchema);