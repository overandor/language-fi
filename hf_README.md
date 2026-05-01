---
title: Language.fi Oracle API
emoji: 🔤
colorFrom: indigo
colorTo: purple
sdk: gradio
sdk_version: 4.0.0
app_file: hf_app.py
pinned: false
license: mit
---

# Language.fi Oracle API

Live API server for letter and number primitive pricing using CoinGecko oracle data.

## Features

- **43 Primitives**: Letters (A-Z), Numbers (0-9), SPACE, and Symbols (., !, ?, -, _, @, #)
- **Real Oracle Data**: Character counts from CoinGecko token listings
- **Live Pricing**: Prices calculated from actual character usage
- **API Endpoints**:
  - `/` - Health check
  - `/api/primitives` - Get all primitives with live data
  - `/api/primitives/{symbol}` - Get specific primitive
  - `/api/oracle/update` - Trigger oracle update from CoinGecko
  - `/api/oracle/stats` - Get oracle statistics

## Oracle Sources

- CoinGecko token listings (all cryptocurrencies)
- Character frequency analysis
- Real-time price calculation

## API Usage

### Get All Primitives
```bash
curl https://your-space.hf.space/api/primitives
```

### Get Single Primitive
```bash
curl https://your-space.hf.space/api/primitives/A
```

### Update Oracle
```bash
curl -X POST https://your-space.hf.space/api/oracle/update
```

### Oracle Statistics
```bash
curl https://your-space.hf.space/api/oracle/stats
```

## Pricing Formula

```
Primitive Price = Base Price × (1 + Change%) + Usage Weight
```

## Data Source

Character counts are derived from CoinGecko's comprehensive cryptocurrency database, which includes:
- Token names
- Token symbols
- Real-time market data

## License

MIT License - See LICENSE file for details
