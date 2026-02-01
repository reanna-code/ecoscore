/**
 * Solana Client Service
 * Connects to the Ecoscore donation program on Solana
 */

import anchor from '@coral-xyz/anchor';
const { BN } = anchor;
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Program ID from deployed contract
const PROGRAM_ID = new PublicKey('Ff9wbBku1gd8wEoXej6YMxqiyw6eUEGqzCJBNLoHzTqv');

// PDA seeds (must match the Rust program - v3)
const CONFIG_SEED = 'config_v3';
const NGO_REGISTRY_SEED = 'ngo_registry_v3';
const SPONSOR_REGISTRY_SEED = 'sponsor_registry_v3';
const ESCROW_SEED = 'escrow_v3';

class SolanaClient {
  constructor(cluster = 'devnet') {
    this.cluster = cluster;
    this.connection = null;
    this.provider = null;
    this.program = null;
    this.wallet = null;
  }

  async initialize() {
    // Set up connection based on cluster
    const rpcUrl = this.cluster === 'localnet'
      ? 'http://127.0.0.1:8899'
      : this.cluster === 'devnet'
        ? 'https://api.devnet.solana.com'
        : 'https://api.mainnet-beta.solana.com';

    this.connection = new Connection(rpcUrl, 'confirmed');

    // Load wallet from environment variable (preferred for team sharing) or file
    try {
      if (process.env.SOLANA_WALLET_KEY) {
        // Parse wallet from env variable (JSON array of numbers)
        const walletData = JSON.parse(process.env.SOLANA_WALLET_KEY);
        this.wallet = Keypair.fromSecretKey(Uint8Array.from(walletData));
        console.log('✅ Loaded Solana wallet from SOLANA_WALLET_KEY env');
      } else {
        // Fallback to file
        const walletPath = process.env.SOLANA_WALLET_PATH ||
          path.join(process.env.HOME, '.config/solana/ecoscore.json');
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
        this.wallet = Keypair.fromSecretKey(Uint8Array.from(walletData));
        console.log('✅ Loaded Solana wallet from file:', walletPath);
      }
    } catch (error) {
      console.error('Failed to load Solana wallet:', error.message);
      console.error('Set SOLANA_WALLET_KEY in .env or ensure wallet file exists');
      throw new Error('Solana wallet not configured. Add SOLANA_WALLET_KEY to .env');
    }

    // Set up Anchor provider
    const walletAdapter = {
      publicKey: this.wallet.publicKey,
      signTransaction: async (tx) => {
        tx.partialSign(this.wallet);
        return tx;
      },
      signAllTransactions: async (txs) => {
        return txs.map(tx => {
          tx.partialSign(this.wallet);
          return tx;
        });
      }
    };

    this.provider = new anchor.AnchorProvider(
      this.connection,
      walletAdapter,
      { commitment: 'confirmed' }
    );

    // Load IDL
    const idlPath = path.join(__dirname, '../../../solana/ecoscore_donation/target/idl/ecoscore_donation.json');
    let idl;
    try {
      idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load IDL:', error.message);
      // Use minimal IDL for basic operations
      idl = await anchor.Program.fetchIdl(PROGRAM_ID, this.provider);
    }

    this.program = new anchor.Program(idl, this.provider);

    console.log(`Solana client initialized on ${this.cluster}`);
    console.log(`Wallet: ${this.wallet.publicKey.toString()}`);

    return this;
  }

