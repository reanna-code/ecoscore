/**
 * Initialize Ecoscore program on devnet
 * Run: npx ts-node scripts/init-devnet.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Load IDL
const idlPath = path.join(__dirname, "../target/idl/ecoscore_donation.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

// Program ID
const PROGRAM_ID = new PublicKey("Ff9wbBku1gd8wEoXej6YMxqiyw6eUEGqzCJBNLoHzTqv");

// Load wallet from default location
const walletPath = process.env.SOLANA_WALLET_PATH ||
  path.join(process.env.HOME!, ".config/solana/ecoscore.json");
const walletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
);

async function main() {
  console.log("Initializing Ecoscore on devnet...\n");

  // Connect to devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Check balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`Wallet: ${walletKeypair.publicKey.toString()}`);
  console.log(`Balance: ${balance / 1e9} SOL\n`);

  if (balance < 0.1 * 1e9) {
    console.error("Not enough SOL! Get more from https://faucet.solana.com");
    process.exit(1);
  }

  // Set up provider
  const wallet = {
    publicKey: walletKeypair.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(walletKeypair);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      return txs.map(tx => {
        tx.partialSign(walletKeypair);
        return tx;
      });
    },
  };

  const provider = new anchor.AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new anchor.Program(idl, provider);

  // Derive PDAs (v3 seeds for fresh deployment)
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config_v3")],
    PROGRAM_ID
  );
  const [ngoRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ngo_registry_v3")],
    PROGRAM_ID
  );
  const [sponsorRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("sponsor_registry_v3")],
    PROGRAM_ID
  );
  const [escrowVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_v3")],
    PROGRAM_ID
  );

  console.log("PDAs:");
  console.log(`  Config: ${configPda.toString()}`);
  console.log(`  NGO Registry: ${ngoRegistryPda.toString()}`);
  console.log(`  Escrow Vault: ${escrowVaultPda.toString()}\n`);

  // Check if already initialized
  let alreadyInitialized = false;
  try {
    const config = await (program.account as any).config.fetch(configPda);
    console.log("Program already initialized!");
    console.log(`  Admin: ${config.admin.toString()}`);
    console.log(`  Total Deposited: ${config.totalDeposited.toNumber() / 1e9} SOL`);
    console.log(`  Total Disbursed: ${config.totalDisbursed.toNumber() / 1e9} SOL\n`);

    // Show current NGOs
    const registry = await (program.account as any).ngoRegistry.fetch(ngoRegistryPda);
    console.log(`Current NGOs registered: ${registry.ngos.length}`);
    registry.ngos.forEach((ngo: any, i: number) => {
      console.log(`  ${i + 1}. ${ngo.name} - ${ngo.pubkey.toString()}`);
    });
    console.log("\nWill add missing NGOs and sponsors...\n");
    alreadyInitialized = true;
  } catch (e) {
    console.log("Program not initialized yet. Initializing...\n");
  }

  // Initialize (only if not already done)
  if (!alreadyInitialized) {
    try {
      const tx = await (program.methods as any)
        .initialize()
        .accountsPartial({
          admin: walletKeypair.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
          sponsorRegistry: sponsorRegistryPda,
          escrowVault: escrowVaultPda,
        })
        .signers([walletKeypair])
        .rpc();

      console.log(`Initialize TX: ${tx}`);
      console.log(`Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet\n`);
    } catch (e: any) {
      console.error("Initialize failed:", e.message);
      return;
    }
  }

  // All NGOs from seed data
  const ngos = [
    { name: "Greenpeace", seed: "greenpeace" },
    { name: "Environmental Defense Fund", seed: "edf" },
    { name: "Friends of the Earth", seed: "foe" },
    { name: "NRDC", seed: "nrdc" },
    { name: "Veritree", seed: "veritree" },
    { name: "Zero Waste Canada", seed: "zerowaste" },
  ];

  // All Sponsors from seed data
  const sponsors = [
    { name: "Patagonia", seed: "patagonia" },
    { name: "Allbirds", seed: "allbirds" },
    { name: "Tentree", seed: "tentree" },
    { name: "Girlfriend Collective", seed: "girlfriend" },
    { name: "Pela Case", seed: "pela" },
    { name: "Seventh Generation", seed: "seventh" },
    { name: "Tom's of Maine", seed: "toms" },
  ];

  console.log("Adding NGOs...\n");

  for (const ngo of ngos) {
    const ngoKeypair = Keypair.fromSeed(
      Buffer.from(ngo.seed.padEnd(32, "0"))
    );

    try {
      const tx = await (program.methods as any)
        .addNgo(ngoKeypair.publicKey, ngo.name)
        .accountsPartial({
          admin: walletKeypair.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
        })
        .signers([walletKeypair])
        .rpc();

      console.log(`Added ${ngo.name}: ${ngoKeypair.publicKey.toString()}`);
      console.log(`  TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (e: any) {
      if (e.message?.includes("NgoAlreadyExists")) {
        console.log(`${ngo.name} already registered`);
      } else {
        console.error(`Failed to add ${ngo.name}:`, e.message);
      }
    }
  }

  console.log("\nRegistering Sponsors...\n");

  for (const sponsor of sponsors) {
    const sponsorKeypair = Keypair.fromSeed(
      Buffer.from(sponsor.seed.padEnd(32, "0"))
    );

    try {
      const tx = await (program.methods as any)
        .registerSponsor(sponsorKeypair.publicKey, sponsor.name)
        .accountsPartial({
          admin: walletKeypair.publicKey,
          config: configPda,
          sponsorRegistry: sponsorRegistryPda,
        })
        .signers([walletKeypair])
        .rpc();

      console.log(`Registered ${sponsor.name}: ${sponsorKeypair.publicKey.toString()}`);
      console.log(`  TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (e: any) {
      if (e.message?.includes("SponsorAlreadyExists")) {
        console.log(`${sponsor.name} already registered`);
      } else {
        console.error(`Failed to register ${sponsor.name}:`, e.message);
      }
    }
  }

  // Deposit some SOL into the escrow vault for testing
  console.log("\nDepositing test funds into escrow...\n");

  try {
    const depositAmount = 0.5 * 1_000_000_000; // 0.5 SOL in lamports
    const tx = await (program.methods as any)
      .deposit(new anchor.BN(depositAmount))
      .accountsPartial({
        sponsor: walletKeypair.publicKey,
        config: configPda,
        sponsorRegistry: sponsorRegistryPda,
        escrowVault: escrowVaultPda,
      })
      .signers([walletKeypair])
      .rpc();

    console.log(`Deposited 0.5 SOL to escrow vault`);
    console.log(`  TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (e: any) {
    console.log(`Deposit skipped or failed: ${e.message}`);
  }

  // Check vault balance
  const vaultBalance = await connection.getBalance(escrowVaultPda);
  console.log(`\nEscrow vault balance: ${vaultBalance / 1_000_000_000} SOL`);

  console.log("\n========================================");
  console.log("Done! Program is ready on devnet.");
  console.log("========================================\n");

  console.log("NGO wallet addresses (save for database):");
  ngos.forEach(ngo => {
    const kp = Keypair.fromSeed(Buffer.from(ngo.seed.padEnd(32, "0")));
    console.log(`  ${ngo.name}: ${kp.publicKey.toString()}`);
  });

  console.log("\nSponsor wallet addresses (save for database):");
  sponsors.forEach(sponsor => {
    const kp = Keypair.fromSeed(Buffer.from(sponsor.seed.padEnd(32, "0")));
    console.log(`  ${sponsor.name}: ${kp.publicKey.toString()}`);
  });
}

main().catch(console.error);
