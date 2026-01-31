/**
 * ECOSCORE DEVNET DEMONSTRATION
 *
 * This script runs real transactions on Solana devnet that you can verify
 * on Solana Explorer: https://explorer.solana.com/?cluster=devnet
 *
 * Run with: npx ts-node scripts/demo-devnet.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  clusterApiUrl
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Load the IDL
const idlPath = path.join(__dirname, "../target/idl/ecoscore_donation.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

const PROGRAM_ID = new PublicKey("Ff9wbBku1gd8wEoXej6YMxqiyw6eUEGqzCJBNLoHzTqv");

// Derive PDAs (v2 seeds for fresh deployment)
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config_v2")],
  PROGRAM_ID
);

const [ngoRegistryPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("ngo_registry_v2")],
  PROGRAM_ID
);

const [escrowVaultPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("escrow_v2")],
  PROGRAM_ID
);

function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithDelay<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (e.message?.includes("403") && i < retries - 1) {
        console.log(`  Rate limited, waiting ${delay/1000}s and retrying...`);
        await sleep(delay);
        delay *= 1.5; // Exponential backoff
      } else {
        throw e;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  ECOSCORE DEVNET DEMONSTRATION");
  console.log("  All transactions are REAL and verifiable on Solana Explorer");
  console.log("=".repeat(70) + "\n");

  // Setup connection and wallet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Load wallet from default path
  const walletPath = process.env.HOME + "/.config/solana/ecoscore.json";
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  anchor.setProvider(provider);
  const program = new Program(idl, provider) as any;

  console.log("Admin Wallet:", wallet.publicKey.toString());
  console.log("Program ID:", PROGRAM_ID.toString());
  console.log("Config PDA:", configPda.toString());
  console.log("Vault PDA:", escrowVaultPda.toString());
  console.log("");

  // Check wallet balance
  const balance = await retryWithDelay(() => connection.getBalance(wallet.publicKey));
  console.log(`Wallet Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.log("⚠️  Low balance! Requesting airdrop...");
    try {
      const sig = await connection.requestAirdrop(wallet.publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);
      console.log("✓ Airdrop received\n");
    } catch (e) {
      console.log("Airdrop failed (rate limited). Continuing with current balance.\n");
    }
  }

  // Check if already initialized
  let isInitialized = false;
  try {
    const config = await program.account.config.fetch(configPda);
    isInitialized = true;
    console.log("━".repeat(70));
    console.log("ESCROW ALREADY INITIALIZED");
    console.log("━".repeat(70));
    console.log("Admin:", config.admin.toString());
    console.log("Total Deposited:", config.totalDeposited.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("Total Disbursed:", config.totalDisbursed.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("Total Points Redeemed:", config.totalPointsRedeemed.toNumber());
    console.log("Last Batch Week:", config.lastBatchWeek.toNumber());
    console.log("");
  } catch (e) {
    console.log("Escrow not yet initialized. Initializing now...\n");
  }

  // Step 1: Initialize (if needed)
  if (!isInitialized) {
    console.log("━".repeat(70));
    console.log("STEP 1: INITIALIZE ESCROW");
    console.log("━".repeat(70));

    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          admin: wallet.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("✓ Escrow initialized!");
      console.log("Transaction:", tx);
      console.log("Verify on Explorer:", explorerUrl(tx));
      console.log("");
      await sleep(2000); // Wait for confirmation
    } catch (e: any) {
      console.log("Initialize failed:", e.message);
      console.log("");
    }
  }

  // Step 2: Deposit some SOL
  console.log("━".repeat(70));
  console.log("STEP 2: SPONSOR DEPOSIT");
  console.log("━".repeat(70));
  console.log("Simulating a brand partner depositing funds...\n");

  const depositAmount = 0.05 * LAMPORTS_PER_SOL; // 0.05 SOL
  try {
    const tx = await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        sponsor: wallet.publicKey,
        config: configPda,
        escrowVault: escrowVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✓ Deposited", depositAmount / LAMPORTS_PER_SOL, "SOL to escrow vault");
    console.log("Transaction:", tx);
    console.log("Verify on Explorer:", explorerUrl(tx));
    console.log("");
    await sleep(2000);
  } catch (e: any) {
    console.log("Deposit failed:", e.message);
    console.log("");
  }

  // Check vault balance
  await sleep(1000);
  const vaultBalance = await retryWithDelay(() => connection.getBalance(escrowVaultPda));
  console.log("Current Vault Balance:", vaultBalance / LAMPORTS_PER_SOL, "SOL");
  console.log("View Vault on Explorer:", explorerAddressUrl(escrowVaultPda.toString()));
  console.log("");

  // Step 3: Add NGOs (if not already added)
  console.log("━".repeat(70));
  console.log("STEP 3: ADD NGO TO WHITELIST");
  console.log("━".repeat(70));

  // Generate a test NGO keypair (in production, this would be the real NGO wallet)
  const testNgo = Keypair.generate();
  console.log("Test NGO Wallet:", testNgo.publicKey.toString());
  console.log("");

  try {
    const tx = await program.methods
      .addNgo(testNgo.publicKey, "Demo Climate Fund")
      .accounts({
        admin: wallet.publicKey,
        config: configPda,
        ngoRegistry: ngoRegistryPda,
      })
      .rpc();

    console.log("✓ Added 'Demo Climate Fund' to whitelist");
    console.log("Transaction:", tx);
    console.log("Verify on Explorer:", explorerUrl(tx));
    console.log("");
    await sleep(2000);
  } catch (e: any) {
    if (e.message.includes("NgoAlreadyExists")) {
      console.log("NGO already in whitelist (that's fine)\n");
    } else {
      console.log("Add NGO failed:", e.message);
      console.log("");
    }
  }

  // Show NGO registry
  try {
    const registry = await program.account.ngoRegistry.fetch(ngoRegistryPda);
    console.log("Current NGO Whitelist:");
    registry.ngos.forEach((ngo: any, i: number) => {
      console.log(`  ${i + 1}. ${ngo.name} - ${ngo.pubkey.toString().slice(0, 20)}...`);
      console.log(`     Active: ${ngo.isActive}, Total Received: ${ngo.totalReceived.toNumber() / LAMPORTS_PER_SOL} SOL`);
    });
    console.log("");
  } catch (e) {
    console.log("Could not fetch registry\n");
  }

  // Step 4: Batch Disburse
  console.log("━".repeat(70));
  console.log("STEP 4: BATCH DISBURSEMENT");
  console.log("━".repeat(70));
  console.log("Simulating end-of-week batch to NGOs...\n");

  // Use a unique week ID based on current time
  const weekId = Math.floor(Date.now() / 1000);

  try {
    // Fetch current registry to get an active NGO
    const registry = await program.account.ngoRegistry.fetch(ngoRegistryPda);
    const activeNgo = registry.ngos.find((n: any) => n.isActive);

    if (!activeNgo) {
      console.log("No active NGOs found. Skipping batch disburse.\n");
    } else {
      const ngoBalanceBefore = await retryWithDelay(() => connection.getBalance(activeNgo.pubkey));

      const tx = await program.methods
        .batchDisburse(
          new anchor.BN(weekId),
          [{ ngo: activeNgo.pubkey, pointsPledged: new anchor.BN(1000) }] // 1000 points = 0.05 SOL
        )
        .accounts({
          admin: wallet.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .remainingAccounts([
          { pubkey: activeNgo.pubkey, isSigner: false, isWritable: true },
        ])
        .rpc();

      await sleep(2000);
      const ngoBalanceAfter = await retryWithDelay(() => connection.getBalance(activeNgo.pubkey));
      const received = (ngoBalanceAfter - ngoBalanceBefore) / LAMPORTS_PER_SOL;

      console.log("✓ Batch disbursement complete!");
      console.log(`  NGO '${activeNgo.name}' received: ${received} SOL`);
      console.log("Transaction:", tx);
      console.log("Verify on Explorer:", explorerUrl(tx));
      console.log("");
    }
  } catch (e: any) {
    console.log("Batch disburse failed:", e.message);
    if (e.logs) {
      console.log("Logs:", e.logs.slice(-5));
    }
    console.log("");
  }

  // Final Status
  console.log("━".repeat(70));
  console.log("FINAL STATUS");
  console.log("━".repeat(70));

  try {
    const config = await program.account.config.fetch(configPda);
    const vaultFinal = await retryWithDelay(() => connection.getBalance(escrowVaultPda));

    console.log("Total Deposited:", config.totalDeposited.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("Total Disbursed:", config.totalDisbursed.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("Total Points Redeemed:", config.totalPointsRedeemed.toNumber());
    console.log("Current Vault Balance:", vaultFinal / LAMPORTS_PER_SOL, "SOL");
    console.log("");
  } catch (e) {
    console.log("Could not fetch final status\n");
  }

  console.log("━".repeat(70));
  console.log("VERIFICATION LINKS");
  console.log("━".repeat(70));
  console.log("Program:", explorerAddressUrl(PROGRAM_ID.toString()));
  console.log("Config:", explorerAddressUrl(configPda.toString()));
  console.log("Vault:", explorerAddressUrl(escrowVaultPda.toString()));
  console.log("NGO Registry:", explorerAddressUrl(ngoRegistryPda.toString()));
  console.log("");
  console.log("Open these links in your browser to see the on-chain data!");
  console.log("=".repeat(70) + "\n");
}

main().catch(console.error);
