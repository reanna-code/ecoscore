/**
 * Demo Script: Full Donation Flow
 *
 * Shows:
 * 1. Patagonia deposits 2 SOL into escrow
 * 2. Check vault balance
 * 3. Batch disburse to Greenpeace and Veritree
 * 4. Verify NGOs received funds
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EcoscoreDonation } from "../target/types/ecoscore_donation";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";

async function main() {
  // Setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.ecoscoreDonation as Program<EcoscoreDonation>;

  // Load keypairs
  const keypairs = JSON.parse(fs.readFileSync("./scripts/registry-keypairs.json", "utf-8"));

  const patagonia = Keypair.fromSecretKey(Uint8Array.from(keypairs.sponsors[0].secretKey));
  const greenpeace = Keypair.fromSecretKey(Uint8Array.from(keypairs.ngos[0].secretKey));
  const veritree = Keypair.fromSecretKey(Uint8Array.from(keypairs.ngos[4].secretKey));

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config_v2")], program.programId);
  const [escrowVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("escrow_v2")], program.programId);
  const [sponsorRegistryPda] = PublicKey.findProgramAddressSync([Buffer.from("sponsor_registry_v2")], program.programId);
  const [ngoRegistryPda] = PublicKey.findProgramAddressSync([Buffer.from("ngo_registry_v2")], program.programId);

  console.log("\n" + "=".repeat(60));
  console.log("ECOSCORE DONATION DEMO");
  console.log("=".repeat(60));

  // Get initial balances
  const initialVaultBalance = await provider.connection.getBalance(escrowVaultPda);
  console.log(`\nInitial Vault Balance: ${initialVaultBalance / LAMPORTS_PER_SOL} SOL`);

  // Step 1: Airdrop SOL to Patagonia for the deposit
  console.log("\n--- STEP 1: Fund Patagonia wallet ---");
  const airdropSig = await provider.connection.requestAirdrop(patagonia.publicKey, 3 * LAMPORTS_PER_SOL);
  await provider.connection.confirmTransaction(airdropSig);
  console.log(`Airdropped 3 SOL to Patagonia: ${patagonia.publicKey.toString()}`);

  // Step 2: Patagonia deposits 2 SOL
  console.log("\n--- STEP 2: Patagonia deposits 2 SOL ---");
  const depositAmount = 2 * LAMPORTS_PER_SOL;

  const depositTx = await program.methods
    .deposit(new anchor.BN(depositAmount))
    .accountsPartial({
      sponsor: patagonia.publicKey,
    })
    .signers([patagonia])
    .rpc();

  console.log(`Deposit TX: ${depositTx}`);
  console.log(`View on Explorer: https://explorer.solana.com/tx/${depositTx}?cluster=custom&customUrl=http://localhost:8899`);

  // Check vault balance after deposit
  const vaultAfterDeposit = await provider.connection.getBalance(escrowVaultPda);
  console.log(`Vault Balance after deposit: ${vaultAfterDeposit / LAMPORTS_PER_SOL} SOL`);

  // Step 3: Check sponsor registry to verify deposit tracked
  console.log("\n--- STEP 3: Verify sponsor deposit tracked ---");
  const sponsorRegistry = await program.account.sponsorRegistry.fetch(sponsorRegistryPda);
  const patagoniaEntry = sponsorRegistry.sponsors.find(s => s.pubkey.equals(patagonia.publicKey));
  if (patagoniaEntry) {
    console.log(`Patagonia total deposited: ${patagoniaEntry.totalDeposited.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`Patagonia deposit count: ${patagoniaEntry.depositCount}`);
  }

  // Step 4: Batch disburse to NGOs
  // NEW RATE: 100 points = $1 = 0.01 SOL, so 1000 points = 0.1 SOL
  console.log("\n--- STEP 4: Batch disburse to Greenpeace & Veritree ---");
  console.log("Allocating 10,000 points to Greenpeace (1 SOL = $100)");
  console.log("Allocating 5,000 points to Veritree (0.5 SOL = $50)");

  const weekNumber = new anchor.BN(Date.now()); // Unique identifier for this demo run
  const allocations = [
    { ngo: greenpeace.publicKey, pointsPledged: new anchor.BN(10000) },
    { ngo: veritree.publicKey, pointsPledged: new anchor.BN(5000) },
  ];

  const disburseTx = await program.methods
    .batchDisburse(weekNumber, allocations)
    .accountsPartial({
      admin: provider.wallet.publicKey,
    })
    .remainingAccounts([
      { pubkey: greenpeace.publicKey, isSigner: false, isWritable: true },
      { pubkey: veritree.publicKey, isSigner: false, isWritable: true },
    ])
    .rpc();

  console.log(`Disburse TX: ${disburseTx}`);
  console.log(`View on Explorer: https://explorer.solana.com/tx/${disburseTx}?cluster=custom&customUrl=http://localhost:8899`);

  // Step 5: Verify final balances
  console.log("\n--- STEP 5: Final balances ---");

  const greenpeaceBalance = await provider.connection.getBalance(greenpeace.publicKey);
  const veritreeBalance = await provider.connection.getBalance(veritree.publicKey);
  const finalVaultBalance = await provider.connection.getBalance(escrowVaultPda);

  console.log(`Greenpeace received: ${greenpeaceBalance / LAMPORTS_PER_SOL} SOL`);
  console.log(`Veritree received: ${veritreeBalance / LAMPORTS_PER_SOL} SOL`);
  console.log(`Remaining in vault: ${finalVaultBalance / LAMPORTS_PER_SOL} SOL`);

  // Step 6: Show config stats
  console.log("\n--- STEP 6: Escrow stats ---");
  const config = await program.account.config.fetch(configPda);
  console.log(`Total deposited all-time: ${config.totalDeposited.toNumber() / LAMPORTS_PER_SOL} SOL`);
  console.log(`Total disbursed all-time: ${config.totalDisbursed.toNumber() / LAMPORTS_PER_SOL} SOL`);
  console.log(`Total points redeemed: ${config.totalPointsRedeemed.toNumber()}`);

  console.log("\n" + "=".repeat(60));
  console.log("DEMO COMPLETE");
  console.log("=".repeat(60));
  console.log("\nThis demonstrates the full flow:");
  console.log("1. Sponsor (Patagonia) deposited funds into escrow");
  console.log("2. Deposit tracked on-chain in SponsorRegistry");
  console.log("3. Admin batch disbursed to NGOs (Greenpeace, Veritree)");
  console.log("4. All transactions verifiable on Solana Explorer");
  console.log("");
}

main().catch(console.error);
