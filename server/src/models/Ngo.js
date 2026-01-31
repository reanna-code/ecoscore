import mongoose from 'mongoose';

/**
 * NGO Model
 * Stores whitelisted NGOs that can receive donations
 * Must be synced with on-chain NGO Registry
 */
const ngoSchema = new mongoose.Schema({
  // Must match on-chain name exactly
  name: {
    type: String,
    required: true,
    maxlength: 64
  },

  // Solana wallet address (44 chars base58)
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    match: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  },

  description: String,
  logoUrl: String,
  websiteUrl: String,

  // Categories for filtering
  categories: [{
    type: String,
    enum: ['climate', 'ocean', 'forest', 'wildlife', 'pollution', 'education']
  }],

  // Stats (updated after each batch)
  totalReceived: {
    type: Number,
    default: 0  // In lamports
  },
  totalReceivedUsd: {
    type: Number,
    default: 0
  },
  donationCount: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for active NGOs
ngoSchema.index({ isActive: 1, name: 1 });

const Ngo = mongoose.model('Ngo', ngoSchema);

export default Ngo;
