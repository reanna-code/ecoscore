# Ecoscore

**Make every purchase count for the planet.**

Ecoscore is a sustainability companion that helps shoppers make eco-conscious decisions — whether browsing online or standing in a store aisle. Take a photo of any product, see its environmental impact, discover greener alternatives, and turn your sustainable choices into real donations to climate nonprofits. 

---

## The Problem

Consumers want to shop sustainably, but lack the tools to make informed decisions at the point of purchase. Greenwashing is everywhere, sustainability data is fragmented, and there's no reward for making the right choice.

## Our Solution

Ecoscore bridges the gap between intention and action:

1. **Capture or Search** — Paste a product URL or take photos in-store
2. **See the Impact** — Get an instant eco-score based on materials, sourcing, and carbon footprint
3. **Compare Alternatives** — Discover greener options from verified sustainable brands
4. **Earn Points** — Accumulate points based on the sustainability of your purchases
5. **Donate to NGOs** — Convert points into real donations to climate organizations. Donations are funded by partner brands

All donations are processed on the **Solana blockchain**, providing full transparency and public verifiability.

---

## Impact Certificates (Soulbound Badges)

Users can optionally claim a **soulbound (non-transferable) certificate** proving their environmental impact.

```
┌─────────────────────────────────────────────────────────────────┐
│  ECOSCORE IMPACT CERTIFICATE                                    │
│  ════════════════════════════                                   │
│                                                                 │
│  Holder:      alice.sol                                         │
│  Impact:      Funded $25.00 to Ocean Cleanup                    │
│  CO₂ Offset:  ~5 kg equivalent                                  │
│  Date:        2026-01-31                                        │
│  Batch Tx:    5Xb86XGb4yqD1Xp...                               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  SOULBOUND: This certificate is non-transferable.         │ │
│  │  It proves YOU took this action, not that you bought it.  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Why soulbound?** Transferable certificates create a market for greenwashing—rich people could buy "impact reputation" from others. Soulbound certificates prove *you* took the action. Like a diploma, you can't sell it to someone else.

---

## Why Solana?

| Feature | Benefit |
|---------|---------|
| **Low fees** (~$0.00025/tx) | Micro-rewards are viable; 100% of donations reach NGOs |
| **Fast finality** (400ms) | NGOs receive funds instantly, not days later |
| **PDA escrow** | Funds held by code, not a company—no private key exists |
| **On-chain receipts** | Every donation is publicly auditable forever |

---

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│  Ecoscore API    │────▶│ Solana Program  │
│                 │     │                  │     │                 │
│  • Photo/URL    │     │  • Product data  │     │  • Escrow vault │
│  • Or paste URL │     │  • Eco-scoring   │     │  • Donations    │
│  • View scores  │     │  • Points calc   │     │  • On-chain     │
│  • Donate       │     │  • Brand matches │     │    receipts     │
│  • Claim cert   │     │                  │     │  • Soulbound    │
│                 │     │                  │     │    certificates │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Hybrid design:** Points and user accounts live off-chain (instant, free, no wallet needed). Only actual donations and certificates go on-chain (trustless, permanent, verifiable). 99% of users never think about blockchain, but 100% of donations are publicly auditable.

---

## Tech Stack

**Frontend**
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Vite

**Blockchain**
- Solana (devnet)
- Anchor Framework
- SPL Token

---

## Business Model

Ecoscore creates a sustainable ecosystem where everyone wins:

- **Partner brands** pay for placement in recommendations → funds the donation pool
- **Users** earn points for sustainable choices → points convert to NGO donations
- **NGOs** receive verifiable, on-chain donations → full transparency
- **The planet** benefits from shifted consumer behavior at scale

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/ecoscore.git
cd ecoscore

# Install dependencies
npm install

# Start development server
npm run dev
```



### Solana Program

```bash
cd solana/ecoscore_donation

# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

---

## Team

Built with purpose and love at ElleHacks 2026.

---
