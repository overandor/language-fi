#!/bin/bash

# Deploy to Vercel
# This script deploys the artifact UI to Vercel

set -e

echo "🚀 Deploying LGU Artifact UI to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📤 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be live on Vercel"
