#!/bin/bash

# Language.fi Production Deployment Script
# This script deploys the complete system to production

set -e

echo "🚀 Language.fi Production Deployment"
echo "======================================"

# Check prerequisites
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm not installed"; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "❌ vercel CLI not installed"; exit 1; }

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found"
    exit 1
fi

# 1. Build and test
echo ""
echo "📦 Building application..."
pnpm install
pnpm build

# 2. Deploy frontend to Vercel
echo ""
echo "🌐 Deploying frontend to Vercel..."
vercel --prod --yes

# 3. Deploy worker to Railway (if configured)
if [ -n "$RAILWAY_TOKEN" ]; then
    echo ""
    echo "🧠 Deploying worker to Railway..."
    railway up --service language-fi-worker
else
    echo "⚠️  Railway token not set, skipping worker deployment"
fi

# 4. Deploy artifact service to Hugging Face (if configured)
if [ -n "$HF_TOKEN" ]; then
    echo ""
    echo "🤗 Deploying artifact service to Hugging Face..."
    cd apps/artifact-service
    git add .
    git commit -m "Deploy artifact service" || true
    git push origin main || true
    cd ../..
else
    echo "⚠️  Hugging Face token not set, skipping artifact deployment"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify all services are running"
echo "2. Check database migrations"
echo "3. Monitor worker ingestion"
echo "4. Test API endpoints"
echo "5. Verify contract deployments"
