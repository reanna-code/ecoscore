import mongoose from 'mongoose';

/**
 * BatchReceipt Model
 * Records on-chain transaction receipts for weekly batch disbursements
 */

const allocationSchema = new mongoose.Schema({
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ngo',
    required: true
  },
  ngoName: String,
  ngoWallet: String,
  pointsAllocated: Number,
  lamportsAllocated: Number,
  usdAllocated: Number
}, { _id: false });

const batchReceiptSchema = new mongoose.Schema({
  // Week identifier (YYYYWW format)
  weekNumber: {
    type: Number,
    required: true,
    unique: true
  },

  // Solana transaction signature (88 chars)
  txSignature: {
    type: String,
    required: true,
    unique: true
  },

  // Total amounts
  totalPointsRedeemed: {
    type: Number,
    required: true
  },
  totalLamports: {
    type: Number,
    required: true
  },
  totalUsd: Number,

  // Breakdown per NGO
  allocations: [allocationSchema],

  // Processing metadata
  processedAt: {
    type: Date,
    default: Date.now
  },

  // Solana cluster used
  cluster: {
    type: String,
    enum: ['mainnet-beta', 'devnet', 'localnet'],
    default: 'devnet'
  },

  // Explorer URL for easy access
  explorerUrl: String

}, {
  timestamps: true
});

// Virtual for explorer link
batchReceiptSchema.virtual('solanaExplorerUrl').get(function() {
  const base = this.cluster === 'mainnet-beta'
    ? 'https://explorer.solana.com/tx/'
    : `https://explorer.solana.com/tx/${this.txSignature}?cluster=${this.cluster}`;
  return base;
});

batchReceiptSchema.index({ weekNumber: -1 });
batchReceiptSchema.index({ processedAt: -1 });

const BatchReceipt = mongoose.model('BatchReceipt', batchReceiptSchema);

export default BatchReceipt;
