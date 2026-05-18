#!/bin/bash

# Language.fi Initial Setup Script
# This script sets up the development environment

set -e

echo "🔧 Language.fi Development Setup"
echo "================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Please install Node.js 18+"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Setup database
echo ""
echo "🗄️  Setting up database..."
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Skipping database setup."
else
    cp .env.example .env
    echo "✅ Created .env file. Please configure your environment variables."
fi

# Generate Prisma client
echo ""
echo "🔄 Generating Prisma client..."
pnpm --filter "@languagefi/db" prisma generate

# Run database migrations (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
    echo ""
    echo "🗄️  Running database migrations..."
    pnpm --filter "@languagefi/db" prisma migrate deploy
else
    echo "⚠️  DATABASE_URL not set. Skipping migrations."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure .env with your environment variables"
echo "2. Run database migrations: pnpm --filter '@languagefi/db' prisma migrate dev"
echo "3. Start development server: pnpm dev"
echo "4. Start worker: pnpm --filter '@languagefi/worker' dev"
