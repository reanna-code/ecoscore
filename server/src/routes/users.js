import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/users/register
 * Create or update user after Firebase auth
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { username, displayName } = req.body;
    const { uid, email } = req.user;

    // TEMPORARY: If MongoDB is not connected, return mock response for UI testing
    if (!User.db || User.db.readyState !== 1) {
      console.warn('⚠️  MongoDB not connected - returning mock user for UI testing');
      const mockUser = {
        id: uid,
        firebaseUid: uid,
        email,
        username: username?.toLowerCase() || 'testuser',
        displayName: displayName || username || 'Test User',
        friendCode: `ECO-${uid.substring(0, 6).toUpperCase()}-2024`,
        ecoScore: 75,
        pointsBalance: 500,
        totalPointsEarned: 1200,
        streakCount: 5,
        scansThisMonth: 12,
        swapsThisMonth: 8,
        badges: [
          { badgeId: 'eco_warrior', name: 'Eco Warrior', category: 'general', earnedAt: new Date().toISOString() }
        ],
        friends: [],
        isPublicProfile: true
      };
      return res.status(201).json({ user: mockUser, isNew: true });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: uid });
    
    if (user) {
      // User exists, return existing user with full profile
      return res.json({ user: user.toOwnProfile(), isNew: false });
    }

    // Validate username
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Check username availability
    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create new user
    user = new User({
      firebaseUid: uid,
      email,
      username: username.toLowerCase(),
      displayName: displayName || username,
    });

    await user.save();
    
    // Return full profile for the user's own data
    res.status(201).json({ user: user.toOwnProfile(), isNew: true });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * GET /api/users/me
 * Get current user's profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // TEMPORARY: If MongoDB is not connected, return mock response for UI testing
    if (!User.db || User.db.readyState !== 1) {
      console.warn('⚠️  MongoDB not connected - returning mock user for UI testing');
      const mockUser = {
        id: req.user.uid,
        firebaseUid: req.user.uid,
        email: req.user.email,
        username: 'testuser',
        displayName: 'Test User',
        friendCode: `ECO-${req.user.uid.substring(0, 6).toUpperCase()}-2024`,
        ecoScore: 75,
        pointsBalance: 500,
        totalPointsEarned: 1200,
        streakCount: 5,
        scansThisMonth: 12,
        swapsThisMonth: 8,
        badges: [
          { badgeId: 'eco_warrior', name: 'Eco Warrior', category: 'general', earnedAt: new Date().toISOString() }
        ],
        friends: [],
        scanHistory: [
          { productName: 'Plastic Bottles', brand: 'Generic', ecoScore: 35, scannedAt: new Date().toISOString(), swappedTo: { productName: 'Reusable Bottle', brand: 'EcoFlow', ecoScore: 85 } },
          { productName: 'Paper Towels', brand: 'Bounty', ecoScore: 40, scannedAt: new Date().toISOString(), swappedTo: { productName: 'Bamboo Towels', brand: 'Grove', ecoScore: 78 } }
        ],
        isPublicProfile: true
      };
      return res.json({ user: mockUser });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid })
      .populate('friends', 'username displayName avatarUrl ecoScore pointsBalance badges');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user's own profile with all private data
    const ownProfile = user.toOwnProfile();
    // Include populated friends data
    ownProfile.friends = user.friends;
    
    res.json({ user: ownProfile });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * PATCH /api/users/me
 * Update current user's profile
 */
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['displayName', 'avatarUrl', 'isPublicProfile', 'notificationsEnabled'];
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toPublicProfile() });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * GET /api/users/search?q=username
 * Search for users by username
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      firebaseUid: { $ne: req.user.uid }, // Exclude current user
      isPublicProfile: true
    })
    .select('username displayName avatarUrl ecoScore pointsBalance badges')
    .limit(10);

    res.json({ users: users.map(u => u.toPublicProfile()) });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/users/:id
 * Get a user's public profile
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user || !user.isPublicProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toPublicProfile() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * POST /api/users/add-points
 * Add eco points to user (called after product swap)
 */
router.post('/add-points', authenticateToken, async (req, res) => {
  try {
    const { points, reason } = req.body;
    
    if (!points || points < 0) {
      return res.status(400).json({ error: 'Invalid points value' });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      {
        $inc: {
          pointsBalance: points,
          totalPointsEarned: points,
          swapsThisMonth: reason === 'swap' ? 1 : 0
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      pointsBalance: user.pointsBalance,
      totalPointsEarned: user.totalPointsEarned,
      pointsAdded: points
    });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ error: 'Failed to add points' });
  }
});

/**
 * POST /api/users/add-scan
 * Record a product scan
 */
router.post('/add-scan', authenticateToken, async (req, res) => {
  try {
    const { productName, brand, category, ecoScore } = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      {
        $push: {
          scanHistory: {
            $each: [{ productName, brand, category, ecoScore }],
            $slice: -100 // Keep only last 100 scans
          }
        },
        $inc: { scansThisMonth: 1 }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      scansThisMonth: user.scansThisMonth,
      totalScans: user.scanHistory.length
    });
  } catch (error) {
    console.error('Add scan error:', error);
    res.status(500).json({ error: 'Failed to record scan' });
  }
});

/**
 * POST /api/users/add-badge
 * Award a badge to user
 */
router.post('/add-badge', authenticateToken, async (req, res) => {
  try {
    const { badgeId, name, description, icon, category } = req.body;

    // Check if user already has this badge
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasBadge = user.badges.some(b => b.badgeId === badgeId);
    if (hasBadge) {
      return res.status(400).json({ error: 'Badge already earned' });
    }

    user.badges.push({ badgeId, name, description, icon, category });
    await user.save();

    res.json({ badges: user.badges });
  } catch (error) {
    console.error('Add badge error:', error);
    res.status(500).json({ error: 'Failed to add badge' });
  }
});

export default router;
