import express from 'express';
import Sponsor from '../models/Sponsor.js';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * GET /api/sponsors
 * List all verified sponsors with their contribution stats
 */
router.get('/', async (req, res) => {
  try {
    const sponsors = await Sponsor.find({ isVerified: true })
      .select('-__v')
      .sort({ totalDeposited: -1 });

    res.json({
      success: true,
      count: sponsors.length,
      sponsors
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sponsors' });
  }
});

/**
 * GET /api/sponsors/:id
 * Get single sponsor with their products
 */
router.get('/:id', async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id).select('-__v');

    if (!sponsor) {
      return res.status(404).json({ success: false, error: 'Sponsor not found' });
    }

    // Get products from this sponsor
    const products = await Product.find({ sponsorId: sponsor._id })
      .select('name category ecoScore imageUrl productUrl')
      .sort({ ecoScore: -1 });

    res.json({
      success: true,
      sponsor,
      products
    });
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sponsor' });
  }
});

export default router;
