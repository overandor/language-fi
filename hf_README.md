---
title: Language.fi Oracle API
emoji: 🔤
colorFrom: orange
colorTo: purple
sdk: gradio
sdk_version: 4.0.0
app_file: hf_app.py
pinned: false
license: mit
---

# Language.fi Oracle API

Live API server for letter and number primitive pricing using multi-source oracle data.

## Features

- **43 Primitives**: Letters (A-Z), Numbers (0-9), SPACE, and Symbols (., !, ?, -, _, @, #)
- **Multi-Source Oracle Data**:
  - CoinGecko token listings (10,000+ cryptocurrencies)
  - Major newspaper articles (NYT, WSJ, FT, Bloomberg, Reuters, CNBC, Forbes, TechCrunch, Guardian, BBC)
  - Medium articles (crypto, DeFi, Web3, NFT, blockchain content)
  - Chain-specific data (Ethereum, Solana, Bitcoin, Binance, Polygon)
- **Real Character Counting**: Character frequency analysis from all sources
- **Live Pricing**: Prices calculated from actual character usage
- **Chain-Specific Popularity**: Letter popularity tracking per blockchain

## Oracle Sources

### CoinGecko
- All cryptocurrency token names and symbols
- Real-time market data integration
- API Key: CG-DD8rr7U4hQsjAxokXt7ERtaG

### Newspaper Articles
- The New York Times
- Wall Street Journal
- Financial Times
- Bloomberg
- Reuters
- CNBC
- Forbes
- TechCrunch
- The Guardian
- BBC

### Medium Articles
- Blockchain technology guides
- DeFi protocols
- NFT market analysis
- Web3 development
- Smart contract security
- Metaverse investments
- DAO governance
- Layer 2 scaling
- Cross-chain protocols

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
2. **Newspaper Sampling**: Random sample from major financial news
3. **Medium Sampling**: Random sample from crypto/Web3 articles
4. **Chain Data**: Chain-specific tokens and projects
5. **Character Counting**: Count character occurrences across all sources
6. **Weight Calculation**: Apply source weights to final counts
7. **Price Generation**: Calculate primitive prices based on weighted usage

## License

MIT License - See LICENSE file for details
