# Language.fi Pricing Formula

## Overview

The Language.fi oracle computes prices for 43 linguistic primitives (26 letters, 10 numbers, 7 symbols) based on observable usage data from multiple sources. This document defines the formal pricing formula used to calculate primitive prices.

## Primitive Categories

- **Letters**: A-Z (26 primitives)
- **Numbers**: 0-9 (10 primitives)
- **Symbols**: SPACE, ., !, ?, -, _, @, # (7 primitives)
- **Total**: 43 primitives

## Pricing Formula

### Base Price Calculation

For each primitive, the base price is calculated as:

```
price_base = (frequency / total_frequency) * base_multiplier
```

Where:
- `frequency`: Observed usage count of the primitive across all sources
- `total_frequency`: Sum of all primitive frequencies in the same category
- `base_multiplier`: Scaling factor to normalize prices (default: 1.0)

### Velocity Component

Velocity measures the rate of change in usage over time:

```
velocity = (current_frequency - previous_frequency) / time_window
```

Where:
- `current_frequency`: Usage count in current time window
- `previous_frequency`: Usage count in previous time window
- `time_window`: Time difference between windows (in hours)

### Acceleration Component

Acceleration measures the rate of change in velocity:

```
acceleration = (current_velocity - previous_velocity) / time_window
```

### Source Diversity Score

Source diversity measures how evenly distributed the primitive's usage is across data sources:

```
source_diversity = -sum(p_i * log(p_i)) for each source i
```

Where:
- `p_i`: Proportion of the primitive's usage coming from source i

### Entropy Score

Entropy measures the unpredictability of the primitive's usage pattern:

```
entropy = -sum(p_i * log2(p_i)) for each usage context i
```

### Cross-Source Correlation

Cross-source correlation measures the consistency of the primitive's usage across different sources:

```
correlation = average(corr(source_i, source_j)) for all source pairs
```

### Rarity Score

Rarity measures how unique the primitive is compared to others:

```
rarity = 1 - (frequency / max_frequency_in_category)
```

### Final Price Calculation

The final price combines all components with weighted coefficients:

```
price_final = (
    price_base * w_base +
    velocity * w_velocity +
    acceleration * w_acceleration +
    source_diversity * w_diversity +
    entropy * w_entropy +
    correlation * w_correlation +
    rarity * w_rarity
) * decay_factor
```

### Coefficient Values

Default coefficient values:

- `w_base`: 0.4
- `w_velocity`: 0.15
- `w_acceleration`: 0.1
- `w_diversity`: 0.1
- `w_entropy`: 0.1
- `w_correlation`: 0.1
- `w_rarity`: 0.05

### Decay Factor

Decay factor accounts for time-based price smoothing:

```
decay_factor = exp(-lambda * time_since_last_update)
```

Where:
- `lambda`: Decay rate (default: 0.01 per hour)
- `time_since_last_update`: Hours since last price update

### Price Floors and Caps

To prevent extreme values:

```
price_final = max(price_floor, min(price_cap, price_final))
```

Default values:
- `price_floor`: 0.01
- `price_cap`: 1.0

## Ranking Calculation

Primitives are ranked within their category based on final price:

```
rank = position in sorted list (descending by price_final)
```

## Data Sources

Primary data sources:
- CoinGecko API (market data)
- Gate.io API (trading data)
- CoinMarketCap API (if API key available)
- Newspaper article text analysis
- Medium article text analysis
- Wikipedia text analysis

## Normalization Rules

1. **Frequency Normalization**: All frequencies are normalized to [0, 1] range within category
2. **Velocity Normalization**: Velocity is normalized using z-score
3. **Cross-Source Alignment**: Prices from different sources are aligned using median
4. **Time Window**: Default time window is 24 hours for velocity/acceleration calculations

## Reproducibility

To ensure reproducibility, each oracle run includes:

- Input data snapshot (hash)
- Normalization parameters
- Coefficient values
- Timestamp
- Run hash (SHA-256 of all inputs and parameters)

## Version

Current formula version: v1.0
Last updated: 2026-05-01

## Example Calculation

For primitive 'A':

```
frequency_A = 999661
total_frequency_letters = sum(frequency for all letters)
price_base_A = (999661 / total_frequency_letters) * 1.0
velocity_A = (999661 - 990000) / 24 = 402.04
acceleration_A = (402.04 - 380.00) / 24 = 0.92
source_diversity_A = 0.85
entropy_A = 0.72
correlation_A = 0.68
rarity_A = 0.45

price_final_A = (
    price_base_A * 0.4 +
    velocity_A * 0.15 +
    acceleration_A * 0.1 +
    source_diversity_A * 0.1 +
    entropy_A * 0.1 +
    correlation_A * 0.1 +
    rarity_A * 0.05
) * 0.99

= 0.142 (approximate)
```
