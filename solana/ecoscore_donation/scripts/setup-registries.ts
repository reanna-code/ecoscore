/**
 * Setup Script: Register all NGOs and Sponsors
 *
 * This script:
 * 1. Generates test keypairs for each NGO and sponsor
 * 2. Registers them on-chain via the Solana program
 * 3. Outputs the wallet addresses for database seeding
 *
 * Run with: npx ts-node scripts/setup-registries.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EcoscoreDonation } from "../target/types/ecoscore_donation";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";

// =============================================================================
// CONFIGURATION
// =============================================================================

const NGOS = [
  "Greenpeace",
  "Environmental Defense Fund (EDF)",
  "Friends of the Earth",
  "Natural Resources Defense Council (NRDC)",
  "Veritree",
  "Zero Waste Canada",
];

const SPONSORS = [
  "Patagonia",
  "Allbirds",
  "Tentree",
  "Girlfriend Collective",
  "Pela Case",
  "Seventh Generation",
  "Tom's of Maine",
];

// =============================================================================
// MAIN SCRIPT
// =============================================================================

async function main() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ecoscoreDonation as Program<EcoscoreDonation>;

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config_v2")],
    program.programId
  );
  const [ngoRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ngo_registry_v2")],
    program.programId
  );
  const [sponsorRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("sponsor_registry_v2")],
    program.programId
  );
  const [escrowVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_v2")],
    program.programId
  );

  console.log("=".repeat(60));
  console.log("ECOSCORE REGISTRY SETUP");
  console.log("=".repeat(60));
  console.log(`Program ID: ${program.programId.toString()}`);
  console.log(`Config PDA: ${configPda.toString()}`);
  console.log(`NGO Registry PDA: ${ngoRegistryPda.toString()}`);
  console.log(`Sponsor Registry PDA: ${sponsorRegistryPda.toString()}`);
  console.log(`Escrow Vault PDA: ${escrowVaultPda.toString()}`);
  console.log("");

  // Check if already initialized
  let needsInit = false;
  try {
    await program.account.config.fetch(configPda);
    console.log("Program already initialized. Skipping initialization.");
  } catch {
    needsInit = true;
    console.log("Program not initialized. Will initialize first.");
  }

  // Initialize if needed
  if (needsInit) {
    console.log("\nInitializing program...");
    await program.methods
      .initialize()
      .accountsPartial({
        admin: provider.wallet.publicKey,
      })
      .rpc();
    console.log("Program initialized!");
  }

  // Generate and register NGOs
  console.log("\n" + "=".repeat(60));
  console.log("REGISTERING NGOs");
  console.log("=".repeat(60));

  const ngoKeypairs: { name: string; keypair: Keypair; address: string }[] = [];

  for (const ngoName of NGOS) {
    const keypair = Keypair.generate();
    ngoKeypairs.push({
      name: ngoName,
      keypair,
      address: keypair.publicKey.toString(),
    });

    try {
      await program.methods
        .addNgo(keypair.publicKey, ngoName)
        .accountsPartial({
          admin: provider.wallet.publicKey,
        })
        .rpc();
      console.log(`  [OK] ${ngoName}`);
      console.log(`       ${keypair.publicKey.toString()}`);
    } catch (err: any) {
      if (err.error?.errorCode?.code === "NgoAlreadyExists") {
        console.log(`  [SKIP] ${ngoName} (already registered)`);
      } else {
        console.log(`  [FAIL] ${ngoName}: ${err.message}`);
      }
    }
  }

  // Generate and register Sponsors
  console.log("\n" + "=".repeat(60));
  console.log("REGISTERING SPONSORS");
  console.log("=".repeat(60));

  const sponsorKeypairs: { name: string; keypair: Keypair; address: string }[] = [];

  for (const sponsorName of SPONSORS) {
    const keypair = Keypair.generate();
    sponsorKeypairs.push({
      name: sponsorName,
      keypair,
      address: keypair.publicKey.toString(),
    });

    try {
      await program.methods
        .registerSponsor(keypair.publicKey, sponsorName)
        .accountsPartial({
          admin: provider.wallet.publicKey,
        })
        .rpc();
      console.log(`  [OK] ${sponsorName}`);
      console.log(`       ${keypair.publicKey.toString()}`);
    } catch (err: any) {
      if (err.error?.errorCode?.code === "SponsorAlreadyExists") {
        console.log(`  [SKIP] ${sponsorName} (already registered)`);
      } else {
        console.log(`  [FAIL] ${sponsorName}: ${err.message}`);
      }
    }
  }

  // Output summary for database seeding
  console.log("\n" + "=".repeat(60));
  console.log("DATABASE SEED DATA");
  console.log("=".repeat(60));
  console.log("\n// Copy this to your database seed file:\n");

  console.log("const NGOS = [");
  for (const ngo of ngoKeypairs) {
    console.log(`  { name: "${ngo.name}", walletAddress: "${ngo.address}" },`);
  }
  console.log("];");

  console.log("\nconst SPONSORS = [");
  for (const sponsor of sponsorKeypairs) {
    console.log(`  { name: "${sponsor.name}", walletAddress: "${sponsor.address}" },`);
  }
  console.log("];");

  // Save keypairs to file (for testing purposes)
  const keypairsOutput = {
    ngos: ngoKeypairs.map((n) => ({
      name: n.name,
      address: n.address,
      secretKey: Array.from(n.keypair.secretKey),
    })),
    sponsors: sponsorKeypairs.map((s) => ({
      name: s.name,
      address: s.address,
      secretKey: Array.from(s.keypair.secretKey),
    })),
  };

  const outputPath = "./scripts/registry-keypairs.json";
  fs.writeFileSync(outputPath, JSON.stringify(keypairsOutput, null, 2));
  console.log(`\nKeypairs saved to: ${outputPath}`);
  console.log("(Keep this file secure - contains secret keys for testing)");

  // Verify registrations
  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION");
  console.log("=".repeat(60));

  const ngoRegistry = await program.account.ngoRegistry.fetch(ngoRegistryPda);
  console.log(`\nNGOs registered: ${ngoRegistry.ngos.length}`);
  for (const ngo of ngoRegistry.ngos) {
    console.log(`  - ${ngo.name} (${ngo.isActive ? "active" : "inactive"})`);
  }

  const sponsorRegistry = await program.account.sponsorRegistry.fetch(sponsorRegistryPda);
  console.log(`\nSponsors registered: ${sponsorRegistry.sponsors.length}`);
  for (const sponsor of sponsorRegistry.sponsors) {
    console.log(`  - ${sponsor.name} (${sponsor.isVerified ? "verified" : "unverified"})`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("SETUP COMPLETE");
  console.log("=".repeat(60));
}

main().catch(console.error);
