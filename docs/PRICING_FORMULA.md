# Language.fi Pricing Formula

## Overview

Language.fi prices 43 linguistic primitives (26 letters, 10 numbers, SPACE, 6 symbols) using a deterministic, reproducible formula based on observable usage data across multiple data sources.

## Primitive Set

**Letters (26):** A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z

**Numbers (10):** 0, 1, 2, 3, 4, 5, 6, 7, 8, 9

**Symbols (7):** SPACE, ., !, ?, -, _, @, #

## Data Sources

### Primary Sources
- **CoinGecko**: Token names and symbols from cryptocurrency listings
- **Gate.io**: Trading pair symbols
- **CoinMarketCap**: Token listings (when API key available)

### Secondary Sources (Future)
- Blockchain addresses and transaction hashes
- Public RSS feeds with derived character counts
- Social media metadata (derived counts only)
- Domain name registrations

## Pricing Formula

### Base Price Calculation

```
Base Price = Base Factor + Usage Weight + Volatility Adjustment
```

### Usage Weight

```
Usage Weight = Σ (Source Count × Source Weight × Quality Multiplier)
```

Where:
- **Source Count**: Character occurrences from that source
- **Source Weight**: 0.0 to 1.0 based on source reliability
- **Quality Multiplier**: 0.8 to 1.2 based on source quality tier

### Source Weights

```
CoinGecko: 0.40 (highest reliability)
Gate.io: 0.30
CoinMarketCap: 0.25
Blockchain Hashes: 0.05
```

### Source Quality Tiers

```
Tier 1 (Multiplier 1.2): CoinGecko, CoinMarketCap
Tier 2 (Multiplier 1.0): Gate.io, major exchanges
Tier 3 (Multiplier 0.8): RSS feeds, social metadata
```

### Volatility Adjustment

```
Volatility = Standard Deviation(Usage Weight) over 7 periods
Volatility Adjustment = Volatility × 0.15
```

### Velocity Factor

```
Velocity = (Current Usage - Previous Usage) / Previous Usage
Velocity Bonus = Velocity × 0.10 (capped at ±0.05)
```

### Entropy Bonus

```
Entropy = -Σ (p_i × log₂(p_i)) where p_i = probability of character in corpus
Entropy Bonus = (Entropy / Max Entropy) × 0.05
```

### Cross-Source Correlation

```
Correlation = Pearson correlation of character ranks across sources
Correlation Adjustment = Correlation × 0.03
```

### Rarity Adjustment

```
Rarity = 1 - (Character Usage / Total Usage)
Rarity Bonus = Rarity × 0.02
```

### Decay Factor

```
Decay = 0.997 (0.3% decay per day)
Decay Adjustment = Usage Weight × (1 - Decay^DaysSinceLastUpdate)
```

### Final Price Formula

```
Price = (Base Factor + Usage Weight + Volatility Adjustment + Velocity Bonus + 
        Entropy Bonus + Correlation Adjustment + Rarity Bonus - Decay Adjustment) × 
        Market Cap Scaling
```

### Price Floors and Caps

```
Minimum Price: 0.015 LGU
Maximum Price: 0.250 LGU
```

## Reproducible Oracle Runs

### Input Snapshot

Each oracle run captures:
- Source data hash (SHA-256 of all source data)
- Timestamp (UTC)
- Source counts per character
- Source weights and quality tiers
- Formula version

### Normalization Rules

1. All text converted to uppercase
2. Alphanumeric characters and spaces only
3. Duplicate entries removed per source
4. Minimum 1000 observations per source required
5. Maximum 100,000 observations per source (sampling)

### Oracle Run Hash

```
Run Hash = SHA-256(Source Data Hash + Timestamp + Formula Version + Source Weights)
```

### Signed Attestation

```
Signature = Sign(Run Hash, Oracle Private Key)
```

### Oracle Run Record

```json
{
  "run_id": "or_20240501_120000",
  "timestamp": "2024-05-01T12:00:00Z",
  "formula_version": "v1.0",
  "source_data_hash": "0x1234...",
  "source_weights": {
    "coingecko": 0.40,
    "gateio": 0.30,
    "coinmarketcap": 0.25,
    "blockchain": 0.05
  },
  "primitive_prices": {
    "A": 0.142,
    "B": 0.091,
    ...
  },
  "run_hash": "0xabcd...",
  "signature": "0x5678...",
  "previous_run_hash": "0x9999..."
}
```

## Anti-Manipulation Safeguards

### Source Weighting
- Single source cannot exceed 50% influence
- Minimum 3 sources required for production pricing
- Source weights reviewed quarterly

### Duplicate Detection
- Deduplicate by content hash within each source
- Cross-source duplicate detection (same content across sources)
- Duplicate content weight reduced by 50%

### Anomaly Detection
- Z-score analysis on character counts (>3σ flagged)
- Sudden usage spikes (>200% increase) trigger manual review
- Statistical outlier detection per source

### Source Quality Tiers
- Tier 1: Verified APIs (CoinGecko, CoinMarketCap)
- Tier 2: Major exchanges (Gate.io, Binance)
- Tier 3: Derived data sources (RSS, social)
- Tier 4 sources not used in production pricing

### Caps on Single-Source Influence
- Maximum 30% of any character's usage from single source
- Cross-source minimum requirement (≥2 sources for pricing)
- Source diversity score (entropy across sources)

### Time-Weighted Smoothing
- Exponential moving average (EMA) over 7 periods
- Sudden spikes smoothed by 70%
- Gradual changes preserved

### Manual Quarantine Mode
- Admin can flag sources for review
- Quarantined sources excluded from pricing
- Audit trail for quarantine actions

## Verification

### Deterministic Testing

```python
def test_deterministic_pricing():
    # Same input should produce same output
    input_data = {"A": 1000, "B": 500, ...}
    run1 = calculate_prices(input_data, formula_v1)
    run2 = calculate_prices(input_data, formula_v1)
    assert run1 == run2
```

### Reproducibility Check

```bash
# Re-run historical oracle
python oracle.py --replay --run-id or_20240501_120000
```

### Public Verification

Users can verify oracle runs by:
1. Fetching source data snapshot
2. Running local calculation with same formula
3. Comparing output hash with published hash
4. Verifying signature with oracle public key

## Formula Versioning

### Version Format
`v{major}.{minor}.{patch}`

### Versioning Rules
- Major: Breaking formula changes
- Minor: New factors or weight adjustments
- Patch: Bug fixes, documentation updates

### Backward Compatibility
- Historical oracle runs remain verifiable
- Formula version stored in each run record
- Multiple formula versions can coexist for transition periods

## Future Enhancements

### Planned Factors
- Sentiment analysis (positive/negative word associations)
- Cultural trend detection (meme velocity)
- Geographic weighting (regional language usage)
- Temporal patterns (hourly/daily/seasonal)
- Network effects (cross-character correlations)

### Advanced Anti-Gaming
- Sybil resistance (source identity verification)
- Proof-of-work for data submission
- Reputation scoring for data providers
- Community governance for source weights

## Disclaimer

This formula is subject to change as the protocol evolves. Historical oracle runs remain verifiable regardless of formula updates. The formula does not guarantee market prices or investment returns.
