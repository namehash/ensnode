#!/bin/bash

set -e

echo "🌈 Setting up ENSRainbow..."
cd /workspaces/ensnode/apps/ensrainbow

# Check if data file exists, download if not
if [ ! -f "ens_names.sql.gz" ]; then
  echo "📥 Downloading ENSRainbow data..."
  ./download-rainbow-tables.sh
fi

# Check if data directory is empty
if [ ! -d "data" ] || [ -z "$(ls -A data 2>/dev/null)" ]; then
  echo "🔄 Ingesting ENSRainbow data..."
  pnpm ingest
  rm ens_names.sql.gz
  pnpm validate:lite
fi

# Start the ENSRainbow service in the background
echo "🚀 Starting ENSRainbow service..."
nohup pnpm serve > /tmp/ensrainbow.log 2>&1 &

echo "✅ ENSRainbow setup complete!"
