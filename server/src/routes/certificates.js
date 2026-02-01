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

/**
 * POST /api/certificates/mint
 * Mint an impact certificate NFT for the user
 */
router.post('/mint', authenticateToken, async (req, res) => {
  try {
    const { donationAmount, ngoName, txSignature } = req.body;

    // Get user
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Validate donation amount
    if (!donationAmount || donationAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid donation amount' });
    }

    // Create custodial wallet if user doesn't have one
    if (!user.solanaWallet?.publicKey) {
      console.log(`Creating custodial wallet for user ${user.username}...`);
      user.solanaWallet = generateUserWallet();
      await user.save();
      console.log(`Wallet created: ${user.solanaWallet.publicKey}`);
    }

    // Calculate CO2 offset
    const co2Offset = parseFloat((donationAmount * CO2_PER_DOLLAR).toFixed(1));

    // Mint the NFT
    const result = await mintImpactCertificate({
      recipientPublicKey: user.solanaWallet.publicKey,
      userName: user.displayName || user.username,
      donationAmount,
      co2Offset,
      ngoName,
      txSignature,
      date: new Date()
    });

    // Save NFT info to user
    user.nftCertificates.push({
      mintAddress: result.mintAddress,
      metadataUri: result.metadataUri,
      imageUri: result.imageUri,
      donationAmount,
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
        txSignature: result.txSignature
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
      donationAmount: cert.donationAmount,
      co2Offset: cert.co2Offset,
      ngoName: cert.ngoName,
      mintedAt: cert.mintedAt,
      explorerUrl: `https://explorer.solana.com/address/${cert.mintAddress}?cluster=${cluster}`
    }));

    res.json({
      success: true,
      wallet: user.solanaWallet?.publicKey || null,
      certificates
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
