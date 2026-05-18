# Production Continuation Pack - Deployment Guide

This guide covers the production continuation pack that adds real data providers, signal persistence, contract integration, and API monetization to Language.fi.

## Overview

The production continuation pack adds:

1. **Real Data Providers** - Gate.io, DexScreener, Solana RPC
2. **Signal Persistence** - Database model for velocity/acceleration signals
3. **Contract Wiring** - Mint and staking contract integration
4. **API Monetization** - Stripe billing and API key enforcement

## Architecture

```
Data Providers → Ingestion Pipeline → Oracle → Signals → Contracts → Billing
     ↓                  ↓              ↓          ↓         ↓         ↓
  Gate.io          Worker        Signals    Signal DB   LGU     Stripe
  DexScreener      Pipeline      Engine    Persist   Staking  API Keys
  Solana RPC
```

## Installation

### 1. Install Dependencies

```bash
npm install ethers stripe zod @types/node
npm install -D typescript @types/node
```

### 2. Database Migration

Add the Signal model to your Prisma schema:

```prisma
model Signal {
  id           String   @id @default(cuid())
  symbol       String
  source       String
  value        Float
  velocity     Float?
  acceleration Float?
  confidence   Float?
  createdAt    DateTime @default(now())
  
  @@index([symbol])
  @@index([source])
  @@index([createdAt])
}
```

Run migration:

```bash
npx prisma migrate dev --name add_signal_model
npx prisma generate
```

### 3. Environment Configuration

Update your `.env` file with the new variables:

```bash
# Data Providers
GATEIO_API_BASE=https://api.gateio.ws/api/v4
SOLANA_RPC_URL=
ETHEREUM_RPC_URL=
BASE_RPC_URL=

# Oracle & Contracts
ORACLE_PRIVATE_KEY=
NEXT_PUBLIC_LGU_CONTRACT=
NEXT_PUBLIC_STAKING_CONTRACT=
CHAIN_ID=1

# Stripe Billing
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# API Keys
DEXSCREENER_API_BASE=https://api.dexscreener.com/latest/dex
ETHERSCAN_API_KEY=
BASESCAN_API_KEY=
HELIUS_API_KEY=
BIRDEYE_API_KEY=
ALCHEMY_API_KEY=
MORALIS_API_KEY=
COVALENT_API_KEY=
NEWS_API_KEY=
NYT_API_KEY=
```

## Component Overview

### 1. Real Data Providers

**Files:**
- `packages/providers/gateio.provider.ts` - Gate.io token data
- `packages/providers/dexscreener.provider.ts` - DEX pair data
- `packages/providers/solana.provider.ts` - Solana RPC slot data

**Usage:**
```typescript
import { fetchGateTokens } from "@languagefi/providers/gateio.provider"
import { fetchDexPairs } from "@languagefi/providers/dexscreener.provider"
import { fetchSolanaSlots } from "@languagefi/providers/solana.provider"

const gate = await fetchGateTokens()
const dex = await fetchDexPairs()
const sol = await fetchSolanaSlots()
```

### 2. Signal Persistence

**Files:**
- `packages/db/schema.prisma` - Signal model
- `packages/oracle/signals.ts` - Signal computation and persistence

**Usage:**
```typescript
import { computeSignal, persistSignal } from "@languagefi/oracle/signals"

// Compute signal from price history
const signal = computeSignal([10, 12, 15, 14, 16])
// Returns: { velocity: 2, acceleration: 1, side: "long" }

// Persist to database
await persistSignal("ETH", [10, 12, 15, 14, 16])
```

### 3. Contract Integration

**Files:**
- `packages/web3/mint.ts` - LGU mint integration
- `packages/web3/stake.ts` - Sentence staking integration
- `packages/oracle/attestation.ts` - Oracle signature service

**Frontend Mint:**
```typescript
import { mintLGU } from "@languagefi/web3/mint"

await mintLGU({
  cid: "0x...",
  amount: "100",
  signature: "0x..."
})
```

**Backend Attestation:**
```typescript
import { signMint } from "@languagefi/oracle/attestation"

const signature = await signMint(
  "0x123...",
  "0xabc...",
  1000000000000000000
)
```

**Staking:**
```typescript
import { stakeSentence } from "@languagefi/web3/stake"

await stakeSentence("sentence-id-here")
```

### 4. API Monetization

**Files:**
- `packages/billing/stripe.ts` - Stripe integration
- `packages/billing/api-keys.ts` - API key enforcement

**Stripe Checkout:**
```typescript
import { createCheckoutSession } from "@languagefi/billing/stripe"

const session = await createCheckoutSession("user@example.com")
```

**API Key Enforcement:**
```typescript
import { validateApiKey } from "@languagefi/billing/api-keys"

// In API route
const key = req.headers.get("x-api-key")
await validateApiKey(key)
```

### 5. Worker Pipeline

**File:**
- `apps/workers/src/pipeline.ts` - Data ingestion and signal persistence

**Run Worker:**
```bash
cd apps/workers
npm run dev
```

**Or as cron job:**
```bash
*/5 * * * * cd /path/to/language-fi/apps/workers && npm run pipeline
```

## Deployment

### Vercel (Frontend)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy:

```bash
vercel --prod
```

### Railway/Render (Workers)

1. Connect repository to Railway/Render
2. Set environment variables
3. Deploy:

```bash
railway up
# or
render deploy
```

### Database

Use managed PostgreSQL:
- Neon (serverless)
- Supabase (managed)
- Railway (managed)

## Security Notes

**Critical:**
- Never commit `ORACLE_PRIVATE_KEY` to git
- Use environment variables for all secrets
- Rotate API keys regularly
- Use KMS for production private keys
- Enable rate limiting on API endpoints
- Use webhook signatures for Stripe

## Monitoring

### Key Metrics

- Data provider health
- Oracle run frequency
- Signal computation accuracy
- Contract transaction success rate
- API usage and billing
- Error rates by service

### Alerts

- Data provider failures
- Oracle run failures
- Contract transaction failures
- Stripe webhook failures
- API rate limit breaches

## Troubleshooting

### Data Provider Issues

**Gate.io returns empty array:**
- Check `GATEIO_API_BASE` is correct
- Verify API is accessible from your server
- Check rate limits

**DexScreener fails:**
- Verify query parameter is valid
- Check API status at dexscreener.com

**Solana RPC fails:**
- Verify `SOLANA_RPC_URL` is valid
- Check RPC endpoint is accessible
- Verify API key if using paid endpoint

### Signal Issues

**Signal computation returns null:**
- Ensure at least 3 price points
- Check price data is valid numbers
- Verify database connection

### Contract Issues

**Mint transaction fails:**
- Verify oracle signature is valid
- Check contract address is correct
- Ensure wallet has sufficient gas
- Verify CID is not already used

**Staking fails:**
- Verify sentence is registered
- Check contract address is correct
- Ensure user owns the sentence

### Billing Issues

**Stripe checkout fails:**
- Verify `STRIPE_SECRET_KEY` is valid
- Check `STRIPE_PRICE_ID` exists
- Verify success/cancel URLs are accessible

**API key validation fails:**
- Check key exists in database
- Verify usage limit not exceeded
- Ensure key is not expired

## Next Steps

1. Deploy to testnet first
2. Test full data ingestion pipeline
3. Verify signal computation
4. Test contract interactions with small amounts
5. Test Stripe checkout flow
6. Monitor for 24-48 hours
7. Deploy to mainnet

## Support

For issues or questions:
- Check logs in worker dashboard
- Review database for Signal records
- Verify contract events on Etherscan
- Check Stripe dashboard for payment events
