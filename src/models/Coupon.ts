import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  maxDiscount: Number,
  minPurchase: Number,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxUsage: {
    type: Number,
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  applicableEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  userType: {
    type: String,
    enum: ['all', 'new', 'existing'],
    default: 'all'
  }
}, {
  timestamps: true
});

export default mongoose.model('Coupon', couponSchema);