/**
 * Batch Processor Service
 * Processes weekly pledges and sends to Solana program
 */

import Pledge from '../models/Pledge.js';
import Ngo from '../models/Ngo.js';
import BatchReceipt from '../models/BatchReceipt.js';
import User from '../models/User.js';

// Conversion constants (must match Solana program)
const LAMPORTS_PER_SOL = 1_000_000_000;
const LAMPORTS_PER_1000_POINTS = 100_000_000; // 0.1 SOL per 1000 points
const POINTS_PER_DOLLAR = 100;

/**
 * Get current week number in YYYYWW format
 */
export function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  const weekNum = Math.ceil(diff / oneWeek);
  return parseInt(`${now.getFullYear()}${weekNum.toString().padStart(2, '0')}`);
}

/**
 * Convert points to lamports
 */
export function pointsToLamports(points) {
  return Math.floor((points * LAMPORTS_PER_1000_POINTS) / 1000);
}

/**
 * Aggregate pending pledges for a week
 */
export async function aggregatePledges(weekNumber) {
  const pledges = await Pledge.aggregate([
    { $match: { weekNumber, status: 'pending' } },
    {
      $group: {
        _id: '$ngoId',
        totalPoints: { $sum: '$points' },
        pledgeIds: { $push: '$_id' }
      }
    }
  ]);

  // Get NGO details with wallet addresses
  const ngoIds = pledges.map(p => p._id);
  const ngos = await Ngo.find({ _id: { $in: ngoIds }, isActive: true });
  const ngoMap = {};
  ngos.forEach(n => { ngoMap[n._id.toString()] = n; });

  return pledges
    .filter(p => ngoMap[p._id.toString()]) // Only active NGOs
    .map(p => {
      const ngo = ngoMap[p._id.toString()];
      return {
        ngoId: ngo._id,
        ngoName: ngo.name,
        ngoWallet: ngo.walletAddress,
        totalPoints: p.totalPoints,
        lamports: pointsToLamports(p.totalPoints),
        pledgeIds: p.pledgeIds
      };
    });
}

/**
 * Process the weekly batch
 * This is called by the cron job or manually
 */
export async function processWeeklyBatch(weekNumber = null, solanaClient = null) {
  const week = weekNumber || getCurrentWeekNumber();

  console.log(`\n=== Processing batch for week ${week} ===`);

  // Check if already processed (skip in dev for easier testing)
  const existing = await BatchReceipt.findOne({ weekNumber: week });
  if (existing && process.env.NODE_ENV === 'production') {
    console.log(`Week ${week} already processed. TX: ${existing.txSignature}`);
    return { success: false, error: 'Already processed', receipt: existing };
  }

  // In dev, use unique ID to allow multiple test runs
  const effectiveWeek = process.env.NODE_ENV === 'production' ? week : Date.now();

  // Aggregate pledges
  const allocations = await aggregatePledges(week);

  if (allocations.length === 0) {
    console.log('No pending pledges for this week');
    return { success: false, error: 'No pledges to process' };
  }

  console.log(`Found ${allocations.length} NGOs with pledges:`);
  allocations.forEach(a => {
    console.log(`  - ${a.ngoName}: ${a.totalPoints} points (${a.lamports / LAMPORTS_PER_SOL} SOL)`);
  });

  // Calculate totals
  const totalPoints = allocations.reduce((sum, a) => sum + a.totalPoints, 0);
  const totalLamports = allocations.reduce((sum, a) => sum + a.lamports, 0);
  const totalUsd = totalPoints / POINTS_PER_DOLLAR;

  console.log(`Total: ${totalPoints} points = ${totalLamports / LAMPORTS_PER_SOL} SOL (~$${totalUsd})`);

  let txSignature;
  let cluster = 'devnet';

  if (solanaClient) {
    // Call Solana program
    console.log('Calling Solana program...');
    try {
      const result = await solanaClient.batchDisburse(effectiveWeek, allocations);
      txSignature = result.signature;
      cluster = solanaClient.cluster || 'devnet';
      console.log(`Solana TX: ${txSignature}`);
    } catch (error) {
      console.error('Solana error:', error);

      // Mark pledges as failed
      const allPledgeIds = allocations.flatMap(a => a.pledgeIds);
      await Pledge.updateMany(
        { _id: { $in: allPledgeIds } },
        { status: 'failed' }
      );

      return { success: false, error: error.message || 'Solana transaction failed' };
    }
  } else {
    // Demo mode - generate mock signature
    txSignature = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    cluster = 'localnet';
    console.log(`Demo mode - mock TX: ${txSignature}`);
  }

  // Create batch receipt
  const receipt = await BatchReceipt.create({
    weekNumber: effectiveWeek,
    txSignature,
    totalPointsRedeemed: totalPoints,
    totalLamports,
    totalUsd,
    cluster,
    allocations: allocations.map(a => ({
      ngoId: a.ngoId,
      ngoName: a.ngoName,
      ngoWallet: a.ngoWallet,
      pointsAllocated: a.totalPoints,
      lamportsAllocated: a.lamports,
      usdAllocated: a.totalPoints / POINTS_PER_DOLLAR
    }))
  });

  // Update pledge statuses
  const allPledgeIds = allocations.flatMap(a => a.pledgeIds);
  await Pledge.updateMany(
    { _id: { $in: allPledgeIds } },
    { status: 'completed', batchReceiptId: receipt._id }
  );

  // Update NGO stats
  for (const allocation of allocations) {
    await Ngo.findByIdAndUpdate(allocation.ngoId, {
      $inc: {
        totalReceived: allocation.lamports,
        totalReceivedUsd: allocation.totalPoints / POINTS_PER_DOLLAR,
        donationCount: 1
      }
    });
  }

  // Update user donation statuses
  await User.updateMany(
    { 'donations.status': 'pending' },
    { $set: { 'donations.$[elem].status': 'completed' } },
    { arrayFilters: [{ 'elem.status': 'pending' }] }
  );

  console.log(`\n=== Batch complete (week ${effectiveWeek}) ===`);
  console.log(`Receipt ID: ${receipt._id}`);
  console.log(`Explorer: https://explorer.solana.com/tx/${txSignature}?cluster=${cluster}`);

  return { success: true, receipt };
}

export default {
  getCurrentWeekNumber,
  pointsToLamports,
  aggregatePledges,
  processWeeklyBatch
};
