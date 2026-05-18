# Deployment Guide - LGU Artifact Minting System

This guide covers deploying the LGU Artifact Minting system to Vercel (frontend) and Hugging Face Spaces (backend).

## Architecture

```
Frontend (Vercel) → Backend API (Hugging Face) → Smart Contract
     ↓                    ↓
  Static HTML        FastAPI + Gradio
  + Web3             + Artifact Processing
```

## Prerequisites

- Vercel account (free tier works)
- Hugging Face account (free Spaces tier)
- GitHub account (for Vercel deployment)
- Ethereum wallet with some ETH for gas fees

## 1. Deploy Backend to Hugging Face Spaces

### Step 1: Create Hugging Face Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Choose "Gradio" as the SDK
4. Name your space (e.g., `lgu-artifact-service`)
5. Make it Public or Private
6. Click "Create Space"

### Step 2: Configure Space

Your Space will have a git repository. Clone it:

```bash
git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
cd YOUR_SPACE_NAME
```

### Step 3: Add Artifact Service Files

Copy the artifact service files to your Space:

```bash
# From the language-fi repository
cp -r /Users/jo/Downloads/language-fi/apps/artifact-service/* .
```

### Step 4: Add Gradio Requirements

Create `requirements.txt` in your Space:

```txt
gradio==4.7.1
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
requests==2.31.0
pillow==10.1.0
imagehash==4.3.1
numpy==1.26.2
eth-account==0.10.0
web3==6.11.3
```

### Step 5: Configure Environment Variables

In your Hugging Face Space settings, add these environment variables:

```bash
ORACLE_PRIVATE_KEY=your-oracle-private-key-here
CHAIN_ID=1  # or 5 for Goerli testnet
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
USE_CLOUD_OCR=false
DAILY_CAP=10000
WEEKLY_CAP=50000
```

**Important**: Never commit private keys to git. Always use environment variables.

### Step 6: Deploy

```bash
git add .
git commit -m "Deploy LGU Artifact Service"
git push
```

Hugging Face will automatically build and deploy your Space.

### Step 7: Verify

Visit your Space URL (e.g., `https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`) to verify it's working.

## 2. Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import the artifact-ui directory or connect to GitHub

### Step 2: Configure Project

Set the following in Vercel project settings:

**Root Directory**: `apps/artifact-ui`

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # Your deployed contract address
NEXT_PUBLIC_CHAIN_ID=1  # or 5 for Goerli testnet
```

### Step 3: Deploy

Vercel will automatically deploy. You can also deploy manually:

```bash
cd apps/artifact-ui
vercel --prod
```

### Step 4: Verify

Visit your Vercel URL to verify the frontend is working.

## 3. Deploy Smart Contract

### Step 1: Compile Contract

```bash
cd packages/web3/contracts
npx hardhat compile
```

### Step 2: Deploy to Testnet (Recommended First)

```bash
npx hardhat run scripts/deploy.js --network goerli
```

### Step 3: Deploy to Mainnet

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Step 4: Verify Contract

Use Etherscan or Block Explorer to verify your contract.

### Step 5: Update Frontend

Update the `NEXT_PUBLIC_CONTRACT_ADDRESS` environment variable in Vercel with your deployed contract address.

## 4. Configure Oracle

The oracle service needs a private key to sign attestations.

### Option 1: Use Existing Wallet

Use an existing wallet's private key:

```bash
# Export private key (never commit this!)
export ORACLE_PRIVATE_KEY=0x...
```

### Option 2: Create Dedicated Oracle Wallet

Create a new wallet specifically for oracle operations:

```python
from eth_account import Account
account = Account.create()
print(f"Address: {account.address}")
print(f"Private Key: {account.key.hex()}")
```

**Important**: Store the private key securely (use AWS KMS, HashiCorp Vault, or similar in production).

## 5. Testing the Full Flow

### Test Backend API

```bash
curl -X POST https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME/api/artifact/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image_data": "base64_encoded_image",
    "wallet_address": "0x..."
  }'
```

### Test Frontend

1. Open your Vercel URL
2. Connect wallet
3. Upload test image
4. Verify analysis results
5. Test minting (on testnet first)

## 6. Monitoring

### Hugging Face Spaces

- Monitor Space logs in the "Logs" tab
- Check CPU/memory usage
- Monitor API response times

### Vercel

- Monitor build logs
- Check analytics
- Set up error tracking (Sentry, etc.)

### Smart Contract

- Monitor contract events
- Track mint volume
- Set up alerts for unusual activity

## 7. Security Checklist

- [ ] Private keys stored in environment variables (not in code)
- [ ] Contract verified on Etherscan
- [ ] Oracle wallet has limited permissions
- [ ] Rate limits configured
- [ ] CORS configured correctly
- [ ] HTTPS enabled
- [ ] Daily/weekly caps set appropriately
- [ ] Blacklist functionality tested
- [ ] Fraud detection tested
- [ ] Gating rules tested

## 8. Troubleshooting

### Hugging Face Space Issues

**Build fails**: Check requirements.txt and dependencies
**Runtime errors**: Check Space logs
**Memory issues**: Upgrade to larger Space tier

### Vercel Issues

**Build fails**: Check vercel.json configuration
**Environment variables not loading**: Check Vercel project settings
**API calls failing**: Check CORS configuration

### Smart Contract Issues

**Transaction reverted**: Check gas limits, contract parameters
**Oracle signature invalid**: Verify oracle private key is correct
**CID already used**: Check CID uniqueness tracking

## 9. Cost Estimates

### Hugging Face Spaces

- Free tier: ~$0/month (limited CPU)
- Basic: ~$9/month (better performance)
- Recommended: ~$49/month (production-ready)

### Vercel

- Free tier: ~$0/month (hobby projects)
- Pro: ~$20/month (production)
- Enterprise: Custom pricing

### Ethereum Gas

- Testnet: Free (faucet)
- Mainnet: Variable (depends on gas prices)
- Estimate: $5-50 per mint (depending on network)

## 10. Next Steps

1. Deploy to testnet first
2. Test full flow with small amounts
3. Monitor for issues
4. Deploy to mainnet
5. Set up monitoring and alerts
6. Document operational procedures
7. Plan for scaling (if needed)

## Support

- Hugging Face: https://huggingface.co/docs/hub/spaces
- Vercel: https://vercel.com/docs
- Ethereum: https://ethereum.org/en/developers/
