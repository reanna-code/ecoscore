import mongoose from 'mongoose';

// Badge sub-schema
const badgeSchema = new mongoose.Schema({
  badgeId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  icon: String,
  category: {
    type: String,
    enum: ['streak', 'swap', 'local', 'donation', 'challenge', 'capture'],
    default: 'swap'
  },
  earnedAt: { type: Date, default: Date.now }
}, { _id: false });

// Donation sub-schema
const donationSchema = new mongoose.Schema({
  organizationId: { type: String, required: true },
  organizationName: String,
  pointsSpent: { type: Number, required: true },
  amountDollars: Number,
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, { _id: true });

// Scan history sub-schema
const scanSchema = new mongoose.Schema({
  productName: String,
  brand: String,
  category: String,
  ecoScore: Number,
  scannedAt: { type: Date, default: Date.now },
  // Swap info (if user chose an alternative)
  swappedTo: {
    productName: String,
    brand: String,
    ecoScore: Number
  }
}, { _id: true });

// Main User schema
const userSchema = new mongoose.Schema({
  // Firebase UID - links to Firebase Auth
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  displayName: String,
  avatarUrl: String,
  
  // Friend code for adding friends
  friendCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Eco stats
  ecoScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  pointsBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  streakCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActiveDate: Date,
  
  // Monthly stats
  scansThisMonth: { type: Number, default: 0 },
  swapsThisMonth: { type: Number, default: 0 },
  
  // Collections
  badges: [badgeSchema],
  donations: [donationSchema],
  scanHistory: [scanSchema],
  
  // Friends (references to other users)
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Pending friend requests
  friendRequestsSent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequestsReceived: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Settings
  isPublicProfile: { type: Boolean, default: true },
  notificationsEnabled: { type: Boolean, default: true },

  // Custodial Solana Wallet
  solanaWallet: {
    publicKey: String,
    // Encrypted private key (in production, use proper key management)
    encryptedPrivateKey: String,
    createdAt: Date
  },

  // Minted NFT Certificates (milestone-based)
  nftCertificates: [{
    mintAddress: String,
    metadataUri: String,
    imageUri: String,
    milestone: Number, // The milestone tier: 5, 25, 50, 100
    donationAmountAtMint: Number, // Total donated when minted
    co2Offset: Number,
    ngoName: String,
    txSignature: String,
    mintedAt: { type: Date, default: Date.now }
  }]

}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Generate unique friend code before saving
userSchema.pre('save', function(next) {
  if (!this.friendCode) {
    // Generate friend code: ECO-XXXX-XXXX
    const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    this.friendCode = `ECO-${randomPart()}-${randomPart()}`;
  }
  next();
});

// Virtual for total friends count
userSchema.virtual('friendsCount').get(function() {
  return this.friends?.length || 0;
});

// Instance method to get public profile (for other users to see)
userSchema.methods.toPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatarUrl: this.avatarUrl,
    ecoScore: this.ecoScore,
    pointsBalance: this.pointsBalance,
    badges: this.badges,
    streakCount: this.streakCount,
    friendsCount: this.friends?.length || 0
  };
};

// Instance method to get own profile (includes private data like email)
userSchema.methods.toOwnProfile = function() {
  return {
    id: this._id,
    firebaseUid: this.firebaseUid,
    email: this.email,
    username: this.username,
    displayName: this.displayName,
    avatarUrl: this.avatarUrl,
    friendCode: this.friendCode,
    ecoScore: this.ecoScore,
    pointsBalance: this.pointsBalance,
    totalPointsEarned: this.totalPointsEarned,
    streakCount: this.streakCount,
    scansThisMonth: this.scansThisMonth,
    swapsThisMonth: this.swapsThisMonth,
    badges: this.badges,
    friends: this.friends,
    scanHistory: this.scanHistory,
    isPublicProfile: this.isPublicProfile,
    notificationsEnabled: this.notificationsEnabled,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to find by friend code
userSchema.statics.findByFriendCode = function(code) {
  return this.findOne({ friendCode: code.toUpperCase() });
};

// Indexes for common queries
userSchema.index({ pointsBalance: -1 }); // For leaderboard
userSchema.index({ ecoScore: -1 }); // For leaderboard
userSchema.index({ username: 'text' }); // For search

const User = mongoose.model('User', userSchema);

export default User;
