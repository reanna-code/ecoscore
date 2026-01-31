# Frontend Integration Guide

This document provides everything frontend developers need to integrate with the Ecoscore Solana donation system.

---

## Overview: What the Frontend Needs to Do

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND RESPONSIBILITIES                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. TRACK ECOPOINTS (Database)                                               │
│     • Store user points in your database                                     │
│     • Award points when users scan sustainable products                     │
│     • Deduct points when users pledge to NGOs                               │
│                                                                              │
│  2. MANAGE PLEDGES (Database)                                                │
│     • Let users choose an NGO to support                                    │
│     • Store pending pledges until weekly batch                              │
│                                                                              │
│  3. DISPLAY DONATIONS (Read from Solana)                                     │
│     • Show completed donations with Solana Explorer links                   │
│     • Display total impact metrics                                          │
│                                                                              │
│  4. WEEKLY BATCH (Backend Cron Job)                                          │
│     • Aggregate pledges per NGO                                             │
│     • Call Solana program                                                   │
│     • Store transaction receipt                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Required Tables

```sql
-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user accounts and their current point balance

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255),
    points_balance  INTEGER DEFAULT 0,           -- Current spendable points
    points_earned   INTEGER DEFAULT 0,           -- Lifetime points earned
    wallet_address  VARCHAR(44),                 -- Optional: Solana wallet pubkey
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- NGOS TABLE
-- ============================================================================
-- Whitelisted NGOs that can receive donations
-- NOTE: Must match the on-chain NGO registry!

CREATE TABLE ngos (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,        -- Must match on-chain name
    wallet_address  VARCHAR(44) UNIQUE NOT NULL, -- Solana pubkey (44 chars base58)
    description     TEXT,
    logo_url        VARCHAR(255),
    website_url     VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PLEDGES TABLE
-- ============================================================================
-- User pledges waiting for weekly batch processing

CREATE TABLE pledges (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    ngo_id          INTEGER REFERENCES ngos(id),
    points          INTEGER NOT NULL,            -- Points pledged
    week_number     INTEGER NOT NULL,            -- YYYYWW format (e.g., 202605)
    status          VARCHAR(20) DEFAULT 'pending', -- pending, processed, failed
    created_at      TIMESTAMP DEFAULT NOW(),

    CONSTRAINT positive_points CHECK (points >= 1000) -- Minimum 1000 points
);

-- Index for weekly batch processing
CREATE INDEX idx_pledges_week_status ON pledges(week_number, status);

-- ============================================================================
-- BATCH_RECEIPTS TABLE
-- ============================================================================
-- On-chain transaction receipts for completed batches

CREATE TABLE batch_receipts (
    id                  SERIAL PRIMARY KEY,
    week_number         INTEGER UNIQUE NOT NULL,
    tx_signature        VARCHAR(88) NOT NULL,     -- Solana tx signature
    total_points        INTEGER NOT NULL,         -- Total points processed
    total_lamports      BIGINT NOT NULL,          -- Total lamports disbursed
    total_sol           DECIMAL(18, 9) NOT NULL,  -- Human-readable SOL amount
    ngos_count          INTEGER NOT NULL,         -- Number of NGOs that received funds
    pro_rata_percent    DECIMAL(5, 2),            -- If < 100%, pledges were scaled down
    processed_at        TIMESTAMP DEFAULT NOW(),

    -- JSON array of per-NGO disbursement details
    disbursement_details JSONB
);

-- ============================================================================
-- POINT_TRANSACTIONS TABLE
-- ============================================================================
-- Audit log of all point changes

CREATE TABLE point_transactions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    amount          INTEGER NOT NULL,             -- Positive = earned, Negative = spent
    type            VARCHAR(20) NOT NULL,         -- 'scan', 'pledge', 'bonus', 'refund'
    reference_id    INTEGER,                      -- Related pledge_id or scan_id
    description     VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_user ON point_transactions(user_id, created_at);
```

