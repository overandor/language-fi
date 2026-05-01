# Language.fi Protocol Specification

## Abstract

Language.fi is a protocol-grade oracle that prices 43 linguistic primitives (letters, numbers, spaces, and symbols) based on observable usage data from multiple verified sources. The protocol enables reproducible pricing calculations, verifiable oracle runs, and a public registry for composing word and sentence assets.

## Core Product Statement

Language.fi is a public oracle that prices 43 linguistic primitives from observable usage data, with reproducible oracle runs and a registry for composing word/sentence assets.

## Primitives

### Definition

Primitives are the atomic units of the Language.fi protocol:
- **26 letters**: A-Z
- **10 numbers**: 0-9
- **7 symbols**: SPACE, ., !, ?, -, _, @, #

### Primitive Properties

Each primitive has:
- **Symbol**: The character (e.g., "A", "1", "SPACE")
- **Type**: letter, number, space, or symbol
- **Price**: Dynamic price in LGU (Language Governance Units)
- **Usage Count**: Total occurrences across all data sources
- **Rank**: Position by price (1-43)
- **Change**: 24-hour percentage change

### Primitive Pricing

Primitive prices are calculated deterministically from:
1. **Frequency**: Character occurrences across data sources
2. **Velocity**: Rate of change in usage
3. **Entropy**: Distribution diversity across sources
4. **Source Diversity**: Number of sources containing the character
5. **Cross-Source Correlation**: Consistency across sources
6. **Rarity**: Inverse of total usage
7. **Decay**: Time-weighted decay factor
8. **Volatility**: Standard deviation of usage over time

See [PRICING_FORMULA.md](./PRICING_FORMULA.md) for the complete formula.

## Oracle System

### Oracle Runs

The oracle runs periodically (every 10 minutes) to calculate primitive prices. Each run:

1. **Captures Input Snapshot**: Hash of all source data, primitive counts, source weights, timestamp
2. **Calculates Prices**: Using the deterministic pricing formula
3. **Generates Run Hash**: SHA-256 of input snapshot + formula version + previous run hash
4. **Creates Chain of Trust**: Each run references the previous run's hash
5. **Stores Audit Trail**: Complete record in public ledger

### Reproducibility

Every oracle run is reproducible:
- Same input data → Same output prices
- Same input hash → Same run hash
- Formula version tracked in each run
- Input snapshot stored for verification

### Verification

Users can verify oracle runs by:
1. Fetching the input snapshot from the ledger
2. Recalculating prices using the formula
3. Comparing the calculated hash with the published hash
4. Verifying the chain of trust (previous run hash)

## Data Sources

### Primary Sources

- **CoinGecko** (Tier 1, weight 0.40): Token names and symbols from cryptocurrency listings
- **CoinMarketCap** (Tier 1, weight 0.25): Token listings (when API key available)
- **Gate.io** (Tier 2, weight 0.20): Trading pair symbols
- **Blockchain Hashes** (Tier 3, weight 0.05): Sampled addresses and transaction hashes

### Source Quality Tiers

- **Tier 1** (multiplier 1.2): Verified APIs with high reliability (CoinGecko, CoinMarketCap)
- **Tier 2** (multiplier 1.0): Major exchanges (Gate.io, Binance)
- **Tier 3** (multiplier 0.8): Derived data sources (RSS feeds, social metadata)

### Source Weighting

- Single source cannot exceed 50% influence
- Minimum 3 sources required for production pricing
- Source weights reviewed quarterly
- Source diversity score (entropy across sources)

## Anti-Manipulation

### Protections

1. **Source Weighting**: Caps on single-source influence
2. **Deduplication**: Remove duplicate content within and across sources
3. **Anomaly Detection**: Z-score analysis (>3σ flagged for review)
4. **Usage Spike Detection**: >200% increase triggers manual review
5. **Time-Weighted Smoothing**: EMA over 7 periods to reduce noise
6. **Source Quality Tiers**: Lower-tier sources have reduced weight
7. **Manual Quarantine Mode**: Admin can flag sources for review

### Source Allowlist

Only verified sources are used in production pricing:
- Must have API documentation
- Must have rate limiting
- Must have uptime monitoring
- Must pass quality review

## Registry

### Registry Entries

The registry stores:
- **Sentence Hash**: SHA-256 of normalized text
- **Normalized Text**: Uppercase, normalized form
- **Owner Wallet**: Optional wallet address
- **Base Value**: Calculated from primitive prices
- **Status**: available, staked, locked
- **Timestamp**: Creation time

### Ownership Model

**Critical**: Registry ownership does NOT confer:
- Trademark rights
- Copyright ownership
- Exclusive right to use the word/sentence
- Legal ownership of the language itself

Registry ownership confers:
- Protocol-native asset representation
- Transferable registry entry
- On-chain record of creation
- Formula value calculation
- Ability to compose with other assets

### Transfer Rules

- Registry entries can be transferred between wallets
- Transfers reset "stillness" mining score (if implemented)
- Transfer history recorded in registry
- No claim to external rights

## On-Chain vs Off-Chain

### Off-Chain Components

- Oracle pricing calculations
- Data source ingestion
- Character counting
- Pricing formula execution
- Registry database
- API endpoints

