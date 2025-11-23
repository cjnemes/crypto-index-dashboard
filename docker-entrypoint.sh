#!/bin/sh
set -e

# Directory for database
DATA_DIR="/app/data"
DB_FILE="$DATA_DIR/crypto-index.db"

echo "Starting Crypto Index Dashboard..."

# Ensure data directory exists
mkdir -p "$DATA_DIR"

# Check if database exists
if [ -f "$DB_FILE" ]; then
    echo "Found existing database at $DB_FILE"
    echo "Skipping initialization to preserve existing data"
else
    echo "No existing database found. Initializing..."

    # Run migrations to create schema
    if [ -d "/app/prisma/migrations" ]; then
        echo "Running database migrations..."
        npx prisma migrate deploy 2>/dev/null || echo "Migration deploy not available, using db push..."
        npx prisma db push --skip-generate 2>/dev/null || true
    fi

    echo "Database initialized at $DB_FILE"
fi

# Start the application
echo "Starting Next.js server..."
exec node server.js