### Prisma Schema (Alternative)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  name          String?
  pointsBalance Int       @default(0)
  pointsEarned  Int       @default(0)
  walletAddress String?   @db.VarChar(44)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  pledges       Pledge[]
  transactions  PointTransaction[]
}

model Ngo {
  id            Int       @id @default(autoincrement())
  name          String    @db.VarChar(64)
  walletAddress String    @unique @db.VarChar(44)
  description   String?
  logoUrl       String?
  websiteUrl    String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())

  pledges       Pledge[]
}

model Pledge {
  id          Int       @id @default(autoincrement())
  userId      Int
  ngoId       Int
  points      Int
  weekNumber  Int       // YYYYWW format
  status      String    @default("pending") // pending, processed, failed
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])
  ngo         Ngo       @relation(fields: [ngoId], references: [id])

  @@index([weekNumber, status])
}

model BatchReceipt {
  id                   Int       @id @default(autoincrement())
  weekNumber           Int       @unique
  txSignature          String    @db.VarChar(88)
  totalPoints          Int
  totalLamports        BigInt
  totalSol             Decimal   @db.Decimal(18, 9)
  ngosCount            Int
  proRataPercent       Decimal?  @db.Decimal(5, 2)
  disbursementDetails  Json?
  processedAt          DateTime  @default(now())
}

model PointTransaction {
  id          Int       @id @default(autoincrement())
  userId      Int
  amount      Int       // Positive = earned, Negative = spent
  type        String    // 'scan', 'pledge', 'bonus', 'refund'
  referenceId Int?
  description String?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}
```

---

## API Endpoints

### Points Management

```typescript
// POST /api/points/award
// Award points to a user (called after product scan)

interface AwardPointsRequest {
  userId: number;
  points: number;
  reason: string;  // e.g., "Scanned sustainable product: Bamboo Toothbrush"
}

interface AwardPointsResponse {
  success: boolean;
  newBalance: number;
  transaction: {
    id: number;
    amount: number;
    type: "scan";
  };
}
```

### Pledges

```typescript
// GET /api/ngos
// List all active NGOs

interface NgoResponse {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  totalReceived: number;  // From batch_receipts
  currentWeekPledges: number;  // Points pledged this week
}

// POST /api/pledges
// Create a new pledge

interface CreatePledgeRequest {
  userId: number;
  ngoId: number;
  points: number;  // Minimum 1000
}

interface CreatePledgeResponse {
  success: boolean;
  pledge: {
    id: number;
    points: number;
    ngoName: string;
    weekNumber: number;
    estimatedValue: number;  // In USD
  };
  newBalance: number;
}

// Validation rules:
// - points >= 1000 (minimum pledge)
// - points <= user.pointsBalance
// - ngo.isActive === true
```

### Donation History

```typescript
// GET /api/donations
// List completed donation batches

interface DonationHistoryResponse {
  batches: {
    weekNumber: number;
    date: string;
    totalSol: number;
    totalUsd: number;  // Based on SOL price at time
    ngosCount: number;
    txSignature: string;
    explorerUrl: string;  // https://explorer.solana.com/tx/...?cluster=devnet
    disbursements: {
      ngoName: string;
      amount: number;
      pointsFromUsers: number;
    }[];
  }[];
  totals: {
    allTimeSol: number;
    allTimeUsd: number;
    totalPointsRedeemed: number;
  };
}

// GET /api/donations/:weekNumber
// Get details for a specific batch

interface BatchDetailResponse {
  weekNumber: number;
  txSignature: string;
  explorerUrl: string;
  proRataPercent: number;  // 100 = full value, <100 = scaled down
  disbursements: {
    ngo: NgoResponse;
    pointsPledged: number;
    lamportsSent: number;
    solSent: number;
  }[];
  userContributions: {  // If user is authenticated
    ngoName: string;
    pointsPledged: number;
    percentOfTotal: number;
  }[];
}
```

---

## Weekly Batch Processing

### Cron Job Implementation

```typescript
// services/batch-processor.ts
// Run every Sunday at midnight: 0 0 * * 0

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { prisma } from "./prisma";

