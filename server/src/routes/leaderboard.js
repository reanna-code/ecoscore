import express from 'express';
import User from '../models/User.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/leaderboard
 * Get global leaderboard (top users by points)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { timeframe = 'alltime', limit = 50 } = req.query;
    
    let sortField = 'totalPointsEarned';
    if (timeframe === 'weekly') {
      // For weekly, we'd need to track weekly points separately
      // For now, use total points
      sortField = 'pointsBalance';
    }

    const users = await User.find({ isPublicProfile: true })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('username displayName avatarUrl ecoScore pointsBalance badges streakCount');

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user.toPublicProfile()
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

/**
 * GET /api/leaderboard/friends
 * Get leaderboard of user's friends only
 */
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const { timeframe = 'alltime' } = req.query;
    
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get friends + current user for comparison
    const userIds = [...currentUser.friends, currentUser._id];
    
    let sortField = 'totalPointsEarned';
    if (timeframe === 'weekly') {
      sortField = 'pointsBalance';
    }

    const users = await User.find({ _id: { $in: userIds } })
      .sort({ [sortField]: -1 })
      .select('username displayName avatarUrl ecoScore pointsBalance badges streakCount');

    // Add rank and mark current user
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      isCurrentUser: user._id.equals(currentUser._id),
      ...user.toPublicProfile()
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Friends leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get friends leaderboard' });
  }
});

/**
 * GET /api/leaderboard/my-rank
 * Get current user's rank on global leaderboard
 */
router.get('/my-rank', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count users with more points
    const usersAbove = await User.countDocuments({
      totalPointsEarned: { $gt: currentUser.totalPointsEarned },
      isPublicProfile: true
    });

    const globalRank = usersAbove + 1;

    // Get friends rank
    const friendsAbove = await User.countDocuments({
      _id: { $in: currentUser.friends },
      totalPointsEarned: { $gt: currentUser.totalPointsEarned }
    });

    const friendsRank = friendsAbove + 1;
    const totalFriends = currentUser.friends.length + 1; // +1 for self

    res.json({
      globalRank,
      friendsRank,
      totalFriends,
      user: currentUser.toPublicProfile()
    });
  } catch (error) {
    console.error('My rank error:', error);
    res.status(500).json({ error: 'Failed to get rank' });
  }
});

/**
 * GET /api/leaderboard/stats
 * Get leaderboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastActiveDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    const topScorer = await User.findOne({ isPublicProfile: true })
      .sort({ totalPointsEarned: -1 })
      .select('username totalPointsEarned');

    const avgEcoScore = await User.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$ecoScore' } } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      topScorer: topScorer ? {
        username: topScorer.username,
        points: topScorer.totalPointsEarned
      } : null,
      averageEcoScore: Math.round(avgEcoScore[0]?.avgScore || 50)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
