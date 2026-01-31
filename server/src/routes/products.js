import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * GET /api/products
 * List/search products with filtering
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, partnerOnly, limit = 20 } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (partnerOnly === 'true') {
      query.isPartnerProduct = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate('sponsorId', 'name logoUrl')
      .select('-__v')
      .sort({ ecoScore: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/products/:id
 * Get single product
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sponsorId', 'name logoUrl websiteUrl')
      .select('-__v');

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

/**
 * GET /api/products/:id/alternatives
 * Get sustainable alternatives for a product
 */
router.get('/:id/alternatives', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Find better alternatives in the same category from partner brands
    const alternatives = await Product.find({
      category: product.category,
      isPartnerProduct: true,
      ecoScore: { $gt: product.ecoScore },
      _id: { $ne: product._id }
    })
      .populate('sponsorId', 'name logoUrl websiteUrl')
      .select('-__v')
      .sort({ ecoScore: -1 })
      .limit(5);

    // Calculate potential points for switching
    const alternativesWithPoints = alternatives.map(alt => {
      const scoreDiff = alt.ecoScore - product.ecoScore;
      const basePoints = Math.max(10, scoreDiff);
      return {
        ...alt.toObject(),
        potentialPoints: basePoints,
        scoreDifference: scoreDiff
      };
    });

    res.json({
      success: true,
      originalProduct: {
        id: product._id,
        name: product.name,
        ecoScore: product.ecoScore,
        category: product.category
      },
      alternatives: alternativesWithPoints
    });
  } catch (error) {
    console.error('Error fetching alternatives:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alternatives' });
  }
});

/**
 * POST /api/products/analyze
 * Analyze a product (placeholder for Gemini integration)
 */
router.post('/analyze', async (req, res) => {
  try {
    const { imageUrl, productUrl, name } = req.body;

    // TODO: Integrate with Gemini for image analysis
    // For now, return a mock analysis

    // Try to find existing product by name
    let product = null;
    if (name) {
      product = await Product.findOne({
        $text: { $search: name }
      }).populate('sponsorId', 'name logoUrl');
    }

    if (product) {
      // Found existing product
      const alternatives = await Product.find({
        category: product.category,
        isPartnerProduct: true,
        ecoScore: { $gt: product.ecoScore }
      })
        .populate('sponsorId', 'name logoUrl')
        .sort({ ecoScore: -1 })
        .limit(3);

      return res.json({
        success: true,
        found: true,
        product,
        alternatives
      });
    }

    // Product not in database - return placeholder
    res.json({
      success: true,
      found: false,
      message: 'Product not in database. Gemini analysis would go here.',
      mockAnalysis: {
        estimatedEcoScore: 45,
        category: 'other',
        suggestions: [
          'Consider checking for sustainable certifications',
          'Look for products with recyclable packaging'
        ]
      }
    });
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze product' });
  }
});

export default router;
