#!/bin/bash

# Deploy Language.fi API to Hugging Face Spaces

HUGGINGFACE_TOKEN="${HUGGINGFACE_TOKEN:-}"
SPACE_NAME="language-fi-oracle-api"
SPACE_ID="luguog/$SPACE_NAME"

# Login to Hugging Face
if [ -z "$HUGGINGFACE_TOKEN" ]; then
    echo "Error: HUGGINGFACE_TOKEN environment variable not set"
    exit 1
fi
echo "Logging in to Hugging Face..."
huggingface-cli login --token $HUGGINGFACE_TOKEN

# Create space
echo "Creating Hugging Face Space..."
huggingface-cli create-space --type gradio --name $SPACE_NAME --id $SPACE_ID --title "Language.fi Oracle API" --description "Live API for letter and number primitive pricing using CoinGecko oracle data"

# Copy files to space
echo "Deploying files..."
cp hf_app.py app.py
cp hf_requirements.txt requirements.txt
cp hf_README.md README.md

# Upload files
echo "Uploading files to Hugging Face..."
huggingface-cli upload $SPACE_ID app.py
huggingface-cli upload $SPACE_ID requirements.txt
huggingface-cli upload $SPACE_ID README.md

echo "Deployment complete!"
echo "Space URL: https://huggingface.co/spaces/$SPACE_ID"
