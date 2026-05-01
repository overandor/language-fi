# Language.fi API Documentation

## Overview

Language.fi exposes letters, numbers, spaces, and symbols as live API primitives. Their prices are calculated by an oracle that samples blockchain and regular content, measures character usage, and feeds those values into sentence minting and sentence staking.

**Base URL:** `https://language-fi.vercel.app/api`

## Authentication

Most endpoints are public. Some endpoints may require API keys for rate limiting or premium features.

## Primitives

### Get All Primitives

Returns all letters (A-Z), numbers (0-9), SPACE, and symbols (., !, ?, -, _, @, #).

**Endpoint:** `GET /primitives`

**Response:**
```json
{
  "updated_at": "2026-05-01T00:00:00Z",
  "primitives": [
    {
      "symbol": "A",
      "type": "letter",
      "price_lgu": 0.142,
      "change_24h": 12.9,
      "weekly_change": -0.022,
      "usage_count": 1359855,
      "rank": 1,
      "volatility": "High",
      "staking_weight": 0.82
    },
    {
      "symbol": "SPACE",
      "type": "separator",
      "price_lgu": 0.061,
      "change_24h": 7.1,
      "weekly_change": 0.038,
      "usage_count": 4584749,
      "rank": 1,
      "volatility": "Medium",
      "staking_weight": 1.5
    },
    {
      "symbol": "7",
      "type": "number",
      "price_lgu": 0.033,
      "change_24h": -1.2,
      "weekly_change": 0.145,
      "usage_count": 612933,
      "rank": 34,
      "volatility": "High",
      "staking_weight": 0.81
    }
  ]
}
```

### Get Single Primitive

Returns detailed data for a specific primitive with oracle source breakdown.

**Endpoint:** `GET /primitives/{symbol}`

**Parameters:**
- `symbol` (path): The primitive symbol (e.g., A, 7, SPACE, !)

**Response:**
```json
{
  "symbol": "B",
  "type": "letter",
  "price_lgu": 0.091,
  "previous_price_lgu": 0.078,
  "weekly_change": 0.1672,
  "usage_count_current_week": 948220,
  "usage_count_previous_week": 812410,
  "rank": 11,
  "volatility": "high",
  "oracle_confidence": 0.974,
  "oracle_sources": {
    "solana_token_names": {
      "occurrences": 25000,
      "weight": 0.25,
      "source_id": "sol_token_names_v1"
    },
    "solana_nft_collections": {
      "occurrences": 45000,
      "weight": 0.20,
      "source_id": "sol_nft_collections_v1"
    },
    "solana_domains": {
      "occurrences": 12000,
      "weight": 0.15,
      "source_id": "sol_domains_v1"
    },
    "languagefi_registry": {
      "occurrences": 88000,
      "weight": 0.25,
      "source_id": "langfi_registry_v1"
    },
    "coingecko_token_listings": {
      "occurrences": 1500,
      "weight": 0.15,
      "source_id": "coingecko_listings_v1"
    }
  },
  "weighted_usage": 171500,
  "market_result": {
    "direction": "up",
    "status": "long_b_winning"
  },
  "oracle_metadata": {
    "sample_size": 171500,
    "window": "weekly",
    "normalization_rules": "uppercase, remove_special_chars, remove_duplicates",
    "timestamp": "2026-05-01T00:00:00Z",
    "oracle_version": "v1.0"
  },
  "last_oracle_update": "2026-05-01T00:00:00Z"
}
```

## Sentences

### Quote Sentence

Calculate the price of minting a sentence based on current oracle prices of its characters.

**Endpoint:** `POST /sentences/quote`

**Request Body:**
```json
{
  "sentence": "BUILD ON BASE 2026"
}
```

**Response:**
```json
{
  "sentence": "BUILD ON BASE 2026",
  "characters": [
    {
      "symbol": "B",
      "count": 2,
      "unit_price_lgu": 0.091,
      "total": 0.182
    },
    {
      "symbol": "U",
      "count": 1,
      "unit_price_lgu": 0.045,
      "total": 0.045
    },
    {
      "symbol": "SPACE",
      "count": 3,
      "unit_price_lgu": 0.061,
      "total": 0.183
    },
    {
      "symbol": "2",
      "count": 2,
      "unit_price_lgu": 0.037,
      "total": 0.074
    }
  ],
  "base_value_lgu": 1.321,
  "oracle_updated_at": "2026-05-01T00:00:00Z"
}
```

### Calculate Staking Score

Calculate the staking score for a sentence with stillness multiplier.

**Endpoint:** `POST /staking/sentence-score`

**Request Body:**
```json
{
  "sentence": "BUILD ON BASE 2026",
  "staked_since": "2026-02-17T00:00:00Z",
  "last_moved_at": "2026-02-17T00:00:00Z"
}
```

**Response:**
```json
{
  "sentence": "BUILD ON BASE 2026",
  "base_character_value_lgu": 1.321,
  "weekly_character_performance": 0.098,
  "stillness_days": 73,
  "stillness_multiplier": 1.5,
  "diversity_multiplier": 1.14,
  "anti_spam_score": 0.97,
  "final_staking_score": 2.415,
  "top_contributors": [
    {
      "symbol": "SPACE",
      "contribution": 0.183
    },
    {
      "symbol": "B",
      "contribution": 0.182
    },
    {
      "symbol": "A",
      "contribution": 0.142
    }
  ]
}
```

## Oracle

### Get Oracle Snapshot

Get oracle snapshot for settlement proof with all primitive data.

**Endpoint:** `GET /oracle/snapshot`

**Response:**
```json
{
  "snapshot_id": "oracle_123456",
  "timestamp": "2026-05-01T00:00:00Z",
  "window": "weekly",
  "oracle_version": "v1.0",
  "normalization_rules": "uppercase, remove_special_chars, remove_duplicates",
  "source_weights": {
    "solana_token_names": 0.25,
    "solana_nft_collections": 0.20,
    "solana_domains": 0.15,
    "languagefi_registry": 0.25,
    "coingecko_token_listings": 0.15
  },
  "total_sample_size": 2500000,
  "primitives": [...]
}
```

### Update Oracle

Trigger live oracle data update from external APIs.

**Endpoint:** `POST /oracle/update`

**Response:**
```json
{
  "success": true,
  "message": "Oracle data updated successfully",
  "last_updated": "2026-05-01T00:00:00Z"
}
```

### Get Live Oracle Stats

Get live oracle statistics from real token data (CoinMarketCap, CoinGecko).

**Endpoint:** `GET /oracle/live-stats`

**Response:**
```json
{
  "last_updated": "2026-05-01T00:00:00Z",
  "coinmarketcap_tokens_count": 5000,
  "coingecko_tokens_count": 10000,
  "character_counts": {
    "coinmarketcap": {
      "A": 125000,
      "B": 98000,
      ...
    },
    "coingecko": {
      "A": 180000,
      "B": 145000,
      ...
    },
    "total": {
      "A": 305000,
      "B": 243000,
      ...
    }
  },
  "total_characters": 50000000
}
```

### Get Live Primitives

Get primitives with live oracle data from real token APIs.

**Endpoint:** `GET /primitives/live`

**Response:**
```json
{
  "updated_at": "2026-05-01T00:00:00Z",
  "primitives": [...],
  "data_source": "live"
}
```

## Tokenization

### Tokenize Oracle Stats

Tokenize oracle statistics as on-chain assets.

**Endpoint:** `POST /tokenize/oracle-stats`

**Request Body:**
```json
{
  "wallet_address": "0x1234...",
  "stats_type": "character_counts"
}
```

**Response:**
```json
{
  "success": true,
  "token": {
    "token_id": "oracle_123456",
    "owner": "0x1234...",
    "stats_type": "character_counts",
    "snapshot_timestamp": "2026-05-01T00:00:00Z",
    "character_counts": {
      "A": 305000,
      "B": 243000,
      ...
    },
    "total_characters": 50000000,
    "data_sources": {
      "coinmarketcap": 5000,
      "coingecko": 10000
    },
    "token_metadata": {
      "name": "Oracle Snapshot 123456",
      "symbol": "ORCL3456",
      "description": "Tokenized oracle statistics snapshot"
    }
  },
  "message": "Oracle stats tokenized successfully"
}
```

## Legacy Endpoints

### Get Letters

Legacy endpoint for letter data only.

**Endpoint:** `GET /letters`

### Get Letter Detail

Legacy endpoint for individual letter data.

**Endpoint:** `GET /letter/{letter}`

### Calculate Sentence Price

Legacy endpoint for sentence price calculation.

**Endpoint:** `POST /calculate-sentence-price`

## Data Sources

The oracle uses the following data sources:

1. **CoinMarketCap** - Top 5000 cryptocurrencies by market cap
2. **CoinGecko** - Comprehensive token listings
3. **Solana Token Names** - SPL token names on Solana
4. **Solana NFT Collections** - NFT collection names
5. **Solana Domains** - .sol domain names
6. **Language.fi Registry** - Internal registry activity

## Oracle Pricing Formula

```
Primitive Price =
Base Price
+ Blockchain Usage Weight
+ Token Name Weight
+ Hash Frequency Weight
+ Regular Content Weight
+ Registry Demand Weight
+ Staking Demand Weight
+ Volatility Adjustment
+ Congestion Tax
```

## Staking Formula

```
Staking Score =
Base Character Value
× Character Performance
× Stillness Multiplier
× Diversity Multiplier
× Anti-Spam Score
```

### Stillness Multiplier

- 0-7 days: 1.00x
- 7-30 days: 1.10x
- 30-90 days: 1.25x
- 90-180 days: 1.50x
- 180-365 days: 2.00x
- 365+ days: 3.00x

## Error Codes

- `400` - Bad Request (missing required fields)
- `404` - Not Found (invalid endpoint or primitive)
- `500` - Internal Server Error (API failure, oracle update error)

## Rate Limiting

Public endpoints: 100 requests per minute per IP
Authenticated endpoints: 1000 requests per minute per API key

## SDKs

Coming soon:
- JavaScript/TypeScript SDK
- Python SDK
- Rust SDK

## Support

For API support, contact: api@language.fi
Documentation: https://docs.language.fi
GitHub: https://github.com/overandor/language-fi
