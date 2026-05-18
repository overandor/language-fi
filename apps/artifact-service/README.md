# LGU Artifact Minting - Proof-of-Value System

Production-safe artifact minting system that converts visual artifacts into LGU tokens through cryptographic verification, not fiat conversion.

## Overview

This system implements a **Proof-of-Value Artifact** pattern that:
- Uploads images to IPFS (content-addressed, immutable CIDs)
- Analyzes artifacts with OCR and computer vision
- Detects fraud via perceptual hashing and duplicate detection
- Calculates protocol scores (not dollar values)
- Mints LGU credits based on verified scores
- Enforces per-wallet caps and anti-farming rules

**Critical Design Principle**: No fiat linkage. This is a score → emission system, not a conversion system. LGU credits are non-redeemable and usable only within the protocol.

## Architecture

```
┌─────────────┐
│   Frontend  │
│   (Upload)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Artifact Ingestion Service                      │
├─────────────────────────────────────────────────────────────┤
│  1. IPFS Upload → CID                                      │
│  2. OCR Analysis (denomination, year, confidence)          │
│  3. Fraud Detection (perceptual hash, duplicates)          │
│  4. Scoring Engine (confidence, rarity, novelty, dist)     │
│  5. Gating Rules (daily caps, rate limits)                  │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Oracle Signature Service                      │
├─────────────────────────────────────────────────────────────┤
│  • Generate cryptographic attestation                      │
│  • Sign (cid, score, amount, nonce, chainId)                │
│  • Replay protection via nonces                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Smart Contract (LGUArtifact)                   │
├─────────────────────────────────────────────────────────────┤
│  • Verify oracle signature                                  │
│  • Check CID uniqueness                                     │
│  • Enforce daily caps                                       │
│  • Mint LGU tokens                                          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Smart Contract (`LGUArtifact.sol`)

Solidity contract that enforces on-chain rules:
- CID uniqueness tracking (prevents replay)
- Oracle signature verification
- Daily per-wallet caps
- Maximum per-image limits
- Nonce-based replay protection

**Key Functions**:
- `mintFromArtifact(cid, score, amount, nonce, signature)` - Mints LGU from verified attestation
- `setOracle(address)` - Updates oracle address
- `isCidUsed(bytes32)` - Checks if CID was already used

### 2. Ingestion Service (`ingestion.py`)

Python service that processes artifacts:
- **IPFS Integration**: Uploads to Pinata or local IPFS node
- **OCR Analysis**: Extracts denomination, year, confidence using Tesseract or cloud APIs
- **Fraud Detection**: Perceptual hashing, duplicate detection, anomaly detection
- **Scoring Engine**: Multi-factor scoring (confidence, rarity, novelty, distribution)

**Scoring Formula**:
```
score = 0.4 * confidence + 0.2 * rarity + 0.2 * novelty + 0.2 * distribution
mintAmount = min(MAX_PER_IMAGE, BASE_EMISSION * score)
```

### 3. Oracle Signature Service (`oracle.py`)

Generates cryptographic attestations:
- Signs message: `(cid, score, amount, nonce, chainId)`
- Uses Ethereum private key for signature
- Provides verification function for testing
- Manages nonce allocation for replay protection

### 4. Gating Rules Service (`gating.py`)

Enforces anti-farming measures:
- Daily caps (default: 10,000 LGU)
- Weekly caps (default: 50,000 LGU)
- Submission rate limits (max 10 per day)
- Minimum time between submissions (300s)
- Suspicious activity detection
- Blacklist management

### 5. Frontend UI (`index.html`)

Modern, responsive web interface:
- Drag-and-drop image upload
- Real-time wallet connection (Web3)
- Analysis results display
- Step-by-step progress indicator
- Mint transaction initiation

## Installation

### Prerequisites

```bash
# Python dependencies
pip install requests pillow imagehash numpy eth-account web3

# Optional: Tesseract for local OCR
# macOS
brew install tesseract tesseract-lang

# Ubuntu
sudo apt-get install tesseract-ocr

# Optional: Cloud OCR (Google Vision, AWS Textract)
# Set USE_CLOUD_OCR=true and configure API keys
```

### Environment Variables

```bash
# IPFS Configuration
IPFS_API_URL="http://localhost:5001"  # Local IPFS node
PINATA_API_KEY="your-pinata-api-key"
PINATA_SECRET_KEY="your-pinata-secret-key"

# OCR Configuration
USE_CLOUD_OCR="false"  # Set to true for cloud OCR

# Oracle Configuration
ORACLE_PRIVATE_KEY="your-oracle-private-key"  # Use KMS in production
CHAIN_ID="1"  # Mainnet, 5 for Goerli testnet

# Gating Configuration
DAILY_CAP="10000"
WEEKLY_CAP="50000"
MAX_SUBMISSIONS_PER_DAY="10"
MIN_TIME_BETWEEN_SUBMISSIONS="300"
```

## Deployment

### Smart Contract Deployment

```bash
# Using Hardhat
npx hardhat compile
npx hardhat run scripts/deploy.js --network mainnet

