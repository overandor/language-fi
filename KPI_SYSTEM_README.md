# 24/7 LLM KPI Analyzer for Letter Quantification

A continuous analysis system that fetches primitive data from the Language.fi API, uses LLM (GPT-4) to generate novel Key Performance Indicators (KPIs) for letter quantification, and stores results in a PostgreSQL database.

## Overview

This system quantifies letters and dequantifies numbers by generating intelligent KPIs across multiple categories:
- **Volatility**: Price swings, frequency of rank changes
- **Usage Patterns**: Time-of-day usage spikes, correlation with market events
- **Liquidity**: Trading volume, depth, spread metrics
- **Sentiment**: Usage-based sentiment indicators
- **Network Effects**: Cross-letter correlation, clustering
- **Dequantification**: Number-to-letter conversion patterns

## Architecture

```
┌─────────────────┐
│  API Endpoints  │
│  (language-fi)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Fetcher    │
│ (every 60s)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM Analyzer    │
│ (GPT-4)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL DB   │
│ (Time-series)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ KPI API Server  │
│ (Flask)         │
└─────────────────┘
```

## Components

### 1. kpi_analyzer.py
Main service that runs continuous analysis cycles:
- Fetches data from `/api/primitives` and `/api/oracle/live-stats`
- Uses OpenAI GPT-4 to generate novel KPIs
- Stores KPIs in PostgreSQL database
- Falls back to simple metrics if LLM unavailable

### 2. kpi_api.py
Flask API server serving KPI data:
- `/api/kpi/recent` - Get recent KPIs
- `/api/kpi/latest` - Get latest KPIs from most recent cycle
- `/api/kpi/categories` - Get KPIs grouped by category
- `/api/kpi/letter/<letter>` - Get KPIs for specific letter
- `/api/kpi/stats` - Get KPI statistics
- `/health` - Health check

### 3. kpi_schema.sql
PostgreSQL database schema with:
- `kpis` table - Stores KPI definitions and current values
- `kpi_history` table - Time-series KPI values
- `analysis_cycles` table - Tracks each analysis run
- `kpi_alerts` table - Threshold-based alerts
- Stored functions for common queries

## Setup

### Prerequisites
- Python 3.10+
- PostgreSQL 13+
- OpenAI API key

### Environment Variables
```bash
# API Configuration
API_BASE_URL=https://language-fi.vercel.app
OPENAI_API_KEY=your_openai_api_key

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kpi_db
DB_USER=kpi_user
DB_PASSWORD=your_password

# Service Configuration
FETCH_INTERVAL=60  # seconds between analysis cycles
```

### Installation

1. **Install dependencies:**
```bash
pip install -r kpi_requirements.txt
```

2. **Set up PostgreSQL database:**
```bash
createdb kpi_db
psql kpi_db < kpi_schema.sql
```

3. **Configure environment:**
```bash
export API_BASE_URL=https://language-fi.vercel.app
export OPENAI_API_KEY=your_key
export DB_HOST=localhost
export DB_NAME=kpi_db
export DB_USER=kpi_user
export DB_PASSWORD=your_password
```

## Running the System

### Run KPI Analyzer (24/7 service)
```bash
python kpi_analyzer.py
```

### Run KPI API Server
```bash
python kpi_api.py
```

### Run with Docker
```bash
# Build and run analyzer
docker build -f kpi_Dockerfile -t kpi-analyzer .
docker run -e API_BASE_URL=https://language-fi.vercel.app \
           -e OPENAI_API_KEY=your_key \
           kpi-analyzer

# Build and run API server
docker build -f Dockerfile -t kpi-api .
docker run -p 8080:8080 kpi-api
```

## KPI Categories

### Volatility
- **Letter Price Volatility Index**: Standard deviation of letter prices
- **Rank Change Frequency**: How often letters change ranks
- **Price Swing Magnitude**: Average price movement per cycle

### Usage Patterns
- **Usage Concentration Score**: Distribution of usage across letters
- **Peak Usage Times**: When specific letters are most used
- **Correlation Matrix**: Cross-letter usage correlations

