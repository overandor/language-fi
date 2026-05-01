# Language.fi - Linguistic Primitive Oracle

Language.fi is a public oracle that prices 43 linguistic primitives (letters, numbers, spaces, symbols) from observable usage data, with reproducible oracle runs and a registry for composing word/sentence assets.

## Core Product

**What it is:**
- A pricing oracle for linguistic primitives (A-Z, 0-9, space, common symbols)
- Prices derived from real usage data across multiple data sources
- Reproducible oracle runs with cryptographic verification
- Registry for composing word/sentence assets from priced primitives

**What it is not:**
- Not a word ownership protocol (you don't own the word "apple")
- Not a trademark or copyright system
- Not an investment vehicle
- Not a fiat conversion system

## How It Works

1. **Data Collection**: Ingest usage data from multiple sources (Gate.io, DexScreener, Solana RPC, etc.)
2. **Normalization**: Apply consistent rules across all sources
3. **Pricing Formula**: Calculate primitive prices using a published formula
4. **Oracle Run**: Generate a cryptographically signed record with hash verification
5. **Public Ledger**: Store historical oracle runs for reproducibility
6. **Asset Composition**: Users can compose words/sentences from priced primitives

## Architecture

**Monorepo Structure:**
```
/apps
  /web              → Next.js frontend (UI, dashboard)
  /api              → Next.js API routes
  /workers          → Ingestion + oracle jobs
/packages
  /db               → Prisma schema + client
  /providers        → External data ingestion
  /oracle           → Pricing engine
  /core             → Shared utilities
  /web3             → Smart contracts (LGU, Staking)
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

## Legal Disclaimers

### Registry Ownership

**What you own when you register a word/sentence:**
- A protocol-native registry entry
- Right to compose assets from priced primitives
- On-chain representation (when contracts deployed)
- Transferability within the protocol

**What you do NOT own:**
- Trademark or copyright to the word/sentence
- Exclusive right to use the language in the real world
- Legal claim to the linguistic content
- Real-world trademark rights

### No Investment Promise

Language.fi is a protocol for linguistic asset pricing, NOT an investment vehicle. No promises of:
- Price appreciation
- Financial returns
- Guaranteed liquidity
- Market stability
- Profit or income

### Content Moderation

Prohibited content in registry:
- Slurs and hate speech
- Illegal content
- Trademarked names (without permission)
- Personal names (without consent)

Protocol reserves right to:
- Flag prohibited content
- Remove registry entries
- Quarantine suspicious registrations

### Risk Disclosure

Using Language.fi involves risks including but not limited to:
- Price volatility
- Technical failures
- Data source unavailability
- Smart contract vulnerabilities (when deployed)
- Regulatory changes

## License

MIT License
