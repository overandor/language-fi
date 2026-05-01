# Language.fi Protocol Specification

## Abstract

Language.fi is a public oracle that prices 43 linguistic primitives (letters A-Z, numbers 0-9, space, and common symbols) from observable usage data across multiple data sources. The protocol provides reproducible oracle runs with cryptographic verification and a registry for composing word/sentence assets from priced primitives.

## 1. Primitives

### 1.1 Definition

Linguistic primitives are the atomic units of language:
- **Letters**: A-Z (26 primitives)
- **Numbers**: 0-9 (10 primitives)
- **Space**: Single space character (1 primitive)
- **Symbols**: Common punctuation and special characters (6 primitives)

Total: 43 primitives

### 1.2 What Primitives Represent

Each primitive represents:
- A character or symbol used in written language
- An observable usage pattern across data sources
- A quantifiable frequency in observable data
- A tradable asset within the protocol

### 1.3 What Primitives Do NOT Represent

Primitives do NOT represent:
- Ownership of letters, words, or language
- Trademark or copyright rights
- Legal claim to any linguistic element
- Investment vehicles or securities

## 2. Oracle Architecture

### 2.1 Data Collection

The oracle ingests usage data from multiple sources:
- **Gate.io**: Exchange token listings
- **DexScreener**: DEX trading pairs
- **Solana RPC**: Slot and transaction data
- **Additional sources**: Future integrations

### 2.2 Normalization

All data is normalized through consistent rules:
- Case-insensitive character counting
- Unicode normalization (NFKC)
- Deduplication within time windows
- Source attribution tracking

### 2.3 Pricing Formula

The formal pricing formula for each primitive:

```
price = (frequency * w_f + velocity * w_v + acceleration * w_a + 
         diversity * w_d + entropy * w_e + correlation * w_c + 
         rarity * w_r) * decay_factor
```

Where:
- `frequency`: Total occurrences in time window
- `velocity`: Rate of change (normalized to [-1, 1])
- `acceleration`: Rate of velocity change (normalized to [-1, 1])
- `diversity`: Number of unique sources (normalized)
- `entropy`: Shannon entropy (normalized to [0, 1])
- `correlation`: Cross-source agreement (normalized to [0, 1])
- `rarity`: 1/frequency (normalized)
- `decay_factor`: Time-based decay (default 0.95 per hour)

Default weights:
- `w_f = 0.3` (frequency weight)
- `w_v = 0.15` (velocity weight)
- `w_a = 0.1` (acceleration weight)
- `w_d = 0.15` (diversity weight)
- `w_e = 0.1` (entropy weight)
- `w_c = 0.1` (correlation weight)
- `w_r = 0.1` (rarity weight)

Price caps:
- Minimum price: 0.0001 LGU
- Maximum price: 1000 LGU

### 2.4 Reproducible Oracle Runs

Each oracle run generates:
- **Input Hash**: SHA-256 of input data (timestamp, sources, observations, policy version)
- **Output Hash**: SHA-256 of output prices
- **Previous Run Hash**: Chain of hash verification
- **Signature**: Cryptographic attestation from oracle private key
- **Timestamp**: Run execution time
- **Source Count**: Number of active data sources
- **Observation Count**: Total observations processed
- **Primitive Count**: Number of primitives priced

All oracle runs are stored in the public ledger for verification.

## 3. Anti-Manipulation Safeguards

### 3.1 Source Quality Tiers

Sources are categorized by quality:
- **Trusted**: Weight 1.0 (e.g., CoinGecko)
- **Standard**: Weight 0.7-0.8 (e.g., Gate.io, DexScreener)
- **Untrusted**: Weight 0.0 (quarantined)

### 3.2 Duplicate Detection

Duplicate observations within 60-second windows are detected and discounted.

### 3.3 Anomaly Detection

Statistical anomaly detection using z-scores:
- Threshold: 3 standard deviations
- Anomalies trigger weight reduction
- 5+ anomalies trigger source quarantine

### 3.4 Single-Source Influence Cap

No single source can influence more than 40% of the final price.

### 3.5 Time-Weighted Smoothing

