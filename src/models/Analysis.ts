
import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  ticketSales: {
    total: Number,
    byTier: [{
      tierId: String,
      count: Number,
      revenue: Number
    }],
    byTimeSlot: [{
      hour: Number,
      count: Number,
      revenue: Number
    }]
  },
  attendance: {
    total: Number,
    checkedIn: Number,
    noShow: Number,
    byHour: [{
      hour: Number,
      count: Number
    }]
  },
  demographics: {
    ageGroups: [{
      range: String,
      count: Number
    }],
    gender: {
      male: Number,
      female: Number,
      other: Number
    },
    location: [{
      city: String,
      count: Number
    }]
  },
  revenue: {
    total: Number,
    tickets: Number,
    addOns: Number,
    refunds: Number,
    netRevenue: Number
  },
  agentPerformance: [{
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ticketsSold: Number,
    revenue: Number,
    commission: Number
  }],
  scannerActivity: [{
    scannerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scansCount: Number,
    validScans: Number,
    invalidScans: Number,
    avgScanTime: Number
  }]
}, {
  timestamps: true
});

export default mongoose.model('Analysis', analysisSchema);