const PROGRAM_ID = new PublicKey("Ff9wbBku1gd8wEoXej6YMxqiyw6eUEGqzCJBNLoHzTqv");
const LAMPORTS_PER_1000_POINTS = 50_000_000; // 0.05 SOL per 1000 points

export async function processWeeklyBatch() {
  // 1. Calculate current week number (YYYYWW)
  const now = new Date();
  const weekNumber = getWeekNumber(now);

  // 2. Check if already processed
  const existing = await prisma.batchReceipt.findUnique({
    where: { weekNumber }
  });
  if (existing) {
    console.log(`Week ${weekNumber} already processed`);
    return;
  }

  // 3. Aggregate pledges by NGO
  const pledgesByNgo = await prisma.pledge.groupBy({
    by: ["ngoId"],
    where: {
      weekNumber,
      status: "pending"
    },
    _sum: { points: true }
  });

  if (pledgesByNgo.length === 0) {
    console.log(`No pledges for week ${weekNumber}`);
    return;
  }

  // 4. Build allocations array for Solana
  const ngos = await prisma.ngo.findMany({
    where: {
      id: { in: pledgesByNgo.map(p => p.ngoId) }
    }
  });

  const allocations = pledgesByNgo.map(p => {
    const ngo = ngos.find(n => n.id === p.ngoId)!;
    return {
      ngo: new PublicKey(ngo.walletAddress),
      pointsPledged: p._sum.points!
    };
  });

  // 5. Call Solana program
  const connection = new Connection(process.env.SOLANA_RPC_URL!);
  const adminKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.ADMIN_KEYPAIR!))
  );

  // ... setup provider and program ...

  const tx = await program.methods
    .batchDisburse(weekNumber, allocations)
    .accounts({...})
    .remainingAccounts(allocations.map(a => ({
      pubkey: a.ngo,
      isWritable: true,
      isSigner: false
    })))
    .rpc();

  // 6. Calculate totals
  const totalPoints = allocations.reduce((sum, a) => sum + a.pointsPledged, 0);
  const totalLamports = (totalPoints * LAMPORTS_PER_1000_POINTS) / 1000;

  // 7. Store receipt
  await prisma.batchReceipt.create({
    data: {
      weekNumber,
      txSignature: tx,
      totalPoints,
      totalLamports,
      totalSol: totalLamports / 1e9,
      ngosCount: allocations.length,
      proRataPercent: 100, // Will be less if vault was underfunded
      disbursementDetails: allocations.map(a => ({
        ngo: a.ngo.toString(),
        points: a.pointsPledged,
        lamports: (a.pointsPledged * LAMPORTS_PER_1000_POINTS) / 1000
      }))
    }
  });

  // 8. Mark pledges as processed
  await prisma.pledge.updateMany({
    where: { weekNumber, status: "pending" },
    data: { status: "processed" }
  });

  console.log(`Processed week ${weekNumber}: ${tx}`);
}

function getWeekNumber(date: Date): number {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return year * 100 + week; // e.g., 202605
}
```

---

## Conversion Rates

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         POINTS TO SOL CONVERSION                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Points      Lamports              SOL            USD (at $100/SOL)         │
│   ──────────────────────────────────────────────────────────────────         │
│   1,000   →   50,000,000        →   0.05      →   $5.00                      │
│   5,000   →   250,000,000       →   0.25      →   $25.00                     │
│   10,000  →   500,000,000       →   0.50      →   $50.00                     │
│   100,000 →   5,000,000,000     →   5.00      →   $500.00                    │
│                                                                              │
│   Formula: lamports = points × 50,000,000 / 1,000                            │
│            sol = lamports / 1,000,000,000                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// Utility functions

export function pointsToLamports(points: number): number {
  return (points * 50_000_000) / 1000;
}

export function pointsToSol(points: number): number {
  return pointsToLamports(points) / 1e9;
}

export function solToUsd(sol: number, solPrice: number = 100): number {
  return sol * solPrice;
}

export function pointsToUsd(points: number, solPrice: number = 100): number {
  return solToUsd(pointsToSol(points), solPrice);
}
```

