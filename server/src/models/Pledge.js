import mongoose from 'mongoose';

/**
 * Pledge Model
 * Tracks user pledges to NGOs before weekly batch processing
 */
const pledgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ngo',
    required: true
  },

  // Points pledged (minimum 500 = $5)
  points: {
    type: Number,
    required: true,
    min: 500
  },

  // Week identifier (YYYYWW format, e.g., 202605)
  weekNumber: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  // Filled after batch processing
  batchReceiptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchReceipt'
  },

  // Calculated value at time of pledge
  estimatedUsd: Number

}, {
  timestamps: true
});

// Index for batch processing
pledgeSchema.index({ weekNumber: 1, status: 1 });
pledgeSchema.index({ userId: 1, createdAt: -1 });

// Static method to get current week number
pledgeSchema.statics.getCurrentWeekNumber = function() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000; // milliseconds in a week
  const weekNum = Math.ceil(diff / oneWeek);
  return parseInt(`${now.getFullYear()}${weekNum.toString().padStart(2, '0')}`);
};

const Pledge = mongoose.model('Pledge', pledgeSchema);

export default Pledge;