Prices are smoothed using exponential moving average:
- 70% weight to current value
- 30% weight to historical value

### 3.6 Manual Quarantine Mode

Emergency quarantine mode allows:
- Disabling specific sources
- Restricting to trusted sources only
- Manual intervention during attacks

## 4. Registry and Assets

### 4.1 Registry Model

The registry records:
- Sentence hashes (SHA-256 of normalized text)
- Owner wallet addresses
- Composition of primitives
- Timestamp of registration

### 4.2 Asset Ownership

Registry entries represent:
- **Ownership of a registry entry**, not ownership of the word/sentence
- Protocol-native symbolic assets
- Composable from priced primitives
- Transferable within the protocol

### 4.3 Legal Positioning

The protocol explicitly states:
- No claim to trademark/copyright ownership
- No exclusive right to use language
- No investment promise or guarantee
- Registry entry is symbolic/protocol-native only

### 4.4 Content Moderation

The protocol reserves rights to:
- Reject registrations containing slurs, hate speech, or illegal content
- Quarantine malicious registrations
- Moderate content as needed

### 4.5 Trademark/Person Name Handling

The protocol:
- Does not grant trademark rights
- Does not prevent others from using registered words
- Treats all registrations equally regardless of trademark status
- May require additional verification for person names

## 5. On-Chain Components

### 5.1 LGU Token

LGU (Language Governance Unit) is the protocol token:
- ERC-20 token on Base network
- Minted by oracle attestation
- Used for staking and governance
- Non-redeemable for fiat

### 5.2 Staking Rewards

LGU rewards are distributed based on:
- Oracle scoring of staked sentences
- Protocol participation
- Contribution to data quality

### 5.3 Fee Distribution

Protocol fees (0.2%) are distributed:
- Treasury: Protocol development
- LPs: Liquidity provision rewards
- Oracle: Data collection incentives

## 6. API and Access

### 6.1 API Tiers

- **Free**: 100 requests/day
- **Pro**: 10,000 requests/day
- **Enterprise**: Unlimited access

### 6.2 API Key Enforcement

All API requests require:
- Valid API key
- Rate limit enforcement
- Usage tracking
- Billing integration

## 7. Security

### 7.1 Secret Management

- All secrets in environment variables only
- No hardcoded keys in code
- Regular secret rotation
- Secret scanning in CI/CD

### 7.2 Oracle Security

- Oracle private key isolated
- Signed attestations for all runs
- Hash chain verification
- Emergency pause capability

## 8. Verification

### 8.1 Reproducibility Verification

Users can verify oracle runs by:
1. Fetching input data snapshot
2. Applying normalization rules
3. Running pricing formula
4. Comparing output hash
5. Verifying signature

### 8.2 Public Ledger Access

Historical oracle runs are publicly accessible via:
- API endpoint: `/api/oracle/runs`
- GraphQL subgraph
- Direct database query (public read-only)

## 9. Economic Purpose

### 9.1 Protocol Utilities

LGU token provides:
- API access payments
- Registry status
- Staking rewards
- Governance rights
- Composable asset creation

### 9.2 No Investment Promise

The protocol does NOT promise:
- Price appreciation
- Returns on investment
- Dividends or yield
- Financial gains

## 10. Future Roadmap

### 10.1 Planned Features

- Multi-chain oracle consensus
- LP yield engine
- Institutional API product
- Quant dashboard with alpha signals
- Automated market making vault strategies

### 10.2 Governance

Future governance will be:
- Token-holder voting
- Proposal system
- Parameter adjustment
- Source quality decisions

## 11. Version History

- **v1.0.0**: Initial protocol specification
  - 43 linguistic primitives
  - Reproducible oracle runs
  - Anti-manipulation safeguards
  - Registry for word/sentence assets

## 12. Contact and Support

- GitHub: https://github.com/overandor/language-fi
- Documentation: https://language.fi/docs
- Support: support@language.fi

## 13. License

MIT License - See LICENSE file for details

## 14. Disclaimer

This protocol is provided as-is without warranties of any kind. Users should conduct their own research before participating. The protocol does not provide financial advice or guarantee any returns.
