import express from 'express';
import Pledge from '../models/Pledge.js';
import Ngo from '../models/Ngo.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Conversion rate: 100 points = $1
const POINTS_PER_DOLLAR = 100;
const MIN_PLEDGE_POINTS = 500; // $5 minimum

/**
 * POST /api/pledges
 * Create a new pledge (requires auth)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { ngoId, points } = req.body;

    // Get MongoDB user from Firebase UID
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const userId = user._id;

    // Validate points
    if (!points || points < MIN_PLEDGE_POINTS) {
      return res.status(400).json({
        success: false,
        error: `Minimum pledge is ${MIN_PLEDGE_POINTS} points ($${MIN_PLEDGE_POINTS / POINTS_PER_DOLLAR})`
      });
    }

    // Check user has enough points
    if (user.pointsBalance < points) {
      return res.status(400).json({
        success: false,
        error: `Insufficient points. You have ${user.pointsBalance}, need ${points}`
      });
    }

    // Verify NGO exists and is active
    const ngo = await Ngo.findById(ngoId);
    if (!ngo || !ngo.isActive) {
      return res.status(400).json({ success: false, error: 'Invalid or inactive NGO' });
    }

    // Get current week number
    const weekNumber = Pledge.getCurrentWeekNumber();

    // Create pledge
    const pledge = await Pledge.create({
      userId,
      ngoId,
      points,
      weekNumber,
      estimatedUsd: points / POINTS_PER_DOLLAR
    });

    // Deduct points from user
    user.pointsBalance -= points;

    // Add to user's donations array
    user.donations.push({
      organizationId: ngo._id.toString(),
      organizationName: ngo.name,
      pointsSpent: points,
      amountDollars: points / POINTS_PER_DOLLAR,
      status: 'pending'
    });

    await user.save();

    res.status(201).json({
      success: true,
      pledge: {
        id: pledge._id,
        ngoName: ngo.name,
        points: pledge.points,
        estimatedUsd: pledge.estimatedUsd,
        weekNumber: pledge.weekNumber,
        status: pledge.status
      },
      newBalance: user.pointsBalance
    });
  } catch (error) {
    console.error('Error creating pledge:', error);
    res.status(500).json({ success: false, error: 'Failed to create pledge' });
  }
});

/**
 * GET /api/pledges
 * Get current user's pledges (requires auth)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const userId = user._id;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const pledges = await Pledge.find(query)
      .populate('ngoId', 'name logoUrl walletAddress')
      .populate('batchReceiptId', 'txSignature cluster')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pledges.length,
      pledges: pledges.map(p => ({
        id: p._id,
        ngo: p.ngoId,
        points: p.points,
        estimatedUsd: p.estimatedUsd,
        weekNumber: p.weekNumber,
        status: p.status,
        createdAt: p.createdAt,
        txSignature: p.batchReceiptId?.txSignature,
        explorerUrl: p.batchReceiptId
          ? `https://explorer.solana.com/tx/${p.batchReceiptId.txSignature}?cluster=${p.batchReceiptId.cluster}`
          : null
      }))
    });
  } catch (error) {
    console.error('Error fetching pledges:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pledges' });
  }
});

/**
 * GET /api/pledges/stats
 * Get GLOBAL pledge stats for current week (all users combined)
 */
router.get('/stats', async (req, res) => {
  try {
    const weekNumber = Pledge.getCurrentWeekNumber();

    // Get this week's pledges aggregated by NGO (ALL users)
    const weeklyStats = await Pledge.aggregate([
      { $match: { weekNumber, status: 'pending' } },
      {
        $group: {
          _id: '$ngoId',
          totalPoints: { $sum: '$points' },
          pledgeCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    // Get total unique contributors this week
    const allContributors = await Pledge.distinct('userId', { weekNumber, status: 'pending' });

    // Get NGO details
    const ngoIds = weeklyStats.map(s => s._id);
    const ngos = await Ngo.find({ _id: { $in: ngoIds } }).select('name logoUrl');
    const ngoMap = {};
    ngos.forEach(n => { ngoMap[n._id.toString()] = n; });

    const statsWithNames = weeklyStats.map(s => ({
      ngo: ngoMap[s._id.toString()],
      totalPoints: s.totalPoints,
      estimatedUsd: s.totalPoints / POINTS_PER_DOLLAR,
      pledgeCount: s.pledgeCount,
      contributorCount: s.uniqueUsers.length
    }));

    const totalPoints = weeklyStats.reduce((sum, s) => sum + s.totalPoints, 0);
    const totalPledges = weeklyStats.reduce((sum, s) => sum + s.pledgeCount, 0);

    res.json({
      success: true,
      weekNumber,
      totalPoints,
      totalEstimatedUsd: totalPoints / POINTS_PER_DOLLAR,
      totalPledges,
      totalContributors: allContributors.length,
      byNgo: statsWithNames
    });
  } catch (error) {
    console.error('Error fetching pledge stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
