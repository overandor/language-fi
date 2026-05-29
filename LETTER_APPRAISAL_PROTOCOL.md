# Letter & Language Appraisal Protocol

## Overview

This protocol defines a systematic methodology for appraising the monetary value of individual letters, numbers, spaces, and symbols as tradable primitives within the Language.fi oracle system. Appraisals are based on usage frequency, source diversity, volatility, and market demand.

## Phase 1: Primitive Classification

### 1.1 Character Categories
- **Letters**: A-Z (26 characters)
- **Numbers**: 0-9 (10 characters)
- **Separators**: SPACE (1 character)
- **Symbols**: ., !, ?, -, _, @, # (8 characters, optional)

### 1.2 Primitive Metadata
Each primitive tracks:
- Symbol (character)
- Type (letter/number/separator/symbol)
- Current price (LGU - Language Governance Unit)
- 24h change percentage
- Weekly change percentage
- Usage count (total occurrences)
- Rank (1-45, lower is higher value)
- Volatility (low/medium/high)
- Oracle confidence (0.0-1.0)
- Last oracle update timestamp

## Phase 2: Oracle Source Analysis

### 2.1 Data Sources (Weighted)
**Solana Token Names**: 25% weight
- Sample size: token symbols and names on Solana
- Normalization: uppercase conversion
- Count: occurrences of character in sampled tokens

**Solana NFT Collections**: 20% weight
- Sample size: NFT collection names
- Normalization: uppercase conversion
- Count: occurrences in collection names

**Solana Domains**: 15% weight
- Sample size: .sol domain names
- Normalization: uppercase conversion
- Count: occurrences in domain names

**Language.fi Registry**: 25% weight
- Sample size: registered sentences and names
- Normalization: uppercase conversion
- Count: occurrences in registry entries

**Gate.io Token Listings**: 15% weight
- Sample size: listed token names
- Normalization: uppercase conversion
- Count: occurrences in token listings

### 2.2 Sampling Methodology
- Window: Weekly rolling window
- Sample size: Minimum 10,000 items per source
- Randomization: Stratified random sampling
- Deduplication: Remove exact duplicates within source
- Timestamp: Capture sample timestamp for oracle proof

## Phase 3: Pricing Formula

### 3.1 Base Price Calculation
```
Base Price = 0.020 LGU (minimum floor price)
```

### 3.2 Source Contribution
```
Source Contribution = (Occurrences / Total Sample Size) × Source Weight × Price Multiplier
```

Where:
- Price Multiplier for blockchain sources = 1.0
- Price Multiplier for registry = 1.2 (premium for protocol activity)
- Price Multiplier for exchange listings = 0.8 (discount for external data)

### 3.3 Component Summation
```
Weighted Usage =
(Solana Token Names × 0.25) +
(Solana NFT Collections × 0.20) +
(Solana Domains × 0.15) +
(Language.fi Registry × 0.25) +
(Gate.io Listings × 0.15)
```

### 3.4 Final Price Formula
```
Primitive Price =
Base Price
+ Weighted Usage
+ Staking Demand Weight
+ Volatility Adjustment
+ Congestion Tax
```

Where:
- **Staking Demand Weight**: (Sentences containing primitive / Total staked sentences) × 0.005
- **Volatility Adjustment**: If volatility = high, add 0.002; if low, subtract 0.001
- **Congestion Tax**: If rank < 10, add (10 - rank) × 0.0005

## Phase 4: Value Metrics

### 4.1 Usage Metrics
**Current Week Usage**: Total occurrences in current sampling window
**Previous Week Usage**: Total occurrences in previous sampling window
**Weekly Change**: (Current - Previous) / Previous × 100%

### 4.2 Market Metrics
**Rank**: Position sorted by price (1 = highest price)
**Volatility**: Based on weekly change magnitude
- Low: |change| < 5%
- Medium: 5% ≤ |change| < 15%
- High: |change| ≥ 15%

**Oracle Confidence**: Based on sample size and source diversity
- High confidence: Sample size > 50,000, all sources active
- Medium confidence: Sample size > 10,000, 3+ sources active
- Low confidence: Sample size < 10,000 or < 3 sources active

### 4.3 Staking Metrics
**Staked Sentence Exposure**: Number of staked sentences containing this primitive
**Top Contributor Status**: If in top 3 contributors to any sentence value
**Diversity Score**: Based on distribution across sources (0-1, higher is better)

## Phase 5: Appraisal Report

