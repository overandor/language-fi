# Language.fi Protocol Specification

## Abstract

Language.fi is a public oracle that prices 43 linguistic primitives (26 letters, 10 numbers, 7 symbols) based on observable usage data from multiple sources. The protocol provides reproducible oracle runs with verifiable pricing, a public ledger for transparency, and anti-manipulation safeguards.

## 1. Overview

### 1.1 Canonical Product

Language.fi is a **public oracle** that prices 43 linguistic primitives from observable usage data, with reproducible oracle runs and a registry for composing word/sentence assets.

**Scope**:
- 26 letters (A-Z)
- 10 numbers (0-9)
- 7 symbols (SPACE, ., !, ?, -, _, @, #)

### 1.2 Architecture

```
Data Sources → Anti-Manipulation → Pricing Engine → Oracle Run → Public Ledger
```

## 2. Primitives

### 2.1 Definition

A **primitive** is the atomic unit of linguistic value in the Language.fi protocol.

### 2.2 Categories

**Letters**: A-Z (ranked 1-26)
**Numbers**: 0-9 (ranked 27-36)
**Symbols**: SPACE, ., !, ?, -, _, @, # (ranked 37-43)

### 2.3 Properties

- `symbol`: Character representation
- `type`: Category (letter, number, symbol)
- `price_lgu`: Price in LGU (Language Governance Units)
- `rank`: Position within category
- `usage_count`: Observed usage frequency

## 3. Pricing Computation

See `PRICING_FORMULA.md` for the formal formula.

**Final Price**:
```
price_final = (
    price_base * 0.4 +
    velocity * 0.15 +
    acceleration * 0.1 +
    source_diversity * 0.1 +
    entropy * 0.1 +
    correlation * 0.1 +
    rarity * 0.05
) * decay_factor
```

**Constraints**:
- `price_floor`: 0.01 LGU
- `price_cap`: 1.0 LGU

## 4. Registry Ownership

### 4.1 What Is Owned

**Registry ownership does NOT confer**:
- Trademark or copyright ownership
- Exclusive right to use language in real world
- Legal claim to linguistic content

**Registry ownership confers**:
- Protocol-native registry entry
- Right to compose word/sentence assets
- On-chain representation (when contracts deployed)
- Transferability within protocol

### 4.2 Composition

**Word**: `{primitive_1, primitive_2, ..., primitive_n}`
**Sentence**: `{word_1, word_2, ..., word_m}`

## 5. Oracle Verification

### 5.1 Oracle Run Components

- Input snapshot (SHA-256 hash)
- Normalization parameters
- Scoring formula (v1.0)
- Run hash (SHA-256 of all inputs)
- Signed attestation
- Timestamp

### 5.2 Public Ledger

Maintains:
- Timestamp of each run
- Source counts
- Primitive prices
- Previous run hash
- Current run hash
- Data sources used
- Signature
- Policy version

### 5.3 Verification

Check:
- Run hash matches inputs
- Signature is valid
- Chain integrity (current_run_hash == previous_run_hash)
- Sources in allowlist
- Anti-manipulation flags

## 6. Data Sources

### 6.1 Primary

- CoinGecko API (Tier 1, weight: 1.0)
- Gate.io API (Tier 2, weight: 0.8)
- CoinMarketCap API (Tier 1, weight: 1.0)

### 6.2 Secondary

- Newspaper articles (Tier 3, weight: 0.6)
- Medium articles (Tier 3, weight: 0.6)
- Wikipedia (Tier 3, weight: 0.6)

## 7. Anti-Manipulation

### 7.1 Safeguards

- Source weighting by quality tier
- Allowlist for approved sources
- Duplicate detection (content hashing)
- Anomaly detection (z-score, threshold: 3.0)
- Time-weighted smoothing (decay: 0.1/hour)
- Quarantine mode for suspicious sources

### 7.2 Quarantine Mode

When enabled:
- Quarantined sources rejected
- Manual review required
- Automatic flagging

## 8. On-Chain vs Off-Chain

### 8.1 Off-Chain (Current)

- Oracle pricing computation
- Data aggregation
- Anti-manipulation filtering
- Oracle ledger (public record)

### 8.2 On-Chain (Planned)

- Registry contract for word/sentence assets
- Asset ownership model
- Transfer rules
- Fee mechanism
- Emergency pause

## 9. Legal Positioning

### 9.1 No Investment Promise

Language.fi is a protocol for linguistic asset pricing, not an investment vehicle. No promises of:
- Price appreciation
- Financial returns
- Guaranteed liquidity
- Market stability

### 9.2 No Trademark Ownership

Registry owners do NOT own:
- Trademarks for words/sentences
- Copyright to linguistic content
- Exclusive real-world usage rights

### 9.3 Content Moderation

Prohibited:
- Slurs and hate speech
- Illegal content
- Trademarked names (without permission)
- Personal names (without consent)

## 10. API Endpoints

### 10.1 Oracle

- `GET /api/primitives` - All primitive prices
- `GET /api/primitives/<symbol>` - Specific primitive
- `GET /api/oracle/ledger` - Public ledger
- `GET /api/oracle/runs/latest` - Latest run
- `GET /api/oracle/runs/<run_id>` - Specific run
- `POST /api/oracle/runs/verify` - Verify run
- `GET /api/oracle/runs/history` - Historical runs

### 10.2 Verification

- `GET /api/verification/stats` - Verification stats
- `GET /api/verification/token/<symbol>` - Verify token
- `POST /api/verification/batch` - Batch verify

### 10.3 Data

- `GET /api/coingecko/markets` - CoinGecko data
- `GET /api/llm/insights` - LLM analysis
- `GET /api/signals` - Trading signals
- `GET /stream` - SSE live updates

## 11. Version

Protocol version: v1.0
Last updated: 2026-05-01
