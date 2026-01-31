import mongoose from 'mongoose';

/**
 * Product Model
 * Stores product eco-scores and sustainability data
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  brand: String,
  barcode: {
    type: String,
    sparse: true,
    unique: true
  },

  // Category for baseline comparisons
  category: {
    type: String,
    enum: ['clothing', 'footwear', 'accessories', 'home', 'personal-care', 'food', 'electronics', 'other'],
    default: 'other'
  },

  // Eco Score (0-100)
  ecoScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  // Sub-scores for transparency
  scores: {
    packaging: { type: Number, min: 0, max: 100 },
    materials: { type: Number, min: 0, max: 100 },
    carbon: { type: Number, min: 0, max: 100 },
    water: { type: Number, min: 0, max: 100 },
    ethics: { type: Number, min: 0, max: 100 }
  },

  // Product details
  imageUrl: String,
  productUrl: String,
  price: Number,
  currency: { type: String, default: 'USD' },

  // If from a partner sponsor
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor'
  },

  // Is this a sustainable alternative?
  isPartnerProduct: {
    type: Boolean,
    default: false
  },

  // Certifications
  certifications: [{
    type: String,
    enum: ['organic', 'fairtrade', 'bcorp', 'fsc', 'rainforest-alliance', 'leaping-bunny', 'vegan']
  }],

  // For local products
  isLocal: {
    type: Boolean,
    default: false
  },
  originCountry: String

}, {
  timestamps: true
});

// Indexes
productSchema.index({ category: 1, ecoScore: -1 });
productSchema.index({ barcode: 1 });
productSchema.index({ sponsorId: 1, isPartnerProduct: 1 });
productSchema.index({ name: 'text', brand: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
