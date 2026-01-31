# Ecoscore Donations — Solana Escrow Program

A transparent, on-chain donation escrow system that leverages Solana's unique capabilities to enable verifiable sustainability funding.

---

## The Core Design Philosophy

> **"What actually needs to be on the blockchain?"**

We deliberately chose a **hybrid approach** — not everything benefits from being on-chain.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    THE HYBRID MODEL: BEST OF BOTH WORLDS                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   OFF-CHAIN (Database)                    ON-CHAIN (Solana)                  │
│   ────────────────────                    ─────────────────                  │
│   • User accounts                         • Actual donations                 │
│   • Point accumulation                    • NGO whitelist                   │
│   • Product capture history               • Batch receipts                  │
│   • Pledge intentions                     • Impact Certificates             │
│                                                                              │
│   WHY:                                    WHY:                               │
│   ─────                                   ─────                              │
│   • Instant (no tx wait)                  • Trustless (can't fake it)       │
│   • Free (no fees)                        • Permanent (immutable)           │
│   • No wallet needed                      • Verifiable (public audit)       │
│   • Familiar UX                           • Portable (user owns proof)      │
│                                                                              │
│   ════════════════════════════════════════════════════════════════════════  │
│                                                                              │
│   RESULT: 99% of users never think about blockchain,                        │
│           but 100% of donations are publicly verifiable.                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Why not put everything on-chain?**

If we minted a token for every product capture:
- 1,000 users × 10 captures/week = 10,000 transactions/week
- Every user MUST have a Solana wallet
- Every user MUST understand crypto
- 90% of potential users never sign up

With our hybrid approach:
- Points accumulate in a database (free, instant, no wallet)
- Weekly batch = 1 transaction regardless of user count
- Blockchain only where trust matters (actual money movement)

---

## Why Solana? Intentional Design Choices

This project was built specifically to leverage Solana's strengths. Here's how each feature from the hackathon prompt directly enables our design:

### Low Fees — The Economic Foundation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     WHY LOW FEES ARE CRITICAL                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User captures a product → Earns ~$0.05 worth of points                     │
│                                                                              │
│  ON ETHEREUM:                     ON SOLANA:                                 │
│  ┌─────────────────────┐          ┌─────────────────────┐                   │
│  │ Reward:    $0.05    │          │ Reward:    $0.05    │                   │
│  │ Gas fee:  -$2.00    │          │ Tx fee:   -$0.00025 │                   │
│  │ ───────────────────  │          │ ─────────────────── │                   │
│  │ Net:      -$1.95 ❌  │          │ Net:      +$0.0497 ✓│                   │
│  └─────────────────────┘          └─────────────────────┘                   │
│                                                                              │
│  Ethereum's fees would DESTROY the micro-reward model.                      │
│  Solana's ~$0.00025 fees make sustainability rewards VIABLE.                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design choice:** We batch weekly disbursements into a single transaction. Even with 10 NGOs receiving funds, the total cost is ~$0.001. This means virtually 100% of brand sponsor funds reach NGOs.

### Verified Ownership — Trustless Escrow via PDAs

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     PROGRAM DERIVED ADDRESS (PDA)                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Traditional Escrow:              Solana PDA Escrow:                         │
│  ┌─────────────────────┐          ┌─────────────────────┐                   │
│  │ Company holds funds │          │ Program holds funds │                   │
│  │ in bank account     │          │ in PDA vault        │                   │
│  │                     │          │                     │                   │
│  │ Trust: Company      │          │ Trust: CODE         │                   │
│  │ Risk: Fraud/theft   │          │ Risk: None*         │                   │
│  └─────────────────────┘          └─────────────────────┘                   │
│                                                                              │
│  * The vault address has NO private key. Only the program's                 │
│    batch_disburse instruction can move funds, and it ONLY                   │
│    sends to whitelisted NGOs.                                               │
│                                                                              │
│  Seeds: ["escrow"] → Deterministic address anyone can verify               │
│  Owner: System Program (holds SOL)                                          │
│  Controller: Our program (via invoke_signed)                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design choice:** The escrow vault is a PDA, not a wallet. This provides cryptographic proof that:
- No human can steal the funds
- Only whitelisted NGOs can receive disbursements
- The logic is deterministic and auditable

### Transparent Logic — On-Chain Events as Receipts

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     ON-CHAIN TRANSPARENCY                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Every action emits a permanent, verifiable event:                          │
│                                                                              │
│  BatchDisburseEvent {                                                        │
│    week_id: 202605,                    // Which week                         │
│    total_points_pledged: 50000,        // User pledges honored              │
│    total_amount_disbursed: 2500000000, // 2.5 SOL sent                      │
│    pro_rata_bps: 10000,                // 100% (no scaling needed)          │
│    disbursements: [                                                         │
│      { ngo: "Ocean...", amount: 1250000000 },   // 1.25 SOL                 │
│      { ngo: "Rain...",  amount: 750000000 },    // 0.75 SOL                 │
│      { ngo: "Clim...",  amount: 500000000 },    // 0.50 SOL                 │
│    ],                                                                        │
│    timestamp: 1738339200,                                                   │
│  }                                                                           │
│                                                                              │
│  Anyone can:                                                                 │
│  • View the transaction on Solana Explorer                                  │
│  • Verify exact amounts sent to each NGO                                    │
│  • Confirm timestamps                                                        │
│  • Audit the entire donation history                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design choice:** We emit comprehensive events for every deposit and disbursement. This creates an immutable audit trail that brands, users, and NGOs can all verify independently.

### Instant Payments — Real-Time Settlement

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     PAYMENT FINALITY                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Traditional Bank Transfer:       Solana Transfer:                          │
│  ┌─────────────────────────┐      ┌─────────────────────────┐               │
│  │ Day 1: Initiate         │      │ 0ms: Submit tx          │               │
│  │ Day 2: Processing       │      │ 400ms: Confirmed ✓      │               │
│  │ Day 3: Pending          │      │                         │               │
│  │ Day 4: Maybe cleared    │      │ NGO has funds NOW       │               │
│  │ Day 5: Funds available  │      └─────────────────────────┘               │
│  └─────────────────────────┘                                                │
│                                                                              │
│  When we run batch_disburse on Sunday night:                                │
│  • Transaction submitted                                                    │
│  • 400ms later: All NGOs have received funds                               │
│  • Confirmation visible on Explorer immediately                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design choice:** NGOs receive funds with 400ms finality. No waiting for bank clearing. No intermediaries. Funds are available instantly.

### High Throughput — Scalable Batch Processing

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     THROUGHPUT UTILIZATION                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Scenario: 100,000 users pledge to 10 NGOs in one week                      │
│                                                                              │
│  Individual redemption model (not our design):                              │
│  • 100,000 transactions needed                                               │
│  • Even at 65k TPS, takes ~1.5 seconds                                      │
│  • But costs 100,000 × $0.00025 = $25                                       │
│                                                                              │
│  Batch model (our design):                                                  │
│  • 1 transaction with 10 transfers                                          │
│  • Completes in 400ms                                                       │
│  • Costs ~$0.001                                                            │
│                                                                              │
│  We leverage Solana's throughput by batching, achieving:                    │
│  • Same outcome (all NGOs funded)                                           │
│  • 25,000x lower cost                                                        │
│  • Simpler verification (1 tx to audit vs 100,000)                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design choice:** Rather than making individual transactions, we batch all pledges into a single weekly transaction. This is optimal use of Solana's capabilities — high throughput means we *could* do 100k transactions, but low fees mean we don't *need* to.

---

## What is Ecoscore?

Ecoscore helps consumers make sustainable shopping decisions:

1. **Capture or paste** a product URL or take a photo
2. **Get an eco-score** based on materials, sourcing, and carbon footprint
3. **See greener alternatives** from partner brands
4. **Earn points** for sustainable purchases
5. **Pledge points** to your chosen climate NGO
6. **Weekly batch** sends funds to all NGOs, verified on-chain
7. **Claim Impact Certificate** — permanent, soulbound proof of your contribution

---

## Impact Certificates (Soulbound Badges)

Users can optionally "burn" their contributed points to receive a **soulbound (non-transferable) certificate** proving their environmental impact.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         IMPACT CERTIFICATE                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ECOSCORE IMPACT CERTIFICATE                                                │
│   ════════════════════════════                                               │
│                                                                              │
│   Holder:      alice.sol                                                     │
│   Impact:      Funded $25.00 to Ocean Cleanup                                │
│   CO2 Offset:  ~5 kg equivalent                                              │
│   Date:        2026-01-31                                                    │
│   Batch Tx:    5Xb86XGb4yqD1Xp...                                           │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │  SOULBOUND: This certificate is non-transferable.                  │    │
│   │  It proves YOU took this action, not that you bought it.           │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Why Soulbound (Non-Transferable)?

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   IF certificates were TRANSFERABLE:                                        │
│   • Rich people could BUY "impact reputation" from others                   │
│   • Creates a market for greenwashing                                       │
│   • Certificate proves you PAID, not that you ACTED                        │
│                                                                              │
│   BECAUSE certificates are SOULBOUND:                                       │
│   • Tied to YOUR wallet forever                                             │
│   • Proves YOU captured products and pledged points                        │
│   • Builds genuine reputation over time                                    │
│   • Can't be bought, only earned                                           │
│                                                                              │
│   Think of it like a diploma — you can't sell your degree to someone else. │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### The "Burn" Mechanism

When a user claims a certificate, their points are permanently consumed:

| Before | After |
|--------|-------|
| Points: 5,000 | Points: 0 |
| Certificates: 0 | Certificates: 1 (permanent, on-chain) |

The points are GONE. In their place: **permanent, verifiable proof of impact** that the user owns forever.

**Note:** Impact Certificates are Phase 2. The escrow and batch disbursement system (Phase 1) is fully implemented.

---

## Quick Start

### Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.32.1
avm use 0.32.1

# Install dependencies
yarn install
```

### Build & Test

```bash
# Build the program
anchor build

# Run all tests (starts local validator automatically)
anchor test
```

### Expected Output

```
ecoscore_donation
  initialize
    ✔ initializes the escrow system
    ✔ fails to initialize twice
  deposit
    ✔ allows sponsors to deposit SOL
    ✔ allows multiple deposits
    ✔ fails for zero amount deposits
  add_ngo
    ✔ allows admin to add NGOs
    ✔ fails when non-admin tries to add NGO
    ✔ fails when adding duplicate NGO
  batch_disburse
    ✔ processes batch disbursement to multiple NGOs
    ✔ fails to process same week twice
    ✔ applies pro-rata when pledges exceed vault balance
    ✔ fails with empty batch
    ✔ fails when NGO account doesn't match allocation
    ✔ fails when non-admin tries to batch disburse
  remove_ngo
    ✔ allows admin to deactivate an NGO
    ✔ fails to batch disburse to deactivated NGO
  get_status
    ✔ returns current escrow status via logs

17 passing
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           WEEKLY BATCH FLOW                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DURING THE WEEK (Off-Chain)                                                 │
│  ────────────────────────────                                                │
│                                                                              │
│  ┌─────────┐   points    ┌─────────────────┐                                │
│  │  User   │────────────▶│    Database     │                                │
│  │ pledges │             │  accumulates    │                                │
│  └─────────┘             │  pledges per    │                                │
│                          │     NGO         │                                │
│                          └────────┬────────┘                                │
│                                   │                                          │
│  ══════════════════════════════════════════════════════════════════════════  │
│                                   │                                          │
│  END OF WEEK (On-Chain)           ▼                                          │
│  ──────────────────────   ┌───────────────┐                                 │
│                           │ batch_disburse│                                 │
│  ┌─────────────────┐      │  transaction  │                                 │
│  │  Escrow Vault   │─────▶│               │                                 │
│  │  (PDA - no key) │      └───────┬───────┘                                 │
│  └─────────────────┘              │                                          │
│                                   │                                          │
│         ┌─────────────────────────┼─────────────────────────┐               │
│         │                         │                         │               │
│         ▼                         ▼                         ▼               │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
│  │   Ocean     │          │  Rainforest │          │   Climate   │          │
│  │   Cleanup   │          │  Alliance   │          │    Fund     │          │
│  │   1.25 SOL  │          │   0.75 SOL  │          │   0.50 SOL  │          │
│  └─────────────┘          └─────────────┘          └─────────────┘          │
│                                                                              │
│  ONE transaction • ALL NGOs funded • Publicly verifiable                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Program Instructions

| Instruction | Who | What | Solana Feature Used |
|-------------|-----|------|---------------------|
| `initialize` | Admin | Create escrow system | PDA (verified ownership) |
| `deposit` | Sponsors | Add funds to vault | Low fees (brand deposits) |
| `add_ngo` | Admin | Whitelist NGO wallet | Transparent logic (on-chain registry) |
| `batch_disburse` | Admin | Weekly payout to all NGOs | Instant payments + low fees |
| `get_status` | Anyone | View totals | Transparent logic (public data) |

---

## Demo Walkthrough

### 1. Brand Deposits Funds

```typescript
// Patagonia deposits 5 SOL to fund user rewards
await program.methods
  .deposit(new BN(5 * LAMPORTS_PER_SOL))
  .accounts({
    sponsor: patagoniaWallet.publicKey,
    config: configPda,
    escrowVault: escrowVaultPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([patagoniaWallet])
  .rpc();

// Transaction confirmed in 400ms
// Funds now in PDA vault (no human can access)
```

### 2. Users Pledge Points (Off-Chain)

```javascript
// In your backend/database
await db.pledges.create({
  userId: "alice",
  ngo: "Ocean Cleanup",
  points: 2500,
  week: 202605,
});
```

### 3. Weekly Batch Executes (On-Chain)

```typescript
// Sunday night cron job
const allocations = await db.pledges.aggregate({ week: 202605 });
// Result: [{ ngo: oceanPubkey, points: 50000 }, { ngo: rainforestPubkey, points: 30000 }]

await program.methods
  .batchDisburse(
    new BN(202605),
    allocations.map(a => ({ ngo: a.ngo, pointsPledged: new BN(a.points) }))
  )
  .accounts({...})
  .remainingAccounts(allocations.map(a => ({ pubkey: a.ngo, isWritable: true, isSigner: false })))
  .rpc();

// 400ms later: All NGOs have received funds
// BatchDisburseEvent emitted with full breakdown
```

### 4. Anyone Verifies

```
Solana Explorer: https://explorer.solana.com/tx/[signature]?cluster=devnet

Transaction Details:
✓ Program: Ff9wbBku1gd8wEoXej6YMxqiyw6eUEGqzCJBNLoHzTqv
✓ Instruction: batch_disburse
✓ Transfers:
  - Ocean Cleanup: 2.5 SOL
  - Rainforest Alliance: 1.5 SOL
  - Climate Action Fund: 1.0 SOL
✓ Timestamp: 2026-02-02 00:00:00 UTC
```

---

## Security Features

| Protection | How It Works |
|------------|--------------|
| **No private key** | Vault is PDA — mathematically impossible to steal |
| **Admin-only disbursement** | On-chain constraint checks signer |
| **NGO whitelist** | Must be registered before receiving funds |
| **Week deduplication** | Can't process same week twice |
| **Pro-rata fairness** | If underfunded, everyone gets proportional share |
| **Overflow protection** | All math uses checked_add() |

---

## Deployed Program

| Network | Program ID | Status |
|---------|------------|--------|
| Devnet | `Ff9wbBku1gd8wEoXej6YMxqiyw6eUEGqzCJBNLoHzTqv` | Deployed |
| Mainnet | — | Not yet |

---

## Project Structure

```
ecoscore_donation/
├── programs/ecoscore_donation/src/
│   └── lib.rs              # Solana program (Rust)
├── tests/
│   └── ecoscore_donation.ts # Integration tests
├── target/
│   ├── deploy/             # Compiled .so binary
│   └── idl/                # TypeScript types
├── Anchor.toml             # Configuration
├── ARCHITECTURE.md         # Deep technical docs
└── README.md               # This file
```

---

## Conversion Rates

```
Points → SOL:
• 100 points = $1 = 0.01 SOL (at $100/SOL)
• 1,000 points = 0.1 SOL (~$10)
• Minimum pledge: 500 points ($5)

Formula: lamports = points × 100,000,000 / 1,000
```

---

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Escrow vault (PDA) | Deployed |
| 1 | Sponsor deposits | Deployed |
| 1 | NGO whitelist management | Deployed |
| 1 | Weekly batch disbursement | Deployed |
| 1 | Pro-rata distribution | Deployed |
| 2 | Soulbound Impact Certificates | Designed |
| 2 | Metaplex NFT integration | Planned |
| 3 | ECO Token (SPL) | Planned |
| 3 | Governance voting | Planned |

---

## Key Design Decisions Summary

| Decision | Choice | Why |
|----------|--------|-----|
| Where do points live? | **Database** | No wallet friction, instant UX, free |
| Where do donations live? | **Solana** | Trustless, verifiable, immutable |
| Individual vs batch redemption? | **Weekly batch** | Lower costs, consolidated NGO payments |
| Transferable vs soulbound certificates? | **Soulbound** | Proves action, not wealth |
| Full on-chain vs hybrid? | **Hybrid** | 99% don't need crypto, 100% verifiable |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Deep technical design, account structures, security model |
| [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) | Database schemas, API contracts, integration guide |

---

Built for the Solana ecosystem. Leveraging speed, low fees, and transparency to make sustainability donations trustless and verifiable.
