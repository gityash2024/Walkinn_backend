import mongoose from 'mongoose';
import { IEvent } from '../interfaces';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationStartDate: {
    type: Date,
    required: true
  },
  registrationEndDate: {
    type: Date,
    required: true
  },
  thumbnail: String,
  images: [String],
  venue: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    capacity: {
      type: Number,
      required: true
    },
    amenities: [String]
  },
  organizer: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String,
    phone: String,
    role: {
      type: String,
      enum: ['admin', 'agent']
    }
  },
  ticketTiers: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    maxPerBooking: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['single', 'couple', 'group'],
      required: true
    },
    available: {
      type: Number,
      required: true
    }
  }],
  minTickets: {
    type: Number,
    default: 1
  },
  maxTickets: Number,
  totalTickets: Number,
  soldTickets: {
    type: Number,
    default: 0
  },
  price: {
    min: Number,
    max: Number
  },
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'venue.city': 1 });
eventSchema.index({ 'organizer.id': 1 });

export default mongoose.model<IEvent>('Event', eventSchema);
