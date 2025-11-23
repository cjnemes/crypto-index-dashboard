#!/bin/sh
# Manual backup script for crypto-index database
# Usage: ./scripts/backup.sh [backup_dir]

BACKUP_DIR=${1:-./backups}
TIMESTAMP=$(date -u '+%Y%m%d-%H%M%S')
DB_FILE="prisma/dev.db"

# For Docker, use the Docker volume
if [ -f "/app/data/crypto-index.db" ]; then
    DB_FILE="/app/data/crypto-index.db"
fi

if [ ! -f "$DB_FILE" ]; then
    echo "Error: Database file not found at $DB_FILE"
    exit 1
fi

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/crypto-index-$TIMESTAMP.db"

echo "Backing up database..."
echo "  Source: $DB_FILE"
echo "  Destination: $BACKUP_FILE"

if cp "$DB_FILE" "$BACKUP_FILE"; then
    # Get file size
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "Backup successful! Size: $SIZE"

    # Show record counts
    if command -v sqlite3 >/dev/null 2>&1; then
        PRICES=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM Price;")
        SNAPSHOTS=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM IndexSnapshot;")
        echo "  Price records: $PRICES"
        echo "  Index snapshots: $SNAPSHOTS"
    fi

    echo ""
    echo "To restore, run:"
    echo "  cp $BACKUP_FILE $DB_FILE"
else
    echo "Backup failed!"
    exit 1
fi
