---
title: Language.fi Oracle API
emoji: 🔤
colorFrom: yellow
colorTo: purple
sdk: gradio
sdk_version: 4.0.0
app_file: hf_app.py
pinned: false
license: mit
---

# Language.fi Oracle API

Prototype API server for letter and number primitive pricing using multi-source oracle data simulation.

## Features

- **43 Primitives**: Letters (A-Z), Numbers (0-9), SPACE, and Symbols (., !, ?, -, _, @, #)
- **Multi-Source Oracle Data Simulation**:
  - CoinGecko token listings (10,000+ cryptocurrencies)
  - Sampled permitted public metadata from major financial news sources (NYT, WSJ, FT, Bloomberg, Reuters, CNBC, Forbes, TechCrunch, Guardian, BBC)
  - Sampled Web3/crypto content samples (similar to Medium-style articles)
  - Chain-specific data (Ethereum, Solana, Bitcoin, Binance, Polygon)
- **Character Counting**: Character frequency analysis from all sources
- **Simulated Pricing**: Prices calculated from character usage with simulated market movements
- **Chain-Specific Popularity**: Letter popularity tracking per blockchain

## Oracle Sources

### CoinGecko
- All cryptocurrency token names and symbols
- Real-time market data integration
- Set COINGECKO_API_KEY environment variable for authentication

### Sampled Sources
- **Financial News Metadata**: Sampled permitted public metadata from major financial news sources (NYT, WSJ, FT, Bloomberg, Reuters, CNBC, Forbes, TechCrunch, Guardian, BBC)
- **Web3 Content Samples**: Sampled Web3/crypto content samples (similar to Medium-style articles on blockchain technology, DeFi, NFTs, Web3 development, etc.)
- **Note**: These are sampled content, not live RSS/API feeds. Only derived character counts are stored.

### Chain-Specific Data
- **Ethereum**: ETH, USDT, USDC, DAI, WBTC, LINK, UNI, AAVE, MKR, SNX + projects
- **Solana**: SOL, RAY, SRM, ORCA, JUP, BONK, WIF, PYTH, JTO, MNGO + projects
- **Bitcoin**: BTC, WBTC, SBTC, RENBTC, TBTC, PBTC, CBTC + projects
- **Binance**: BNB, CAKE, XVS, ALPACA, TWT, BETH, VAI + projects
- **Polygon**: MATIC, AAVE, UNI, DAI, USDC, WBTC, LINK, WMATIC + projects

## API Endpoints

### Health Check
```
GET /
```
Returns server status and version.

### Get All Primitives
```
GET /api/primitives
```
Returns all 43 primitives with live data from all sources.

### Get Single Primitive
```
GET /api/primitives/{symbol}
```
Returns detailed data for a specific primitive.

### Update Oracle
```
POST /api/oracle/update
```
Trigger oracle update from all data sources.

### Oracle Statistics
```
GET /api/oracle/stats
```
Get comprehensive oracle statistics from all sources.

## Pricing Formula

```
Primitive Price = Base Price × (1 + Change%) + Usage Weight
``n
Usage Weight = (CoinGecko × 0.4) + (Newspapers × 0.2) + (Medium × 0.2) + (Chains × 0.2)
```

## Chain-Specific Popularity

Each blockchain's letter popularity is calculated from:
- Native tokens on that chain
- Major projects/protocols on that chain
- Character frequency in token symbols and project names

## Data Flow

1. **CoinGecko API**: Fetch all cryptocurrency tokens (10,000+)
2. **Sampled Sources**: Use configured samples from financial news metadata and Web3 content
3. **Chain Data**: Chain-specific tokens and projects
4. **Character Counting**: Count character occurrences across all sources
5. **Weight Calculation**: Apply source weights to final counts
6. **Price Generation**: Calculate primitive prices based on weighted usage

## License

MIT License - See LICENSE file for details
