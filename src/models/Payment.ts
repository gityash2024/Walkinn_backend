import mongoose from 'mongoose';
import { IPayment } from '../interfaces/payment';

const paymentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['card', 'netbanking', 'upi', 'wallet'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  paymentGatewayResponse: mongoose.Schema.Types.Mixed,
  refundId: String,
  refundAmount: Number,
  refundStatus: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

paymentSchema.index({ userId: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

export default mongoose.model<IPayment>('Payment', paymentSchema);