import express from 'express';
import { processWeeklyBatch, getCurrentWeekNumber, aggregatePledges } from '../services/batchProcessor.js';
import { getSolanaClient } from '../services/solanaClient.js';

const router = express.Router();

// Simple admin key check (in production, use proper auth)
const ADMIN_KEY = process.env.ADMIN_KEY || 'ecoscore-admin-2026';

function checkAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ success: false, error: 'Invalid admin key' });
  }
  next();
}

/**
 * GET /api/admin/batch/preview
 * Preview what would be processed in the next batch
 */
router.get('/batch/preview', checkAdminKey, async (req, res) => {
  try {
    const weekNumber = getCurrentWeekNumber();
    const allocations = await aggregatePledges(weekNumber);

    const totalPoints = allocations.reduce((sum, a) => sum + a.totalPoints, 0);

    res.json({
      success: true,
      weekNumber,
      allocations: allocations.map(a => ({
        ngoName: a.ngoName,
        ngoWallet: a.ngoWallet,
        totalPoints: a.totalPoints,
        estimatedSol: a.lamports / 1_000_000_000,
        estimatedUsd: a.totalPoints / 100,
        pledgeCount: a.pledgeIds.length
      })),
      totals: {
        points: totalPoints,
        estimatedUsd: totalPoints / 100,
        ngoCount: allocations.length
      }
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/batch/process
 * Process the weekly batch (demo mode without Solana client)
 */
router.post('/batch/process', checkAdminKey, async (req, res) => {
  try {
    const { weekNumber } = req.body;
    const result = await processWeeklyBatch(weekNumber, null); // null = demo mode

    if (result.success) {
      res.json({
        success: true,
        message: 'Batch processed successfully',
        receipt: {
          id: result.receipt._id,
          weekNumber: result.receipt.weekNumber,
          txSignature: result.receipt.txSignature,
          totalUsd: result.receipt.totalUsd,
          explorerUrl: `https://explorer.solana.com/tx/${result.receipt.txSignature}?cluster=${result.receipt.cluster}`
        }
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Batch process error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/batch/process-solana
 * Process the weekly batch with REAL Solana transactions
 */
router.post('/batch/process-solana', checkAdminKey, async (req, res) => {
  try {
    const { weekNumber, cluster = 'localnet' } = req.body;

    // Initialize Solana client
    const solanaClient = await getSolanaClient(cluster);

    // Process with real Solana
    const result = await processWeeklyBatch(weekNumber, solanaClient);

    if (result.success) {
      res.json({
        success: true,
        message: 'Batch processed on Solana!',
        receipt: {
          id: result.receipt._id,
          weekNumber: result.receipt.weekNumber,
          txSignature: result.receipt.txSignature,
          totalUsd: result.receipt.totalUsd,
          cluster: result.receipt.cluster,
          explorerUrl: `https://explorer.solana.com/tx/${result.receipt.txSignature}?cluster=${result.receipt.cluster}`
        }
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Solana batch process error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/solana/status
 * Get Solana program status
 */
router.get('/solana/status', checkAdminKey, async (req, res) => {
  try {
    const { cluster = 'localnet' } = req.query;
    const solanaClient = await getSolanaClient(cluster);

    const [vaultBalance, stats, ngos, sponsors] = await Promise.all([
      solanaClient.getVaultBalance(),
      solanaClient.getStats(),
      solanaClient.getNgos(),
      solanaClient.getSponsors()
    ]);

    res.json({
      success: true,
      cluster,
      vault: vaultBalance,
      stats,
      ngos: ngos.length,
      sponsors: sponsors.length
    });
  } catch (error) {
    console.error('Solana status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/stats
 * Get system stats
 */
router.get('/stats', checkAdminKey, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Pledge = (await import('../models/Pledge.js')).default;
    const BatchReceipt = (await import('../models/BatchReceipt.js')).default;

    const [userCount, pledgeStats, batchStats] = await Promise.all([
      User.countDocuments(),
      Pledge.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalPoints: { $sum: '$points' }
          }
        }
      ]),
      BatchReceipt.aggregate([
        {
          $group: {
            _id: null,
            totalBatches: { $sum: 1 },
            totalDisbursed: { $sum: '$totalUsd' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        users: userCount,
        pledges: pledgeStats,
        batches: batchStats[0] || { totalBatches: 0, totalDisbursed: 0 }
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
