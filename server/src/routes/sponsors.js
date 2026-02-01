import express from 'express';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Sponsor from '../models/Sponsor.js';
import Product from '../models/Product.js';
import { getSolanaClient } from '../services/solanaClient.js';

const router = express.Router();

/**
 * GET /api/sponsors
 * List all verified sponsors with their contribution stats
 */
router.get('/', async (req, res) => {
  try {
    const sponsors = await Sponsor.find({ isVerified: true })
      .select('-__v')
      .sort({ totalDeposited: -1 });

    res.json({
      success: true,
      count: sponsors.length,
      sponsors
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sponsors' });
  }
});

/**
 * GET /api/sponsors/:id
 * Get single sponsor with their products
 */
router.get('/:id', async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id).select('-__v');

    if (!sponsor) {
      return res.status(404).json({ success: false, error: 'Sponsor not found' });
    }

    // Get products from this sponsor
    const products = await Product.find({ sponsorId: sponsor._id })
      .select('name category ecoScore imageUrl productUrl')
      .sort({ ecoScore: -1 });

    res.json({
      success: true,
      sponsor,
      products
    });
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sponsor' });
  }
});

/**
 * POST /api/sponsors/dev-fund
 * DEV ONLY: Fund all sponsor wallets with small SOL amounts
 * This makes them visible on Explorer
 */
router.post('/dev-fund', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Not available in production' });
  }

  try {
    const client = await getSolanaClient();
    const sponsors = await Sponsor.find({ isVerified: true });

    if (sponsors.length === 0) {
      return res.json({ success: true, message: 'No sponsors to fund', funded: [] });
    }

    const fundAmount = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL each
    const results = [];

    for (const sponsor of sponsors) {
      try {
        const destPubkey = new PublicKey(sponsor.walletAddress);

        // Create transfer instruction
        const transferIx = SystemProgram.transfer({
          fromPubkey: client.wallet.publicKey,
          toPubkey: destPubkey,
          lamports: fundAmount
        });

        // Create and send transaction
        const tx = new Transaction().add(transferIx);
        tx.recentBlockhash = (await client.connection.getLatestBlockhash()).blockhash;
        tx.feePayer = client.wallet.publicKey;
        tx.sign(client.wallet);

        const signature = await client.connection.sendRawTransaction(tx.serialize());
        await client.connection.confirmTransaction(signature, 'confirmed');

        results.push({
          name: sponsor.name,
          wallet: sponsor.walletAddress,
          signature,
          explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
          success: true
        });

        console.log(`✅ Funded ${sponsor.name}: ${signature}`);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        results.push({
          name: sponsor.name,
          wallet: sponsor.walletAddress,
          error: error.message,
          success: false
        });
        console.error(`❌ Failed to fund ${sponsor.name}:`, error.message);
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({
      success: true,
      message: `Funded ${successCount}/${sponsors.length} sponsor wallets`,
      funded: results
    });
  } catch (error) {
    console.error('Dev fund error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