### 5.1 Required Fields
```json
{
  "symbol": "A",
  "type": "letter",
  "price_lgu": 0.142,
  "previous_price_lgu": 0.078,
  "weekly_change_percent": 82.05,
  "current_usage": 163155,
  "previous_usage": 132800,
  "rank": 2,
  "volatility": "high",
  "oracle_confidence": 0.968,
  "oracle_sources": {
    "solana_token_names": {
      "occurrences": 18420,
      "weight": 0.25,
      "contribution": 0.026
    },
    "solana_nft_collections": {
      "occurrences": 44910,
      "weight": 0.20,
      "contribution": 0.034
    },
    "solana_domains": {
      "occurrences": 9884,
      "weight": 0.15,
      "contribution": 0.009
    },
    "languagefi_registry_entries": {
      "occurrences": 88210,
      "weight": 0.25,
      "contribution": 0.067
    },
    "gateio_token_listings": {
      "occurrences": 1731,
      "weight": 0.15,
      "contribution": 0.003
    }
  },
  "staking_exposure": 92114,
  "diversity_score": 0.84,
  "last_updated_at": "2026-05-01T00:00:00Z"
}
```

### 5.2 Market Direction
**Bullish Indicators**:
- Weekly change > 10%
- Increasing usage across 3+ sources
- High staking exposure
- Rank improving (moving toward #1)

**Bearish Indicators**:
- Weekly change < -10%
- Decreasing usage across 3+ sources
- Low staking exposure
- Rank declining (moving toward #45)

**Neutral Indicators**:
- Weekly change between -10% and +10%
- Stable usage across sources
- Moderate staking exposure
- Stable rank

## Phase 6: Sentence Valuation

### 6.1 Sentence Price Calculation
```
Sentence Value = Σ(Character Count × Character Price)
```

Example: "BUILD ON BASE 2026"
```
B (2) × 0.091 = 0.182
U (1) × 0.044 = 0.044
I (1) × 0.073 = 0.073
L (1) × 0.066 = 0.066
D (1) × 0.052 = 0.052
SPACE (3) × 0.061 = 0.183
O (1) × 0.049 = 0.049
N (1) × 0.058 = 0.058
A (1) × 0.142 = 0.142
S (1) × 0.081 = 0.081
E (1) × 0.126 = 0.126
2 (2) × 0.037 = 0.074
0 (1) × 0.041 = 0.041
6 (1) × 0.035 = 0.035
─────────────────────
Total: 1.205 LGU
```

### 6.2 Staking Score Calculation
```
Staking Score =
Sentence Value
× (1 + Weekly Character Performance)
× Stillness Multiplier
× Diversity Multiplier
× Anti-Spam Score
```

Where:
- **Weekly Character Performance**: Average weekly change of all characters in sentence
- **Stillness Multiplier**: 1.0 + (days unmoved / 365) × 0.5, max 1.5x
- **Diversity Multiplier**: 1.0 + (unique characters / total characters) × 0.2, max 1.3x
- **Anti-Spam Score**: Based on sentence uniqueness (0.7-1.0)

## Phase 7: Oracle Proof

### 7.1 Required Proofs
For real-money settlement, the oracle must publish:
- Sample size per source
- Source URLs or source IDs
- Sampling timestamp
- Normalization rules applied
- Duplicate removal method
- Final count per source
- Previous count for comparison
- Change percentage calculation
- Oracle signature (cryptographic proof)

### 7.2 Verification Process
1. Retrieve sample data from source URLs
2. Apply normalization rules
3. Remove duplicates per specified method
4. Count character occurrences
5. Verify counts match oracle publication
6. Verify timestamp is within acceptable window
7. Verify oracle signature is valid

## Phase 8: Market Making

### 8.1 Liquidity Provision
- **Market Makers**: Provide bid/ask spreads for primitives
- **Minimum Spread**: 2% for top 10 primitives, 5% for others
- **Inventory Limits**: Max 10,000 LGU exposure per primitive

### 8.2 Price Discovery
- **Oracle Price**: Reference price from oracle
- **Market Price**: Actual trading price (may deviate from oracle)
- **Arbitrage**: If market price deviates >10% from oracle, arbitrage opportunity

### 8.3 Settlement
- **Daily Settlement**: At 00:00 UTC, settle all open positions at oracle price
- **Force Settlement**: If oracle confidence < 0.5, suspend trading
- **Dispute Resolution**: 7-day window to dispute oracle results

## Usage Example

See [LETTER_APPRAISAL_EXAMPLE.md](./LETTER_APPRAISAL_EXAMPLE.md) for a worked example appraising the letter "B" and the sentence "BUILD ON BASE 2026".
