import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EcoscoreDonation } from "../target/types/ecoscore_donation";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("ecoscore_donation", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .ecoscoreDonation as Program<EcoscoreDonation>;

  // Derive PDA addresses (v2 seeds)
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config_v2")],
    program.programId
  );

  const [ngoRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ngo_registry_v2")],
    program.programId
  );

  const [escrowVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_v2")],
    program.programId
  );

  const [sponsorRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("sponsor_registry_v2")],
    program.programId
  );

  // Test accounts
  const admin = provider.wallet;
  const sponsor = Keypair.generate();
  const ngo1 = Keypair.generate();
  const ngo2 = Keypair.generate();
  const ngo3 = Keypair.generate();
  const unauthorizedUser = Keypair.generate();

  // Conversion rate: 1000 points = 0.05 SOL
  const LAMPORTS_PER_1000_POINTS = 50_000_000;

  // Helper to airdrop SOL
  async function airdrop(pubkey: PublicKey, amount: number) {
    const sig = await provider.connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
  }

  // Helper to get account balance
  async function getBalance(pubkey: PublicKey): Promise<number> {
    return await provider.connection.getBalance(pubkey);
  }

  before(async () => {
    // Airdrop SOL to test accounts
    await airdrop(sponsor.publicKey, 10);
    await airdrop(unauthorizedUser.publicKey, 1);
  });

  describe("initialize", () => {
    it("initializes the escrow system", async () => {
      const tx = await program.methods
        .initialize()
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
          sponsorRegistry: sponsorRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize transaction:", tx);

      // Verify config was created correctly
      const config = await program.account.config.fetch(configPda);
      expect(config.admin.toString()).to.equal(admin.publicKey.toString());
      expect(config.totalDeposited.toNumber()).to.equal(0);
      expect(config.totalDisbursed.toNumber()).to.equal(0);
      expect(config.totalPointsRedeemed.toNumber()).to.equal(0);
      expect(config.lastBatchWeek.toNumber()).to.equal(0);

      // Verify NGO registry is empty
      const registry = await program.account.ngoRegistry.fetch(ngoRegistryPda);
      expect(registry.ngos.length).to.equal(0);

      // Verify sponsor registry is empty
      const sponsorRegistry = await program.account.sponsorRegistry.fetch(sponsorRegistryPda);
      expect(sponsorRegistry.sponsors.length).to.equal(0);
    });

    it("fails to initialize twice", async () => {
      try {
        await program.methods
          .initialize()
          .accounts({
            admin: admin.publicKey,
            config: configPda,
            ngoRegistry: ngoRegistryPda,
            sponsorRegistry: sponsorRegistryPda,
            escrowVault: escrowVaultPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });
  });

  describe("deposit", () => {
    it("allows sponsors to deposit SOL", async () => {
      const depositAmount = 2 * LAMPORTS_PER_SOL;
      const vaultBalanceBefore = await getBalance(escrowVaultPda);

      const tx = await program.methods
        .deposit(new anchor.BN(depositAmount))
        .accounts({
          sponsor: sponsor.publicKey,
          config: configPda,
          sponsorRegistry: sponsorRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([sponsor])
        .rpc();

      console.log("Deposit transaction:", tx);

      const vaultBalanceAfter = await getBalance(escrowVaultPda);
      expect(vaultBalanceAfter - vaultBalanceBefore).to.equal(depositAmount);

      const config = await program.account.config.fetch(configPda);
      expect(config.totalDeposited.toNumber()).to.equal(depositAmount);
    });

    it("allows multiple deposits", async () => {
      const depositAmount = 1 * LAMPORTS_PER_SOL;
      const configBefore = await program.account.config.fetch(configPda);

      await program.methods
        .deposit(new anchor.BN(depositAmount))
        .accounts({
          sponsor: sponsor.publicKey,
          config: configPda,
          sponsorRegistry: sponsorRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([sponsor])
        .rpc();

      const configAfter = await program.account.config.fetch(configPda);
      expect(configAfter.totalDeposited.toNumber()).to.equal(
        configBefore.totalDeposited.toNumber() + depositAmount
      );
    });

    it("fails for zero amount deposits", async () => {
      try {
        await program.methods
          .deposit(new anchor.BN(0))
          .accounts({
            sponsor: sponsor.publicKey,
            config: configPda,
            escrowVault: escrowVaultPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([sponsor])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("InvalidAmount");
      }
    });
  });

  describe("add_ngo", () => {
    it("allows admin to add NGOs", async () => {
      // Add all three NGOs for batch testing
      await program.methods
        .addNgo(ngo1.publicKey, "Ocean Cleanup")
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
        })
        .rpc();

      await program.methods
        .addNgo(ngo2.publicKey, "Rainforest Alliance")
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
        })
        .rpc();

      await program.methods
        .addNgo(ngo3.publicKey, "Climate Action Fund")
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
        })
        .rpc();

      const registry = await program.account.ngoRegistry.fetch(ngoRegistryPda);
      expect(registry.ngos.length).to.equal(3);
      expect(registry.ngos[0].name).to.equal("Ocean Cleanup");
      expect(registry.ngos[1].name).to.equal("Rainforest Alliance");
      expect(registry.ngos[2].name).to.equal("Climate Action Fund");
    });

    it("fails when non-admin tries to add NGO", async () => {
      const newNgo = Keypair.generate();

      try {
        await program.methods
          .addNgo(newNgo.publicKey, "Unauthorized NGO")
          .accounts({
            admin: unauthorizedUser.publicKey,
            config: configPda,
            ngoRegistry: ngoRegistryPda,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("Unauthorized");
      }
    });

    it("fails when adding duplicate NGO", async () => {
      try {
        await program.methods
          .addNgo(ngo1.publicKey, "Duplicate NGO")
          .accounts({
            admin: admin.publicKey,
            config: configPda,
            ngoRegistry: ngoRegistryPda,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("NgoAlreadyExists");
      }
    });
  });

  describe("register_sponsor", () => {
    it("allows admin to register sponsors", async () => {
      // Register test sponsors (brand partners)
      await program.methods
        .registerSponsor(sponsor.publicKey, "Patagonia")
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          sponsorRegistry: sponsorRegistryPda,
        })
        .rpc();

      const registry = await program.account.sponsorRegistry.fetch(sponsorRegistryPda);
      expect(registry.sponsors.length).to.equal(1);
      expect(registry.sponsors[0].name).to.equal("Patagonia");
      expect(registry.sponsors[0].isVerified).to.be.true;
      expect(registry.sponsors[0].totalDeposited.toNumber()).to.equal(0);
    });

    it("fails when non-admin tries to register sponsor", async () => {
      const newSponsor = Keypair.generate();

      try {
        await program.methods
          .registerSponsor(newSponsor.publicKey, "Unauthorized Brand")
          .accounts({
            admin: unauthorizedUser.publicKey,
            config: configPda,
            sponsorRegistry: sponsorRegistryPda,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("Unauthorized");
      }
    });

    it("fails when adding duplicate sponsor", async () => {
      try {
        await program.methods
          .registerSponsor(sponsor.publicKey, "Duplicate Brand")
          .accounts({
            admin: admin.publicKey,
            config: configPda,
            sponsorRegistry: sponsorRegistryPda,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("SponsorAlreadyExists");
      }
    });

    it("tracks sponsor deposits after registration", async () => {
      const depositAmount = 0.5 * LAMPORTS_PER_SOL;

      await program.methods
        .deposit(new anchor.BN(depositAmount))
        .accounts({
          sponsor: sponsor.publicKey,
          config: configPda,
          sponsorRegistry: sponsorRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([sponsor])
        .rpc();

      const registry = await program.account.sponsorRegistry.fetch(sponsorRegistryPda);
      const sponsorEntry = registry.sponsors.find(
        (s) => s.pubkey.toString() === sponsor.publicKey.toString()
      );

      // Note: Previous deposits (before registration) won't be tracked
      // This deposit should be tracked
      expect(sponsorEntry?.totalDeposited.toNumber()).to.be.greaterThan(0);
      expect(sponsorEntry?.depositCount).to.be.greaterThan(0);
    });
  });

  describe("remove_sponsor", () => {
    it("allows admin to unverify a sponsor", async () => {
      await program.methods
        .removeSponsor(sponsor.publicKey)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          sponsorRegistry: sponsorRegistryPda,
        })
        .rpc();

      const registry = await program.account.sponsorRegistry.fetch(sponsorRegistryPda);
      const sponsorEntry = registry.sponsors.find(
        (s) => s.pubkey.toString() === sponsor.publicKey.toString()
      );
      expect(sponsorEntry?.isVerified).to.be.false;
    });
  });

  describe("batch_disburse", () => {
    it("processes batch disbursement to multiple NGOs", async () => {
      const weekId = 202605; // Week 5 of 2026

      // Allocations: points pledged by users to each NGO
      const allocations = [
        { ngo: ngo1.publicKey, pointsPledged: new anchor.BN(5000) }, // 5000 points = 0.25 SOL
        { ngo: ngo2.publicKey, pointsPledged: new anchor.BN(3000) }, // 3000 points = 0.15 SOL
        { ngo: ngo3.publicKey, pointsPledged: new anchor.BN(2000) }, // 2000 points = 0.10 SOL
      ];

      const ngo1BalanceBefore = await getBalance(ngo1.publicKey);
      const ngo2BalanceBefore = await getBalance(ngo2.publicKey);
      const ngo3BalanceBefore = await getBalance(ngo3.publicKey);

      const tx = await program.methods
        .batchDisburse(new anchor.BN(weekId), allocations)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .remainingAccounts([
          { pubkey: ngo1.publicKey, isSigner: false, isWritable: true },
          { pubkey: ngo2.publicKey, isSigner: false, isWritable: true },
          { pubkey: ngo3.publicKey, isSigner: false, isWritable: true },
        ])
        .rpc();

      console.log("Batch disburse transaction:", tx);

      // Verify NGO balances increased correctly
      const ngo1BalanceAfter = await getBalance(ngo1.publicKey);
      const ngo2BalanceAfter = await getBalance(ngo2.publicKey);
      const ngo3BalanceAfter = await getBalance(ngo3.publicKey);

      // 5000 points = 0.25 SOL = 250,000,000 lamports
      expect(ngo1BalanceAfter - ngo1BalanceBefore).to.equal(
        (5000 * LAMPORTS_PER_1000_POINTS) / 1000
      );
      // 3000 points = 0.15 SOL = 150,000,000 lamports
      expect(ngo2BalanceAfter - ngo2BalanceBefore).to.equal(
        (3000 * LAMPORTS_PER_1000_POINTS) / 1000
      );
      // 2000 points = 0.10 SOL = 100,000,000 lamports
      expect(ngo3BalanceAfter - ngo3BalanceBefore).to.equal(
        (2000 * LAMPORTS_PER_1000_POINTS) / 1000
      );

      // Verify config updated
      const config = await program.account.config.fetch(configPda);
      expect(config.lastBatchWeek.toNumber()).to.equal(weekId);
      expect(config.totalPointsRedeemed.toNumber()).to.equal(10000); // 5000 + 3000 + 2000

      // Verify NGO totals in registry
      const registry = await program.account.ngoRegistry.fetch(ngoRegistryPda);
      const ngo1Entry = registry.ngos.find(
        (n) => n.pubkey.toString() === ngo1.publicKey.toString()
      );
      expect(ngo1Entry?.totalReceived.toNumber()).to.equal(
        (5000 * LAMPORTS_PER_1000_POINTS) / 1000
      );
    });

    it("fails to process same week twice", async () => {
      const weekId = 202605; // Same week as before

      try {
        await program.methods
          .batchDisburse(new anchor.BN(weekId), [
            { ngo: ngo1.publicKey, pointsPledged: new anchor.BN(1000) },
          ])
          .accounts({
            admin: admin.publicKey,
            config: configPda,
            ngoRegistry: ngoRegistryPda,
            escrowVault: escrowVaultPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .remainingAccounts([
            { pubkey: ngo1.publicKey, isSigner: false, isWritable: true },
          ])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("WeekAlreadyProcessed");
      }
    });

    it("applies pro-rata when pledges exceed vault balance", async () => {
      const weekId = 202606; // New week

      // Get current vault balance
      const vaultBalance = await getBalance(escrowVaultPda);
      console.log("Vault balance:", vaultBalance / LAMPORTS_PER_SOL, "SOL");

      // Pledge more than vault has (e.g., if vault has 2.5 SOL, pledge 5 SOL worth)
      // 100,000 points = 5 SOL worth
      const hugePoints = 100000;

      const ngo1BalanceBefore = await getBalance(ngo1.publicKey);

      const tx = await program.methods
        .batchDisburse(new anchor.BN(weekId), [
          { ngo: ngo1.publicKey, pointsPledged: new anchor.BN(hugePoints) },
        ])
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .remainingAccounts([
          { pubkey: ngo1.publicKey, isSigner: false, isWritable: true },
        ])
        .rpc();

      console.log("Pro-rata batch transaction:", tx);

      // NGO should receive the entire vault balance (pro-rata)
      const ngo1BalanceAfter = await getBalance(ngo1.publicKey);
      const received = ngo1BalanceAfter - ngo1BalanceBefore;

      console.log("NGO received:", received / LAMPORTS_PER_SOL, "SOL");
      console.log(
        "Expected full value:",
        (hugePoints * LAMPORTS_PER_1000_POINTS) / 1000 / LAMPORTS_PER_SOL,
        "SOL"
      );

      // Should receive less than requested due to pro-rata
      const fullValue = (hugePoints * LAMPORTS_PER_1000_POINTS) / 1000;
      expect(received).to.be.lessThan(fullValue);
      expect(received).to.be.greaterThan(0);

      // Vault should be nearly empty (may have some dust due to rent)
      const vaultBalanceAfter = await getBalance(escrowVaultPda);
      console.log(
        "Vault balance after:",
        vaultBalanceAfter / LAMPORTS_PER_SOL,
        "SOL"
      );
    });

    it("fails with empty batch", async () => {
      try {
        await program.methods
          .batchDisburse(new anchor.BN(202607), [])
          .accounts({
            admin: admin.publicKey,
            config: configPda,
            ngoRegistry: ngoRegistryPda,
            escrowVault: escrowVaultPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .remainingAccounts([])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("EmptyBatch");
      }
    });

    it("fails when NGO account doesn't match allocation", async () => {
      const wrongNgo = Keypair.generate();

      try {
        await program.methods
          .batchDisburse(new anchor.BN(202608), [
            { ngo: ngo1.publicKey, pointsPledged: new anchor.BN(1000) },
          ])
          .accounts({
            admin: admin.publicKey,
            config: configPda,
            ngoRegistry: ngoRegistryPda,
            escrowVault: escrowVaultPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .remainingAccounts([
            // Wrong account passed
            { pubkey: wrongNgo.publicKey, isSigner: false, isWritable: true },
          ])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("AccountMismatch");
      }
    });

    it("fails when non-admin tries to batch disburse", async () => {
      try {
        await program.methods
          .batchDisburse(new anchor.BN(202609), [
            { ngo: ngo1.publicKey, pointsPledged: new anchor.BN(1000) },
          ])
          .accounts({
            admin: unauthorizedUser.publicKey,
            config: configPda,
            ngoRegistry: ngoRegistryPda,
            escrowVault: escrowVaultPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .remainingAccounts([
            { pubkey: ngo1.publicKey, isSigner: false, isWritable: true },
          ])
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("Unauthorized");
      }
    });
  });

  describe("remove_ngo", () => {
    it("allows admin to deactivate an NGO", async () => {
      await program.methods
        .removeNgo(ngo3.publicKey)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          ngoRegistry: ngoRegistryPda,
        })
        .rpc();

      const registry = await program.account.ngoRegistry.fetch(ngoRegistryPda);
      const ngo = registry.ngos.find(
        (n) => n.pubkey.toString() === ngo3.publicKey.toString()
      );
      expect(ngo?.isActive).to.be.false;
    });

    it("fails to batch disburse to deactivated NGO", async () => {
      // First deposit more funds
      await airdrop(sponsor.publicKey, 5);
      await program.methods
        .deposit(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          sponsor: sponsor.publicKey,
          config: configPda,
          sponsorRegistry: sponsorRegistryPda,
          escrowVault: escrowVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([sponsor])
        .rpc();

      try {
        await program.methods
          .batchDisburse(new anchor.BN(202610), [
            { ngo: ngo3.publicKey, pointsPledged: new anchor.BN(1000) },
          ])
          .accounts({
            admin: admin.publicKey,
            config: configPda,
            ngoRegistry: ngoRegistryPda,
            escrowVault: escrowVaultPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .remainingAccounts([
            { pubkey: ngo3.publicKey, isSigner: false, isWritable: true },
          ])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("NgoNotActive");
      }
    });
  });

  describe("get_status", () => {
    it("returns current escrow status via logs", async () => {
      const tx = await program.methods
        .getStatus()
        .accounts({
          config: configPda,
          escrowVault: escrowVaultPda,
        })
        .rpc();

      console.log("Get status transaction:", tx);

      const config = await program.account.config.fetch(configPda);
      const vaultBalance = await getBalance(escrowVaultPda);

      console.log("\n=== Final Escrow Status ===");
      console.log("Admin:", config.admin.toString());
      console.log(
        "Total Deposited:",
        config.totalDeposited.toNumber() / LAMPORTS_PER_SOL,
        "SOL"
      );
      console.log(
        "Total Disbursed:",
        config.totalDisbursed.toNumber() / LAMPORTS_PER_SOL,
        "SOL"
      );
      console.log("Total Points Redeemed:", config.totalPointsRedeemed.toNumber());
      console.log("Last Batch Week:", config.lastBatchWeek.toNumber());
      console.log("Vault Balance:", vaultBalance / LAMPORTS_PER_SOL, "SOL");
    });
  });
});