---

## NGO Synchronization

### Important: Keep DB in Sync with On-Chain Registry

The NGOs in your database **must match** the on-chain NGO registry. When adding a new NGO:

1. **First** add to Solana (via admin calling `add_ngo`)
2. **Then** add to your database

```typescript
// Admin endpoint to add NGO (requires admin auth)
// POST /api/admin/ngos

async function addNgo(name: string, walletAddress: string) {
  // 1. Call Solana program
  await program.methods
    .addNgo(new PublicKey(walletAddress), name)
    .accounts({...})
    .rpc();

  // 2. Add to database
  await prisma.ngo.create({
    data: {
      name,
      walletAddress,
      isActive: true
    }
  });
}
```

### Current Whitelisted NGOs on Devnet

```typescript
// As of deployment, these NGOs are registered:

const REGISTERED_NGOS = [
  {
    name: "Demo Climate Fund",
    wallet: "46LWMkDrDxX5CLRqvwrkn5tcVikpVqQ6L97rtHCbiFsX"
  }
  // Add more as you register them
];
```

---

## UI Components Needed

### Pledge Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  DONATE YOUR ECOPOINTS                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your Balance: 5,000 points (~$25.00)                          │
│                                                                 │
│  Choose an NGO:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ 🌊 Ocean Cleanup                                      │   │
│  │   Fighting ocean plastic pollution                      │   │
│  │   2,340 points pledged this week                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ○ 🌳 Rainforest Alliance                                │   │
│  │   Protecting tropical forests                           │   │
│  │   1,890 points pledged this week                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ● 🌍 Climate Action Fund                                │   │
│  │   Funding renewable energy projects                     │   │
│  │   3,210 points pledged this week                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Points to pledge: [____2,500____]                             │
│                                                                 │
│  ≈ $12.50 donation value                                       │
│                                                                 │
│  [ Pledge to Climate Action Fund ]                             │
│                                                                 │
│  ℹ️ Donations are processed every Sunday at midnight            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Donation History

```
┌─────────────────────────────────────────────────────────────────┐
│  DONATION HISTORY                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Total Impact: $1,247.50 donated to 5 NGOs                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Week of Jan 26, 2026                                    │   │
│  │                                                         │   │
│  │ $125.00 sent to 3 NGOs                                 │   │
│  │ • Ocean Cleanup: $50.00 (10,000 pts)                   │   │
│  │ • Rainforest: $45.00 (9,000 pts)                       │   │
│  │ • Climate Fund: $30.00 (6,000 pts)                     │   │
│  │                                                         │   │
│  │ [View on Solana Explorer ↗]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Week of Jan 19, 2026                                    │   │
│  │ ...                                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```bash
# .env.local (Frontend)

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=Ff9wbBku1gd8wEoXej6YMxqiyw6eUEGqzCJBNLoHzTqv

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

```bash
# .env (Backend)

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecoscore

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
ADMIN_KEYPAIR=[...] # JSON array of secret key bytes

# Batch processing
LAMPORTS_PER_1000_POINTS=50000000
MIN_PLEDGE_POINTS=1000
```

---

## Checklist for Frontend Team

- [ ] Set up database with schema above
- [ ] Implement user points balance tracking
- [ ] Create pledge UI with NGO selection
- [ ] Implement `/api/pledges` endpoint
- [ ] Create donation history page
- [ ] Set up weekly cron job for batch processing
- [ ] Add Solana Explorer links to completed donations
- [ ] Sync NGO list with on-chain registry

