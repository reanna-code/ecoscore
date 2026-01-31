import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Calculate eco points based on action
 * Formula: Points = B × D × L × S
 */
function calculatePoints({
  productEcoScore,
  categoryBaseline = 45,
  actionType = 'capture_only',
  isLocal = false,
  isRefill = false,
  weeklyStreak = 0
}) {
  // Base points
  const scoreDiff = productEcoScore - categoryBaseline;
  const B = Math.max(10, scoreDiff);

  // Decision multiplier
  const decisionMultipliers = {
    'capture_only': 0.5,
    'kept_same': 0.8,
    'slight_better': 1.0,
    'much_better': 1.3,
    'excellent': 1.5
  };
  const D = decisionMultipliers[actionType] || 0.5;

  // Local multiplier
  let L = 1.0;
  if (isRefill) L = 1.5;
  else if (isLocal) L = 1.25;

  // Streak multiplier (caps at 1.5)
  const S = 1 + Math.min(0.5, 0.1 * weeklyStreak);

  return Math.round(B * D * L * S);
}

/**
 * POST /api/points/capture
 * Award points for capturing a product
 */
router.post('/capture', authenticateToken, async (req, res) => {
  try {
    const { productId, actionType, selectedAlternativeId } = req.body;

    // Get user
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Calculate weekly streak
    const now = new Date();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    let streakCount = user.streakCount || 0;

    if (lastActive) {
      const daysSinceActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
      if (daysSinceActive > 7) {
        streakCount = 0;
      } else if (daysSinceActive >= 1) {
        streakCount = Math.min(5, streakCount + 1);
      }
    }

    // Determine action type based on selection
    let finalActionType = actionType || 'capture_only';
    let alternativeProduct = null;

    if (selectedAlternativeId) {
      alternativeProduct = await Product.findById(selectedAlternativeId);
      if (alternativeProduct) {
        const scoreDiff = alternativeProduct.ecoScore - product.ecoScore;
        if (scoreDiff >= 40) finalActionType = 'excellent';
        else if (scoreDiff >= 25) finalActionType = 'much_better';
        else if (scoreDiff >= 10) finalActionType = 'slight_better';
        else finalActionType = 'kept_same';
      }
    }

    // Calculate points
    const pointsEarned = calculatePoints({
      productEcoScore: alternativeProduct?.ecoScore || product.ecoScore,
      categoryBaseline: 45,
      actionType: finalActionType,
      isLocal: product.isLocal || alternativeProduct?.isLocal,
      isRefill: false,
      weeklyStreak: streakCount
    });

    // First capture of the day bonus
    const today = new Date().toDateString();
    const lastActiveDay = lastActive?.toDateString();
    const firstOfDay = today !== lastActiveDay;
    const bonusPoints = firstOfDay ? 5 : 0;

    const totalPoints = pointsEarned + bonusPoints;

    // Update user
    user.pointsBalance += totalPoints;
    user.totalPointsEarned += totalPoints;
    user.streakCount = streakCount;
    user.lastActiveDate = now;
    user.scansThisMonth = (user.scansThisMonth || 0) + 1;

    if (selectedAlternativeId && alternativeProduct) {
      user.swapsThisMonth = (user.swapsThisMonth || 0) + 1;
    }

    // Add to scan history
    user.scanHistory.push({
      productName: product.name,
      brand: product.brand,
      category: product.category,
      ecoScore: product.ecoScore,
      scannedAt: now
    });

    if (user.scanHistory.length > 50) {
      user.scanHistory = user.scanHistory.slice(-50);
    }

    await user.save();

    res.json({
      success: true,
      points: {
        base: pointsEarned,
        bonus: bonusPoints,
        total: totalPoints,
        reason: firstOfDay ? 'First capture of the day!' : null
      },
      newBalance: user.pointsBalance,
      streak: streakCount,
      actionType: finalActionType
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ success: false, error: 'Failed to award points' });
  }
});

/**
 * POST /api/points/select-alternative
 * Award points when user selects a sustainable alternative
 */
router.post('/select-alternative', authenticateToken, async (req, res) => {
  try {
    const { originalProductId, alternativeProductId } = req.body;

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const [original, alternative] = await Promise.all([
      Product.findById(originalProductId),
      Product.findById(alternativeProductId)
    ]);

    if (!original || !alternative) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const scoreDiff = alternative.ecoScore - original.ecoScore;

    let actionType = 'kept_same';
    if (scoreDiff >= 40) actionType = 'excellent';
    else if (scoreDiff >= 25) actionType = 'much_better';
    else if (scoreDiff >= 10) actionType = 'slight_better';

    const streakCount = user.streakCount || 0;

    const pointsEarned = calculatePoints({
      productEcoScore: alternative.ecoScore,
      categoryBaseline: original.ecoScore,
      actionType,
      isLocal: alternative.isLocal,
      isRefill: false,
      weeklyStreak: streakCount
    });

    user.pointsBalance += pointsEarned;
    user.totalPointsEarned += pointsEarned;
    user.swapsThisMonth = (user.swapsThisMonth || 0) + 1;
    user.lastActiveDate = new Date();

    await user.save();

    res.json({
      success: true,
      points: {
        earned: pointsEarned,
        scoreDifference: scoreDiff,
        actionType
      },
      newBalance: user.pointsBalance,
      alternative: {
        name: alternative.name,
        brand: alternative.brand,
        ecoScore: alternative.ecoScore
      }
    });
  } catch (error) {
    console.error('Error selecting alternative:', error);
    res.status(500).json({ success: false, error: 'Failed to process selection' });
  }
});

/**
 * GET /api/points/balance
 * Get current user's point balance
 */
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .select('pointsBalance totalPointsEarned streakCount');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      balance: user.pointsBalance,
      totalEarned: user.totalPointsEarned,
      streak: user.streakCount,
      dollarValue: user.pointsBalance / 100
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch balance' });
  }
});

/**
 * POST /api/points/dev-grant
 * DEV ONLY: Grant test points to a user
 */
router.post('/dev-grant', authenticateToken, async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Not allowed in production' });
  }

  try {
    const { amount = 1000 } = req.body;

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.pointsBalance += amount;
    user.totalPointsEarned += amount;
    await user.save();

    res.json({
      success: true,
      granted: amount,
      newBalance: user.pointsBalance,
      message: `Granted ${amount} test points`
    });
  } catch (error) {
    console.error('Error granting points:', error);
    res.status(500).json({ success: false, error: 'Failed to grant points' });
  }
});

export default router;
