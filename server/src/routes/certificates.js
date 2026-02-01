/**
 * Certificates API Routes
 * Handle NFT impact certificate minting and retrieval
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { generateUserWallet, mintImpactCertificate, getNftsByOwner } from '../services/nftService.js';

const router = express.Router();

// CO2 offset rate: $1 = 0.1 kg CO2
const CO2_PER_DOLLAR = 0.1;

// Available milestone tiers
const MILESTONES = [5, 25, 50, 100];

/**
 * GET /api/certificates/milestones
 * Get available milestones for the user based on their total donations
 */
router.get('/milestones', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get total donated from pledges
    const Pledge = (await import('../models/Pledge.js')).default;
    const pledges = await Pledge.find({ userId: user._id });
    const totalDonated = pledges.reduce((sum, p) => sum + (p.estimatedUsd || 0), 0);

    // Get already minted milestones
    const mintedMilestones = (user.nftCertificates || []).map(c => c.milestone).filter(Boolean);

    // Calculate which milestones are available
    const milestones = MILESTONES.map((amount, index) => {
      const unlocked = totalDonated >= amount;
      const minted = mintedMilestones.includes(amount);
      // Can only mint if all previous milestones are minted
      const previousMilestones = MILESTONES.slice(0, index);
      const allPreviousMinted = previousMilestones.every(m => mintedMilestones.includes(m));
      const canMint = unlocked && !minted && allPreviousMinted;

      return {
        amount,
        unlocked,
        minted,
        available: unlocked && !minted,
        canMint
      };
    });

    res.json({
      success: true,
      totalDonated,
      milestones
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch milestones' });
  }
});

/**
 * POST /api/certificates/mint
 * Mint an impact certificate NFT for a specific milestone
 */
router.post('/mint', authenticateToken, async (req, res) => {
  try {
    const { milestone, ngoName, txSignature } = req.body;

    // Validate milestone
    if (!milestone || !MILESTONES.includes(milestone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid milestone. Must be one of: ${MILESTONES.join(', ')}`
      });
    }

    // Get user
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if user already minted this milestone
    const mintedMilestones = (user.nftCertificates || []).map(c => c.milestone).filter(Boolean);
    if (mintedMilestones.includes(milestone)) {
      return res.status(400).json({
        success: false,
        error: `You already minted the $${milestone} milestone badge`
      });
    }

    // Enforce sequential minting - must mint lower badges first
    const milestoneIndex = MILESTONES.indexOf(milestone);
    const requiredPreviousMilestones = MILESTONES.slice(0, milestoneIndex);
    const missingMilestones = requiredPreviousMilestones.filter(m => !mintedMilestones.includes(m));

    if (missingMilestones.length > 0) {
      return res.status(400).json({
        success: false,
        error: `You must mint the $${missingMilestones[0]} badge first`
      });
    }

    // Get total donated to verify eligibility
    const Pledge = (await import('../models/Pledge.js')).default;
    const pledges = await Pledge.find({ userId: user._id });
    const totalDonated = pledges.reduce((sum, p) => sum + (p.estimatedUsd || 0), 0);

    if (totalDonated < milestone) {
      return res.status(400).json({
        success: false,
        error: `You need $${milestone} in donations to mint this badge. Current: $${totalDonated.toFixed(2)}`
      });
    }

    // Create custodial wallet if user doesn't have one
    if (!user.solanaWallet?.publicKey) {
      console.log(`Creating custodial wallet for user ${user.username}...`);
      user.solanaWallet = generateUserWallet();
      await user.save();
      console.log(`Wallet created: ${user.solanaWallet.publicKey}`);
    }

    // Calculate CO2 offset for this milestone
    const co2Offset = parseFloat((milestone * CO2_PER_DOLLAR).toFixed(1));

    // Mint the NFT
    const result = await mintImpactCertificate({
      recipientPublicKey: user.solanaWallet.publicKey,
      userName: user.displayName || user.username,
      donationAmount: milestone,
      co2Offset,
      ngoName,
      txSignature,
      milestone,
      date: new Date()
    });

    // Save NFT info to user
    user.nftCertificates.push({
      mintAddress: result.mintAddress,
      metadataUri: result.metadataUri,
      imageUri: result.imageUri,
      milestone,
      donationAmountAtMint: totalDonated,
      co2Offset,
      ngoName,
      txSignature: result.txSignature,
      mintedAt: new Date()
    });
    await user.save();

    res.json({
      success: true,
      certificate: {
        mintAddress: result.mintAddress,
        imageUrl: result.imageUri,
        explorerUrl: result.explorerUrl,
        txSignature: result.txSignature,
        milestone
      },
      wallet: {
        publicKey: user.solanaWallet.publicKey
      }
    });
  } catch (error) {
    console.error('Minting error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mint certificate'
    });
  }
});

/**
 * GET /api/certificates
 * Get user's minted certificates
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const cluster = process.env.SOLANA_CLUSTER || 'devnet';

    const certificates = (user.nftCertificates || []).map(cert => ({
      mintAddress: cert.mintAddress,
      imageUrl: cert.imageUri,
      milestone: cert.milestone,
      donationAmountAtMint: cert.donationAmountAtMint,
      co2Offset: cert.co2Offset,
      ngoName: cert.ngoName,
      mintedAt: cert.mintedAt,
      explorerUrl: `https://explorer.solana.com/address/${cert.mintAddress}?cluster=${cluster}`
    }));

    res.json({
      success: true,
      wallet: user.solanaWallet?.publicKey || null,
      certificates,
      availableMilestones: MILESTONES
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
  }
});

/**
 * GET /api/certificates/wallet
 * Get or create user's custodial wallet
 */
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Create wallet if doesn't exist
    if (!user.solanaWallet?.publicKey) {
      user.solanaWallet = generateUserWallet();
      await user.save();
    }

    res.json({
      success: true,
      wallet: {
        publicKey: user.solanaWallet.publicKey,
        createdAt: user.solanaWallet.createdAt
      }
    });
  } catch (error) {
    console.error('Wallet error:', error);
    res.status(500).json({ success: false, error: 'Failed to get wallet' });
  }
});

/**
 * DELETE /api/certificates/dev-clear
 * DEV ONLY: Clear current user's NFT certificates for testing
 */
router.delete('/dev-clear', authenticateToken, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Not allowed in production' });
  }

  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const count = user.nftCertificates?.length || 0;
    user.nftCertificates = [];
    await user.save();

    res.json({
      success: true,
      message: `Cleared ${count} certificates`,
      cleared: count
    });
  } catch (error) {
    console.error('Clear certificates error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear certificates' });
  }
});

export default router;
