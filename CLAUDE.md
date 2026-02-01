# Ecoscore — Solana Integration Specification

## Project Overview

Ecoscore is a sustainability-focused web application with two entry points:

1. **Online Shopping** — Users paste product URLs; a webscraper extracts product info and evaluates sustainability
2. **In-Store Shopping** — Users take photos of products/tags via mobile camera (processed by Gemini AI) to evaluate items while shopping in person

### Core Features
- **Sustainability Scoring** — Each product receives an eco-score based on materials, sourcing, carbon footprint, etc.
- **Alternative Recommendations** — Users see more sustainable alternatives from partnered brands (links to partner online stores)
- **Points System** — Users earn points based on how sustainable their final purchase is
- **Donation Mechanism** — Accumulated points translate to donations to climate/sustainability NGOs, funded by partnered brands

### Business Model
- Partner brands pay for product placement in recommendations
- Partner brands fund the donation pool proportional to user engagement
- All donations are publicly verifiable on-chain

---

## Current Status

| Component | Status |
|-----------|--------|
| Frontend | Vite + React UI implemented |
| Backend | Express + MongoDB API |
| Solana Program | `ecoscore_donation` deployed on devnet |
| Donation Flow | Pledges → Weekly batch → On-chain disbursement ✅ |
| Impact Certificates | NFT minting via Metaplex ✅ |
| Sponsor Wallets | Real Solana wallets with on-chain activity ✅ |

---

## Phase 1: Donation Escrow ✅ COMPLETE

### Purpose
Solana provides an immutable, public ledger for:
- Accepting sponsor/brand deposits
- Escrowing funds under program control
- Releasing funds to approved NGO wallets
- Emitting verifiable on-chain receipts

### Program Requirements

| Instruction | Description |
|-------------|-------------|
| `initialize` | Create escrow vault PDA, set admin |
| `deposit` | Sponsors transfer SOL/USDC into vault |
| `add_ngo` | Admin whitelists NGO wallet addresses |
| `disburse` | Transfer from vault to whitelisted NGO |

### Key Accounts
- **Escrow Vault** — PDA holding deposited funds
- **Config** — Stores admin pubkey, total deposited, total disbursed
- **NGO Registry** — List of approved recipient addresses

### Events to Emit
```
DepositEvent { sponsor, amount, timestamp }
DisburseEvent { ngo, amount, timestamp, memo }
BatchDisburseEvent { week_id, total_points, allocations[], timestamp }
```

---

## Phase 1.5: Impact Certificate NFTs ✅ COMPLETE

### Purpose
Provide users with **permanent, verifiable proof** of their climate impact via NFTs on Solana.

### Features
- **Custodial Wallets** — Auto-generate Solana wallet for users (stored in MongoDB)
- **NFT Minting** — Mint impact certificates via Metaplex to user's wallet
- **IPFS Storage** — Certificate images stored permanently on IPFS via Pinata
- **Social Sharing** — Share certificates on X (Twitter) and Instagram
- **Explorer Links** — View NFTs directly on Solana Explorer

### User Flow
```
User completes donation → Reaches milestone (e.g., $5)
        ↓
Click "Mint NFT" → Generate eco-themed certificate image
        ↓
Upload image to Pinata IPFS → Create metadata JSON
        ↓
Mint NFT via Metaplex (admin pays fees)
        ↓
User views NFT on Solana Explorer
        ↓
Share to social media (X/Instagram)
```

### Technical Stack
| Component | Technology |
|-----------|------------|
| NFT Standard | Metaplex Token Metadata |
| Image Storage | Pinata IPFS |
| Image Generation | Node Canvas (eco-themed landscape art) |
| Wallet Management | Custodial (keypairs in MongoDB) |

### Key Files
| Path | Purpose |
|------|---------|
| `server/src/services/nftService.js` | Metaplex minting logic |
| `server/src/services/ipfsService.js` | IPFS upload service |
| `server/src/routes/certificates.js` | NFT minting API endpoints |
| `src/components/donations/ImpactCertificate.tsx` | Certificate UI component |

---

## Phase 2: Eco-Token Economy (Future Extension)

Transform the escrow into a **coordination layer** for climate actions via a programmable SPL token.

### 2.1 Core Token Behaviors

| Feature | Description |
|---------|-------------|
| **Offset Certificates** | 1 token = 1 kg CO₂ avoided. Burn tokens → mint on-chain proof/receipt |
| **Carbon Credit Redemption** | Swap eco-tokens → fractionalized carbon/REC tokens → retire on-chain |
| **Access Tiers** | Token balance unlocks perks: discounts, transit passes, partner coupons |

### 2.2 Programmable Mechanics

| Feature | Description |
|---------|-------------|
| **Impact Staking** | Stake into pools that buy/retire carbon credits. APR = tokens + offset volume |
| **Reputation Layer** | Non-transferable eco-score from hold duration, streaks, usage patterns |
| **Governance** | Token holders vote on offset projects, local initiatives, reward multipliers |

### 2.3 Integration Points
- Mock or integrate existing Solana carbon tokens
- Soulbound badges via Metaplex or custom program
- Simple proposal + vote UI for hackathon demo

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│  Off-chain API   │────▶│  Solana Program │
│  - URL scraper  │     │  - User scores   │     │  - Escrow vault │
│  - Photo/URL    │     │  - Points calc   │     │  - Disburse     │
│  - Wallet conn  │     │  - Brand data    │     │  - Events       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Development Commands

```bash
# Check setup
solana --version && anchor --version
solana config get

# Build & test
anchor build
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get program ID
solana address -k target/deploy/ecoscore_donations-keypair.json
```

---

## Key Files

| Path | Purpose |
|------|---------|
| `programs/ecoscore_donations/src/lib.rs` | Program logic (Rust) |
| `Anchor.toml` | Config: cluster, wallet, program ID |
| `tests/ecoscore_donations.ts` | Integration tests (TypeScript) |
| `migrations/deploy.ts` | Deployment script |

---

## Glossary (For First-Time Solana Devs)

| Term | Definition |
|------|------------|
| **PDA** | Program Derived Address — deterministic address owned by the program, no private key |
| **Anchor** | Rust framework simplifying Solana program development |
| **SPL Token** | Solana's fungible token standard (like ERC-20) |
| **Escrow** | Funds held by program until release conditions met |
| **Instruction** | A function call to a Solana program |
| **Account** | On-chain data storage unit; programs read/write to accounts |