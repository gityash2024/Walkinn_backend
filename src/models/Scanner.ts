
import mongoose from 'mongoose';

const scannerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  assignedEvents: [{
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    },
    startTime: Date,
    endTime: Date
  }],
  scanStats: {
    totalScans: {
      type: Number,
      default: 0
    },
    validScans: {
      type: Number,
      default: 0
    },
    invalidScans: {
      type: Number,
      default: 0
    },
    lastScanAt: Date
  },
  device: {
    deviceId: String,
    deviceType: String,
    lastLoginIp: String,
    lastLoginAt: Date
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add index for geospatial queries
scannerSchema.index({ location: '2dsphere' });

export default mongoose.model('Scanner', scannerSchema);

