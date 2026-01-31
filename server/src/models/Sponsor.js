import mongoose from 'mongoose';

/**
 * Sponsor Model
 * Partner brands that fund the donation pool
 * Must be synced with on-chain Sponsor Registry
 */
const sponsorSchema = new mongoose.Schema({
  // Must match on-chain name exactly
  name: {
    type: String,
    required: true,
    maxlength: 64
  },

  // Solana wallet address
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    match: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  },

  description: String,
  logoUrl: String,
  websiteUrl: String,

  // Product categories this sponsor offers
  categories: [{
    type: String,
    enum: ['clothing', 'footwear', 'accessories', 'home', 'personal-care', 'food', 'electronics']
  }],

  // Stats from on-chain (synced periodically)
  totalDeposited: {
    type: Number,
    default: 0  // In lamports
  },
  totalDepositedUsd: {
    type: Number,
    default: 0
  },
  depositCount: {
    type: Number,
    default: 0
  },
  lastDepositAt: Date,

  isVerified: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

sponsorSchema.index({ isVerified: 1, name: 1 });

const Sponsor = mongoose.model('Sponsor', sponsorSchema);

export default Sponsor;