# Or using Remix IDE
# 1. Paste LGUArtifact.sol
# 2. Compile
# 3. Deploy with constructor parameters (lguToken address, oracle address)
```

### Backend Service Deployment

```bash
# Install dependencies
cd apps/artifact-service
pip install -r requirements.txt

# Run locally
python main.py

# Deploy to Railway/Render
railway up
# or
render deploy
```

### Frontend Deployment

```bash
# Deploy to Vercel
cd apps/artifact-ui
vercel --prod

# Or serve locally
python -m http.server 8000
```

## Usage

### User Flow

1. **Connect Wallet**: User connects Web3 wallet (MetaMask, WalletConnect)
2. **Upload Artifact**: User uploads image of artifact
3. **Analysis**: System analyzes image (OCR, fraud detection, scoring)
4. **Attestation**: Oracle generates cryptographic signature
5. **Minting**: User calls smart contract with attestation
6. **Staking**: User can stake minted LGU tokens

### API Endpoints

**POST /api/artifact/analyze**
```json
{
  "image_data": "base64_encoded_image",
  "wallet_address": "0x..."
}
```

Response:
```json
{
  "cid": "QmXxx...",
  "confidence": 0.85,
  "denomination": 100,
  "score": 63.0,
  "mint_amount": 630.0,
  "attestation": {
    "cid": "QmXxx...",
    "score": 63.0,
    "amount": 630.0,
    "nonce": 12345,
    "signature": "0x...",
    "chain_id": 1
  }
}
```

**GET /api/wallet/stats?address=0x...**
```json
{
  "daily_mints": 2500,
  "weekly_mints": 8000,
  "daily_submissions": 3,
  "daily_remaining": 7500,
  "weekly_remaining": 42000,
  "submissions_remaining": 7
}
```

## Security Considerations

### Fraud Prevention

1. **CID Uniqueness**: Each CID can only be used once (prevents replay)
2. **Perceptual Hashing**: Detects similar images (prevents minor edits)
3. **Distribution Scoring**: Penalizes users dominating submissions
4. **Anomaly Detection**: Flags unusual image properties

### Anti-Farming

1. **Daily Caps**: Limits total LGU per wallet per day
2. **Weekly Caps**: Limits total LGU per wallet per week
3. **Rate Limits**: Minimum time between submissions
4. **Submission Limits**: Maximum artifacts per day
5. **Suspicious Activity Detection**: Flags abnormal patterns

### Oracle Security

1. **Private Key Protection**: Use KMS or HSM in production
2. **Nonce Management**: Prevents signature replay
3. **Chain ID Binding**: Prevents cross-chain replay
4. **Signature Verification**: Contract verifies before minting

### Regulatory Compliance

**Critical**: This system does NOT:
- Convert photos to fiat currency
- Promise redemption for cash
- Claim tokens equal bill value
- Imply custody of funds

This system DOES:
- Use protocol scores (not dollar values)
- Mint non-redeemable credits
- Use credits only within protocol
- Make no claims on physical cash

## Monitoring

### Key Metrics

- Total artifacts processed
- Unique CIDs minted
- Fraud detection rate
- Average score distribution
- Daily mint volume
- Active wallets
- Suspicious activity flags

### Alerts

- High fraud detection rate
- Unusual submission patterns
- Oracle signature failures
- Smart contract errors
- IPFS upload failures

## Development

### Running Locally

```bash
# Start IPFS daemon
ipfs daemon

# Start backend service
cd apps/artifact-service
python main.py

# Start frontend
cd apps/artifact-ui
python -m http.server 8000
```

### Testing

```bash
# Run unit tests
pytest tests/

# Run integration tests
pytest tests/integration/

# Test smart contract
npx hardhat test
```

## Troubleshooting

### OCR Issues

**Problem**: Low confidence scores
**Solution**: 
- Ensure high-resolution images
- Use cloud OCR for better accuracy
- Check lighting and focus

### IPFS Upload Failures

**Problem**: Upload timeout
**Solution**:
- Check IPFS daemon status
- Use Pinata for more reliable uploads
- Increase timeout values

### Oracle Signature Failures

**Problem**: Invalid signature
**Solution**:
- Verify oracle private key
- Check chain ID matches deployment
- Ensure nonce is unique

### Smart Contract Reverts

**Problem**: Transaction reverted
**Solution**:
- Check CID uniqueness
- Verify daily cap not exceeded
- Confirm oracle signature is valid

## Future Enhancements

1. **Advanced Vision Models**: Use CLIP or similar for better analysis
2. **Time Decay**: Reduce score for older artifacts
3. **Community Governance**: Let token holders vote on parameters
4. **Multi-Chain Support**: Deploy on multiple chains
5. **Mobile App**: Native mobile application
6. **Batch Processing**: Process multiple artifacts at once
7. **NFT Integration**: Create NFTs for verified artifacts
8. **Marketplace**: Allow trading of verified artifacts

## License

MIT License

## Disclaimer

This system is for educational and demonstration purposes. LGU tokens have no intrinsic value and are not redeemable for fiat currency. Users should comply with all applicable laws and regulations in their jurisdiction.