  // Derive PDAs
  getPdas() {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED)],
      PROGRAM_ID
    );
    const [ngoRegistryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(NGO_REGISTRY_SEED)],
      PROGRAM_ID
    );
    const [sponsorRegistryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(SPONSOR_REGISTRY_SEED)],
      PROGRAM_ID
    );
    const [escrowVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED)],
      PROGRAM_ID
    );

    return { configPda, ngoRegistryPda, sponsorRegistryPda, escrowVaultPda };
  }

  /**
   * Get escrow vault balance
   */
  async getVaultBalance() {
    const { escrowVaultPda } = this.getPdas();
    const balance = await this.connection.getBalance(escrowVaultPda);
    return {
      lamports: balance,
      sol: balance / LAMPORTS_PER_SOL
    };
  }

  /**
   * Get program config stats
   */
  async getStats() {
    const { configPda } = this.getPdas();
    try {
      const config = await this.program.account.config.fetch(configPda);
      return {
        admin: config.admin.toString(),
        totalDeposited: config.totalDeposited.toNumber() / LAMPORTS_PER_SOL,
        totalDisbursed: config.totalDisbursed.toNumber() / LAMPORTS_PER_SOL,
        totalPointsRedeemed: config.totalPointsRedeemed.toNumber(),
        lastBatchWeek: config.lastBatchWeek
      };
    } catch (error) {
      console.error('Failed to fetch config:', error.message);
      return null;
    }
  }

  /**
   * Get registered NGOs from on-chain registry
   */
  async getNgos() {
    const { ngoRegistryPda } = this.getPdas();
    try {
      const registry = await this.program.account.ngoRegistry.fetch(ngoRegistryPda);
      return registry.ngos.map(ngo => ({
        pubkey: ngo.pubkey.toString(),
        name: ngo.name,
        totalReceived: ngo.totalReceived.toNumber() / LAMPORTS_PER_SOL,
        disbursementCount: ngo.disbursementCount,
        isActive: ngo.isActive
      }));
    } catch (error) {
      console.error('Failed to fetch NGO registry:', error.message);
      return [];
    }
  }

  /**
   * Get registered sponsors from on-chain registry
   */
  async getSponsors() {
    const { sponsorRegistryPda } = this.getPdas();
    try {
      const registry = await this.program.account.sponsorRegistry.fetch(sponsorRegistryPda);
      return registry.sponsors.map(sponsor => ({
        pubkey: sponsor.pubkey.toString(),
        name: sponsor.name,
        totalDeposited: sponsor.totalDeposited.toNumber() / LAMPORTS_PER_SOL,
        depositCount: sponsor.depositCount,
        isVerified: sponsor.isVerified
      }));
    } catch (error) {
      console.error('Failed to fetch sponsor registry:', error.message);
      return [];
    }
  }

  /**
   * Execute batch disbursement to NGOs
   * @param {number} weekId - Week identifier
   * @param {Array} allocations - Array of { ngoWallet, totalPoints }
   */
  async batchDisburse(weekId, allocations) {
    const { configPda, ngoRegistryPda, escrowVaultPda } = this.getPdas();

    // Format allocations for the program
    const formattedAllocations = allocations.map(a => ({
      ngo: new PublicKey(a.ngoWallet),
      pointsPledged: new BN(a.totalPoints)
    }));

    // Build remaining accounts (NGO wallets to receive funds)
    const remainingAccounts = allocations.map(a => ({
      pubkey: new PublicKey(a.ngoWallet),
      isSigner: false,
      isWritable: true
    }));

    try {
      console.log('Batch disburse params:', {
        weekId,
        allocations: formattedAllocations.map(a => ({
          ngo: a.ngo.toString(),
          points: a.pointsPledged.toString()
        })),
        admin: this.wallet.publicKey.toString(),
        config: configPda.toString(),
        ngoRegistry: ngoRegistryPda.toString(),
        escrowVault: escrowVaultPda.toString(),
      });

      const tx = await this.program.methods
        .batchDisburse(new BN(weekId), formattedAllocations)
        .accountsPartial({
          admin: this.wallet.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
          escrowVault: escrowVaultPda,
        })
        .remainingAccounts(remainingAccounts)
        .signers([this.wallet])
        .rpc();

      console.log(`Batch disbursement TX: ${tx}`);

      return {
        success: true,
        signature: tx,
        explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=${this.cluster}`
      };
    } catch (error) {
      console.error('Batch disbursement failed:', error.message);
      console.error('Error logs:', error.logs || 'No logs');
      throw new Error(`Solana batch failed: ${error.message}`);
    }
  }
}

// Singleton instance per cluster
const solanaClients = {};

export async function getSolanaClient(cluster = 'devnet') {
  if (!solanaClients[cluster]) {
    solanaClients[cluster] = new SolanaClient(cluster);
    await solanaClients[cluster].initialize();
  }
  return solanaClients[cluster];
}

export default SolanaClient;
