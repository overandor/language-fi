# Language.fi - Protocol-Grade Symbolic Asset Oracle

Production-grade oracle for symbolic asset pricing with deterministic calculations from real data sources.

## Architecture

**Monorepo Structure:**
```
/apps
  /web              → Next.js frontend (UI, dashboard)
  /api              → Next.js API routes
  /workers          → Ingestion + oracle jobs
  /artifact-service → Proof-of-Value Artifact minting service
  /artifact-ui      → Artifact upload and minting UI
/packages
  /db               → Prisma schema + client
  /providers        → External data ingestion
  /oracle           → Pricing engine
  /core             → Shared utilities
  /web3             → Smart contracts (LGU, LGUArtifact)
```

## Quick Start

### 1. Database Setup

```bash
# Set up PostgreSQL (Neon, Supabase, or self-hosted)
export DATABASE_URL="postgresql://user:password@host:port/dbname"

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/dbname"

# CoinGecko (optional but recommended)
COINGECKO_API_BASE="https://api.coingecko.com/api/v3"
COINGECKO_API_KEY="your-api-key"
```

### 4. Run Services

```bash
# Start web dashboard
cd apps/web && npm run dev

# Start ingestion worker
cd apps/workers && npm run dev
```

## Core Features

### Real Data Ingestion
- CoinGecko token listings (10,000+ cryptocurrencies)
- No simulated data - returns empty array on failure
- Continuous micro-snapshots every 5 minutes

### Deterministic Pricing
- Multi-factor formula: volume, source diversity, topic entropy, velocity, cross-source correlation
- Shannon entropy calculations for topic distribution
- Time derivatives (velocity, acceleration) for market dynamics

### Oracle Engine
- Depends ONLY on database data
- Audit trail via OracleRun records
- Reproducible calculations

### API Endpoints

**GET /api/primitives** - Current primitive prices
**POST /api/sentences/quote** - Calculate sentence value
**GET /dashboard** - Live pricing dashboard

## Proof-of-Value Artifact Minting

Production-safe artifact minting system that converts visual artifacts into LGU tokens through cryptographic verification.

**Key Features:**
- IPFS content-addressed storage (CID-based uniqueness)
- OCR and computer vision analysis
- Fraud detection via perceptual hashing
- Protocol-based scoring (not fiat conversion)
- Oracle cryptographic attestations
- Per-wallet caps and anti-farming rules

**Critical Design Principle**: No fiat linkage. This is a score → emission system, not a conversion system. LGU credits are non-redeemable and usable only within the protocol.

**Documentation**: See [apps/artifact-service/README.md](apps/artifact-service/README.md) for full details.

## Data Flow

1. **Ingestion** (every 5 min): Fetch from CoinGecko → Store RawObservation
2. **Counting**: Character counting with attribution (sources, topics, tokens)
3. **Oracle** (every 10 min): Calculate prices from PrimitiveCount
4. **API**: Serve prices from PrimitivePrice table

## Deployment

### Production Deployment Topology

```
Frontend (Next.js) → Vercel
Backend API → Vercel (serverless routes)
Worker / Oracle → Railway / Fly / local cron
Artifact service → Hugging Face (optional UI only)
Database → Postgres
Contracts → Base / Ethereum
Stripe → billing layer
```

### Quick Deployment

```bash
# Run setup script
./scripts/setup.sh

# Deploy to production
./scripts/deploy.sh
```

### Manual Deployment

#### Vercel (Web + API)

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Deploy
vercel --prod
```

Set environment variables in Vercel:
- DATABASE_URL
- ADMIN_SECRET
- CRON_SECRET
- COINGECKO_API_BASE
- GATEIO_API_BASE
- DEXSCREENER_API_BASE
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_APP_URL

#### Railway/Render (Worker/Oracle)

```bash
# Deploy worker
railway up
# or
render deploy
```

Worker runs independently from Vercel (not suitable for long-running ingestion).

#### Docker (Local/Production)

```bash
# Start with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Database

- **Neon**: Serverless PostgreSQL
- **Supabase**: Managed PostgreSQL
- **Self-hosted**: PostgreSQL 14+

### Security Checklist

Before production deployment:
- [ ] All secrets rotated (no hardcoded keys)
- [ ] .env not committed to git
- [ ] Backend-only key access verified
- [ ] Contract signer isolated
- [ ] Rate limits active
- [ ] CID replay protection enabled
- [ ] API key enforcement active
- [ ] Stripe webhook verified
- [ ] Security scans passing

### Production Continuation

The system includes:
- Real data providers (Gate.io, DexScreener, Solana RPC)
- Signal persistence (velocity, acceleration)
- Contract integration (mint, staking)
- API monetization (Stripe, API keys)

See [PRODUCTION_CONTINUATION_GUIDE.md](PRODUCTION_CONTINUATION_GUIDE.md) for details.

## System Value

With full implementation (10+ sources, oracle determinism, registry + staking):
- **Current**: $120K - $280K
- **Target**: $500K - $2M protocol-grade system

## License

MIT License
