#!/bin/bash

# Deploy to Hugging Face Spaces
# This script deploys the artifact service to Hugging Face

set -e

echo "🚀 Deploying LGU Artifact Service to Hugging Face Spaces..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: LGU Artifact Service"
fi

# Check if remote is set
if ! git remote get-url origin &>/dev/null; then
    echo "⚠️  No git remote found. Please add your Hugging Face Space remote:"
    echo "   git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME"
    echo "   Then run this script again."
    exit 1
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy to Hugging Face Spaces" || echo "No changes to commit"

# Push to Hugging Face
echo "📤 Pushing to Hugging Face Spaces..."
git push origin main

echo "✅ Deployment complete!"
echo "🌐 Your Space should be available at: https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME"
