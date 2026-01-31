import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/friends
 * Get current user's friends list
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .populate('friends', 'username displayName avatarUrl ecoScore pointsBalance badges streakCount');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ friends: user.friends.map(f => f.toPublicProfile()) });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

/**
 * GET /api/friends/requests
 * Get pending friend requests
 */
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .populate('friendRequestsReceived', 'username displayName avatarUrl ecoScore')
      .populate('friendRequestsSent', 'username displayName avatarUrl ecoScore');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      received: user.friendRequestsReceived.map(u => u.toPublicProfile()),
      sent: user.friendRequestsSent.map(u => u.toPublicProfile())
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

/**
 * POST /api/friends/request
 * Send a friend request
 */
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { userId, friendCode } = req.body;
    
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find target user by ID or friend code
    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (friendCode) {
      targetUser = await User.findByFriendCode(friendCode);
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Can't friend yourself
    if (targetUser._id.equals(currentUser._id)) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUser._id)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already sent
    if (currentUser.friendRequestsSent.includes(targetUser._id)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Check if they already sent us a request (auto-accept)
    if (currentUser.friendRequestsReceived.includes(targetUser._id)) {
      // Auto-accept: add each other as friends
      currentUser.friends.push(targetUser._id);
      currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
        id => !id.equals(targetUser._id)
      );
      
      targetUser.friends.push(currentUser._id);
      targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
        id => !id.equals(currentUser._id)
      );

      await Promise.all([currentUser.save(), targetUser.save()]);
      
      return res.json({ 
        message: 'Friend request auto-accepted! You are now friends.',
        friend: targetUser.toPublicProfile()
      });
    }

    // Send friend request
    currentUser.friendRequestsSent.push(targetUser._id);
    targetUser.friendRequestsReceived.push(currentUser._id);
    
    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({ message: 'Friend request sent', user: targetUser.toPublicProfile() });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

/**
 * POST /api/friends/accept/:userId
 * Accept a friend request
 */
router.post('/accept/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if there's a pending request
    if (!currentUser.friendRequestsReceived.includes(targetUser._id)) {
      return res.status(400).json({ error: 'No pending friend request from this user' });
    }

    // Accept: add each other as friends
    currentUser.friends.push(targetUser._id);
    currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
      id => !id.equals(targetUser._id)
    );
    
    targetUser.friends.push(currentUser._id);
    targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
      id => !id.equals(currentUser._id)
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({ 
      message: 'Friend request accepted',
      friend: targetUser.toPublicProfile()
    });
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

/**
 * POST /api/friends/reject/:userId
 * Reject a friend request
 */
router.post('/reject/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from pending requests
    currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
      id => !id.equals(targetUser._id)
    );
    targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
      id => !id.equals(currentUser._id)
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

/**
 * DELETE /api/friends/:userId
 * Remove a friend
 */
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from each other's friends list
    currentUser.friends = currentUser.friends.filter(id => !id.equals(targetUser._id));
    targetUser.friends = targetUser.friends.filter(id => !id.equals(currentUser._id));

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

/**
 * GET /api/friends/code/:code
 * Look up user by friend code
 */
router.get('/code/:code', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByFriendCode(req.params.code);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found with this friend code' });
    }

    res.json({ user: user.toPublicProfile() });
  } catch (error) {
    console.error('Lookup by code error:', error);
    res.status(500).json({ error: 'Failed to look up user' });
  }
});

export default router;
