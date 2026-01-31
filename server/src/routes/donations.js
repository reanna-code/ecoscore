import express from 'express';
import BatchReceipt from '../models/BatchReceipt.js';
import Ngo from '../models/Ngo.js';

const router = express.Router();

/**
 * GET /api/donations
 * Get public donation history (batch receipts)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const receipts = await BatchReceipt.find()
      .sort({ processedAt: -1 })
      .limit(parseInt(limit))
      .select('-__v');

    res.json({
      success: true,
      count: receipts.length,
      donations: receipts.map(r => ({
        weekNumber: r.weekNumber,
        txSignature: r.txSignature,
        totalUsd: r.totalUsd,
        totalPointsRedeemed: r.totalPointsRedeemed,
        ngoCount: r.allocations.length,
        processedAt: r.processedAt,
        explorerUrl: `https://explorer.solana.com/tx/${r.txSignature}?cluster=${r.cluster}`,
        allocations: r.allocations
      }))
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch donations' });
  }
});

/**
 * GET /api/donations/stats
 * Get overall donation statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Aggregate total donations
    const stats = await BatchReceipt.aggregate([
      {
        $group: {
          _id: null,
          totalDonations: { $sum: '$totalUsd' },
          totalPointsRedeemed: { $sum: '$totalPointsRedeemed' },
          batchCount: { $sum: 1 }
        }
      }
    ]);

    // Get per-NGO totals
    const ngoStats = await Ngo.find({ isActive: true })
      .select('name logoUrl totalReceivedUsd donationCount')
      .sort({ totalReceivedUsd: -1 });

    const result = stats[0] || { totalDonations: 0, totalPointsRedeemed: 0, batchCount: 0 };

    res.json({
      success: true,
      stats: {
        totalDonationsUsd: result.totalDonations || 0,
        totalPointsRedeemed: result.totalPointsRedeemed || 0,
        batchCount: result.batchCount || 0,
        ngoCount: ngoStats.length
      },
      byNgo: ngoStats
    });
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/donations/:txSignature
 * Get single donation batch by transaction signature
 */
router.get('/tx/:txSignature', async (req, res) => {
  try {
    const receipt = await BatchReceipt.findOne({
      txSignature: req.params.txSignature
    });

    if (!receipt) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({
      success: true,
      donation: {
        weekNumber: receipt.weekNumber,
        txSignature: receipt.txSignature,
        totalUsd: receipt.totalUsd,
        totalLamports: receipt.totalLamports,
        totalPointsRedeemed: receipt.totalPointsRedeemed,
        processedAt: receipt.processedAt,
        cluster: receipt.cluster,
        explorerUrl: `https://explorer.solana.com/tx/${receipt.txSignature}?cluster=${receipt.cluster}`,
        allocations: receipt.allocations
      }
    });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch donation' });
  }
});

export default router;
