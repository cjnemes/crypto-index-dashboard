#!/bin/sh
# Daily price collection scheduler
# Runs at 12:00 UTC (configurable via COLLECT_HOUR env var)

COLLECT_HOUR=${COLLECT_HOUR:-12}
API_URL=${API_URL:-http://crypto-dashboard:3000/api/collect}
BACKUP_DIR=${BACKUP_DIR:-/app/data/backups}

log() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $1"
}

collect_prices() {
    log "Starting price collection..."

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Authorization: Bearer $COLLECT_API_KEY" \
        -H "Content-Type: application/json")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        log "Collection successful: $BODY"
        return 0
    else
        log "Collection failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

backup_database() {
    log "Creating database backup..."

    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/crypto-index-$(date -u '+%Y%m%d-%H%M%S').db"

    if cp /app/data/crypto-index.db "$BACKUP_FILE" 2>/dev/null; then
        log "Backup created: $BACKUP_FILE"

        # Keep only last 7 daily backups
        ls -t "$BACKUP_DIR"/crypto-index-*.db 2>/dev/null | tail -n +8 | xargs -r rm
        log "Old backups cleaned up (keeping last 7)"
        return 0
    else
        log "Backup failed"
        return 1
    fi
}

# Main loop
log "Scheduler started. Collection scheduled at ${COLLECT_HOUR}:00 UTC daily."

while true; do
    CURRENT_HOUR=$(date -u '+%H' | sed 's/^0//')
    CURRENT_MIN=$(date -u '+%M' | sed 's/^0//')

    # Run at the scheduled hour (with 5-minute window)
    if [ "$CURRENT_HOUR" = "$COLLECT_HOUR" ] && [ "$CURRENT_MIN" -lt 5 ]; then
        # Backup before collection
        backup_database

        # Collect prices
        collect_prices

        # Sleep for 1 hour to avoid duplicate runs
        log "Sleeping for 1 hour..."
        sleep 3600
    else
        # Check every 5 minutes
        sleep 300
    fi
done