### Liquidity
- **Effective Spread**: Price difference between buy/sell
- **Depth Score**: Volume at different price levels
- **Turnover Rate**: How quickly primitives change hands

### Sentiment
- **Usage Sentiment Score**: Positive/negative usage patterns
- **Momentum Indicator**: Usage trend direction
- **Confidence Index**: How confident the market is in prices

### Network Effects
- **Cluster Coefficient**: How letters group together
- **Centrality Score**: Which letters are most influential
- **Bridge Metrics**: Letters connecting different clusters

### Dequantification
- **Letter-Number Correlation**: Relationship between letters and numbers
- **Conversion Efficiency**: How numbers map to letters
- **Quantization Error**: Loss in dequantification process

## API Usage Examples

### Get Recent KPIs
```bash
curl http://localhost:8080/api/kpi/recent?limit=20
```

### Get Latest KPIs
```bash
curl http://localhost:8080/api/kpi/latest
```

### Get KPIs by Category
```bash
curl http://localhost:8080/api/kpi/categories
```

### Get KPIs for Specific Letter
```bash
curl http://localhost:8080/api/kpi/letter/A
```

### Get Statistics
```bash
curl http://localhost:8080/api/kpi/stats
```

## Database Queries

### Get KPI Summary
```sql
SELECT * FROM get_kpi_summary();
```

### Get Letter KPIs
```sql
SELECT * FROM get_letter_kpis('A', 50);
```

### Check Alerts
```sql
SELECT * FROM check_kpi_alerts();
```

### Recent Analysis Cycles
```sql
SELECT * FROM analysis_cycles 
ORDER BY cycle_start DESC 
LIMIT 10;
```

## Monitoring

### Check Service Health
```bash
curl http://localhost:8080/health
```

### View Logs
```bash
# Analyzer logs
docker logs kpi-analyzer

# API logs
docker logs kpi-api
```

### Database Monitoring
```sql
-- Check recent KPIs
SELECT name, value, created_at 
FROM kpis 
ORDER BY created_at DESC 
LIMIT 20;

-- Check analysis cycle status
SELECT * FROM analysis_cycles 
ORDER BY cycle_start DESC 
LIMIT 5;
```

## Alerts

Set up threshold-based alerts in the `kpi_alerts` table:

```sql
INSERT INTO kpi_alerts (kpi_id, threshold_value, condition)
VALUES (
    (SELECT id FROM kpis WHERE name = 'Letter Price Volatility Index'),
    75.0,
    'above'
);
```

The system will automatically check thresholds and trigger alerts when KPIs cross the threshold.

## Troubleshooting

### LLM Analysis Failing
- Check OPENAI_API_KEY is set correctly
- Verify API quota is not exhausted
- Check network connectivity to OpenAI

### Database Connection Issues
- Verify PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- Ensure database exists: `createdb kpi_db`

### No KPIs Generated
- Check API_BASE_URL is correct
- Verify API is accessible: `curl $API_BASE_URL/api/primitives`
- Check logs for errors

### API Server Not Responding
- Verify port is not in use
- Check firewall settings
- Ensure Flask app is running

## Performance

- **Analysis Cycle**: ~30-60 seconds per cycle
- **KPI Generation**: 3-5 KPIs per cycle
- **Database Storage**: ~1KB per KPI
- **API Response**: <100ms for cached queries

## Scaling

For production deployment:
1. Use PostgreSQL connection pooling
2. Add Redis for caching
3. Deploy analyzer as Kubernetes CronJob
4. Deploy API server with load balancer
5. Add monitoring (Prometheus/Grafana)
6. Set up log aggregation (ELK stack)

## Future Enhancements

- [ ] Add real-time WebSocket updates
- [ ] Implement KPI trend prediction
- [ ] Add anomaly detection
- [ ] Create KPI dashboard UI
- [ ] Add multi-language support
- [ ] Implement KPI backtesting
- [ ] Add export to CSV/Excel
- [ ] Create KPI comparison tools

## License

MIT

## Support

For issues or questions, open an issue on GitHub.