---

## Understanding Solana Explorer Display

### "Unknown Instruction" - What It Means

When viewing transactions on Solana Explorer, you may see **"Unknown Instruction"** instead of decoded instruction names like `batchDisburse`. This is normal for custom programs.

**Why this happens:**
- Solana Explorer can only decode instructions for programs with a published IDL (Interface Definition Language)
- Publishing to Anchor's on-chain registry requires additional setup
- This is a cosmetic issue only - the transactions are fully valid and verifiable

**What users CAN still see without the IDL:**
- Transaction status (success/failure)
- All account addresses involved (including NGO wallets)
- SOL amounts transferred
- Timestamps and signatures

### Displaying NGO Names in the Frontend

Even though Explorer shows raw addresses, your frontend should map addresses to human-readable names:

```typescript
// services/transaction-display.ts

// Map on-chain addresses to NGO names (keep synced with your DB)
const NGO_ADDRESS_MAP: Record<string, string> = {
  "46LWMkDrDxX5CLRqvwrkn5tcVikpVqQ6L97rtHCbiFsX": "Demo Climate Fund",
  "7aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789AbCdEf": "Ocean Cleanup",
  // Add more as you register them
};

export function formatTransactionForDisplay(receipt: BatchReceipt) {
  const disbursements = (receipt.disbursementDetails as any[]).map(d => ({
    ngoAddress: d.ngo,
    ngoName: NGO_ADDRESS_MAP[d.ngo] || `Unknown (${d.ngo.slice(0, 8)}...)`,
    points: d.points,
    solAmount: d.lamports / 1e9,
    explorerUrl: `https://explorer.solana.com/address/${d.ngo}?cluster=devnet`
  }));

  return {
    weekNumber: receipt.weekNumber,
    transactionUrl: `https://explorer.solana.com/tx/${receipt.txSignature}?cluster=devnet`,
    totalSol: receipt.totalSol,
    disbursements
  };
}
```

### User-Facing Transaction Links

Always provide Solana Explorer links so users can verify donations independently:

```typescript
// components/DonationReceipt.tsx

interface DonationReceiptProps {
  txSignature: string;
  ngoName: string;
  amount: number;
  cluster?: "devnet" | "mainnet-beta";
}

export function DonationReceipt({ txSignature, ngoName, amount, cluster = "devnet" }: DonationReceiptProps) {
  const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=${cluster}`;

  return (
    <div className="donation-receipt">
      <h3>Donation Confirmed</h3>
      <p>{amount.toFixed(4)} SOL sent to {ngoName}</p>
      <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
        View on Solana Explorer ↗
      </a>
      <p className="helper-text">
        On Explorer, look for the account that received funds -
        that's the NGO wallet address.
      </p>
    </div>
  );
}
```

### What Users See on Explorer (Guide for UI Help Text)

Include this in your UI to help users understand the Explorer view:

```
┌─────────────────────────────────────────────────────────────────┐
│  HOW TO VERIFY YOUR DONATION ON SOLANA EXPLORER                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Click the transaction link to open Solana Explorer          │
│                                                                 │
│  2. Look for "Account Input(s)" section                         │
│     • Your pledge was part of a batch to this NGO wallet       │
│                                                                 │
│  3. Check "SOL Balance Change"                                  │
│     • Shows exactly how much SOL the NGO received              │
│                                                                 │
│  4. The instruction may show as "Unknown Instruction"           │
│     • This is normal for custom programs                       │
│     • The transaction is still fully valid and verified        │
│                                                                 │
│  ℹ️ All donations are permanently recorded on Solana blockchain │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Questions?

Coordinate with the Solana team (this repo) on:
- Adding new NGOs to the on-chain whitelist
- Adjusting the points-to-SOL conversion rate
- Running test transactions on devnet
