#!/bin/bash

# Deploy Language.fi API to Hugging Face Spaces
# Note: Set HUGGINGFACE_TOKEN environment variable before running

SPACE_NAME="language-fi-oracle-api"
SPACE_ID="luguog/$SPACE_NAME"

# Login to Hugging Face
echo "Logging in to Hugging Face..."
if [ -n "$HUGGINGFACE_TOKEN" ]; then
    huggingface-cli login --token "$HUGGINGFACE_TOKEN"
else
    echo "Error: HUGGINGFACE_TOKEN environment variable not set"
    exit 1
fi

# Create space
echo "Creating Hugging Face Space..."
huggingface-cli create-space --type gradio --name $SPACE_NAME --id $SPACE_ID --title "Language.fi Oracle API" --description "Live API for letter and number primitive pricing using CoinGecko oracle data"

# Copy files to space
echo "Deploying files..."
cp hf_app.py app.py
cp hf_requirements.txt requirements.txt
cp hf_README.md README.md

# Upload files to Space (not model repository)
echo "Uploading files to Hugging Face Space..."
huggingface-cli upload luguog/language-fi-oracle-api app.py app.py --repo-type space
huggingface-cli upload luguog/language-fi-oracle-api requirements.txt requirements.txt --repo-type space
huggingface-cli upload luguog/language-fi-oracle-api README.md README.md --repo-type space

echo "Deployment complete!"
echo "Space URL: https://huggingface.co/spaces/$SPACE_ID"