### On-Chain Components (Planned)

- Registry contract for sentence ownership
- Transfer functionality
- Staking mechanism (if implemented)
- Governance token (if implemented)

### Current State

The protocol is currently **off-chain only**:
- Oracle runs off-chain
- Registry stored in PostgreSQL database
- No smart contracts deployed
- No on-chain assets

## Asset Model

### Primitive Assets

Primitives are **not** transferable assets. They are:
- Oracle outputs
- Pricing inputs for word/sentence composition
- Protocol primitives (not NFTs)

### Word Assets

Words are **composable value objects**:
- Value derived from primitive prices
- Formula-based valuation
- Can be minted as registry entries
- Transferable as registry entries

### Sentence Assets

Sentences are **registered transferable assets**:
- Unique hash-based identification
- Formula value from character composition
- Transferable registry entry
- Ownership recorded in protocol registry

## Economic Purpose

### Utility

Primitives provide utility for:
- **API Access**: Query oracle for current prices
- **Word Composition**: Calculate value from character inputs
- **Sentence Minting**: Create registered assets
- **Cultural Analysis**: Track language usage trends
- **Linguistic Prediction**: Predict character demand
- **Data Licensing**: Derived data products

### No Investment Promise

The protocol does NOT guarantee:
- Price appreciation
- Market value
- Trading profits
- Investment returns
- Financial returns

## Legal Positioning

### No Trademark Claims

Language.fi explicitly does NOT claim:
- Ownership of words or phrases
- Trademark rights to registered entries
- Exclusive use of any language
- Copyright over ordinary language

### Registry Entry vs Word Ownership

**Registry Entry**:
- Protocol-native representation
- Transferable within protocol
- On-chain record (if deployed)
- Formula-based valuation

**Word Ownership**:
- NOT claimed by protocol
- Remains in public domain
- No exclusive rights conferred
- No trademark rights conferred

### Content Moderation

The protocol reserves the right to:
- Refuse registry of slurs, hate speech, illegal content
- Quarantine sources that violate terms
- Remove entries that violate policies
- Implement content filters

### Personal Names

Personal names may be registered but:
- No claim to identity ownership
- No impersonation rights
- No legal name control
- Protocol-native representation only

## Governance

### Current Governance

Protocol is **centrally operated**:
- Oracle runs by protocol operators
- Source weights set by protocol
- Anti-manipulation rules enforced by protocol
- Registry managed by protocol

### Future Governance (Planned)

- Decentralized oracle verification
- Community governance for source weights
- Token-based voting on parameters
- Multi-sig for critical changes

## Security

### Oracle Security

- Reproducible calculations
- Chain of trust via hash chaining
- Public audit trail
- Signature verification (future)
- Formula versioning

### Data Security

- HTTPS for all API calls
- Rate limiting
- Input validation
- SQL injection prevention
- Secrets management

### Anti-Gaming

- Source quality tiers
- Deduplication
- Anomaly detection
- Usage spike detection
- Source weight caps
- Time-weighted smoothing

## API Endpoints

### Public Endpoints

- `GET /api/primitives` - Current primitive prices
- `GET /api/primitives/<symbol>` - Single primitive details
- `POST /api/sentences/quote` - Calculate sentence value
- `GET /api/oracle/ledger` - Historical oracle runs
- `GET /api/verification/stats` - Cross-source verification stats
- `GET /api/verification/token/<symbol>` - Single token verification
- `POST /api/verification/batch` - Batch token verification

### Admin Endpoints (Protected)

- `POST /api/oracle/run` - Trigger oracle run
- `POST /api/sources/quarantine` - Quarantine a source
- `GET /api/admin/anomalies` - View detected anomalies

## Deployment

### Current Deployment

- **Database**: PostgreSQL (Neon, Supabase, or self-hosted)
- **API**: Next.js on Vercel
- **Workers**: Node.js cron jobs (Railway, Render)
- **Frontend**: Next.js dashboard

### Environment Variables

```
DATABASE_URL=postgresql://...
COINGECKO_API_KEY=...
COINMARKETCAP_API_KEY=...
GATE_API_KEY=...
```

### Migration

Run database migrations:
```bash
npm run db:migrate
npm run db:generate
```

## Roadmap

### Phase 1: Foundation (Current)
- ✅ Monorepo architecture
- ✅ Prisma schema
- ✅ CoinGecko provider
- ✅ Character counting service
- ✅ Oracle price engine
- ✅ API routes
- ✅ Dashboard UI
- ✅ Reproducible oracle runs
- ✅ Public oracle ledger
- ✅ Anti-manipulation safeguards

### Phase 2: Production
- ⏳ Smart contract deployment
- ⏳ On-chain registry
- ⏳ Token staking
- ⏳ Governance token
- ⏳ Decentralized oracle verification

### Phase 3: Expansion
- ⏳ Additional data sources
- ⏳ Cross-chain support
- ⏳ Advanced pricing factors
- ⏳ Community governance
- ⏳ Data licensing products

## Disclaimer

Language.fi is an experimental protocol concept. Formula value is not market value. Registry ownership does not imply legal ownership of ordinary language. Not financial advice. Not investment advice. Use at your own risk.

## Version

Protocol Spec v1.0
Last Updated: May 1, 2026
