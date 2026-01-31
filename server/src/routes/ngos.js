import express from 'express';
import Ngo from '../models/Ngo.js';
import BatchReceipt from '../models/BatchReceipt.js';

const router = express.Router();

/**
 * GET /api/ngos
 * List all active NGOs with their donation stats
 */
router.get('/', async (req, res) => {
  try {
    const ngos = await Ngo.find({ isActive: true })
      .select('-__v')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: ngos.length,
      ngos
    });
  } catch (error) {
    console.error('Error fetching NGOs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch NGOs' });
  }
});

/**
 * GET /api/ngos/:id
 * Get single NGO with detailed stats
 */
router.get('/:id', async (req, res) => {
  try {
    const ngo = await Ngo.findById(req.params.id).select('-__v');

    if (!ngo) {
      return res.status(404).json({ success: false, error: 'NGO not found' });
    }

    // Get recent donations to this NGO from batch receipts
    const recentDonations = await BatchReceipt.find({
      'allocations.ngoId': ngo._id
    })
      .sort({ processedAt: -1 })
      .limit(10)
      .select('weekNumber txSignature allocations processedAt cluster');

    res.json({
      success: true,
      ngo,
      recentDonations: recentDonations.map(r => ({
        weekNumber: r.weekNumber,
        txSignature: r.txSignature,
        amount: r.allocations.find(a => a.ngoId.equals(ngo._id)),
        processedAt: r.processedAt,
        explorerUrl: `https://explorer.solana.com/tx/${r.txSignature}?cluster=${r.cluster}`
      }))
    });
  } catch (error) {
    console.error('Error fetching NGO:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch NGO' });
  }
});

export default router;
