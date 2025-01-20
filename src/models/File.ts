
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  path: String,
  bucket: String,
  key: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Event', 'User', 'Venue', 'Ticket', 'Agent'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  purpose: {
    type: String,
    enum: ['profile', 'event', 'venue', 'document', 'ticket', 'other'],
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['processing', 'active', 'deleted'],
    default: 'processing'
  },
  metadata: mongoose.Schema.Types.Mixed,
  expiresAt: Date
}, {
  timestamps: true
});

// Add indexes for better query performance
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ 'relatedTo.model': 1, 'relatedTo.id': 1 });
fileSchema.index({ status: 1 });
fileSchema.index({ fileName: 'text', originalName: 'text' });

export default mongoose.model('File', fileSchema);