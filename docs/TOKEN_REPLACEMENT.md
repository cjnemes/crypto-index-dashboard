# Token Replacement Guide

This document describes how to replace a token in an index during the setup phase.

## Overview

Replacing a token requires updating:
1. Code files (token definitions)
2. Database (TokenConfig table)
3. Index snapshots (recalculation)
4. Docker deployment (rebuild + database sync)

## Step-by-Step Process

### 1. Update Token Definition Files

#### `src/lib/tokens.ts`
Replace the token object in the appropriate index array (N100, DEFI, or INFRA):

```typescript
// Before
{ symbol: 'OLD_TOKEN', name: 'Old Token Name', sector: 'Sector' },

// After
{ symbol: 'NEW_TOKEN', name: 'New Token Name', sector: 'Sector' },
```

#### `src/app/api/collect/route.ts`
Update the INDEX_TOKENS constant:

```typescript
// Replace OLD_TOKEN with NEW_TOKEN in the appropriate array
N100: ['...', 'NEW_TOKEN', '...'],
DEFI: ['...', 'NEW_TOKEN', '...'],
```

#### `src/lib/coingecko-ids.ts`
Add/update CoinGecko ID mapping:

```typescript
'NEW_TOKEN': 'coingecko-slug-here',
```

#### `scripts/backfill-cmc.ts`
Add/update CoinMarketCap ID mapping:

```typescript
'NEW_TOKEN': 12345,  // CMC numeric ID
```

### 2. Find API IDs for New Token

#### CoinMarketCap ID
```bash
npx tsx -e "
const CMC_API_KEY = process.env.CMC_API_KEY || '';
fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=NEW_TOKEN', {
  headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY, 'Accept': 'application/json' }
})
.then(r => r.json())
.then(d => d.data?.forEach(t => console.log({id: t.id, name: t.name, slug: t.slug})));
"
```

#### CoinGecko ID
Search on https://www.coingecko.com and use the slug from the URL.

### 3. Update Database

```bash
# Add new token to TokenConfig
sqlite3 prisma/dev.db "
INSERT INTO TokenConfig (symbol, name, sector, indexes, isActive, createdAt, updatedAt)
VALUES ('NEW_TOKEN', 'New Token Name', 'Sector', 'N100,DEFI', 1, datetime('now'), datetime('now'));
"

# Deactivate old token
sqlite3 prisma/dev.db "
UPDATE TokenConfig SET isActive = 0, updatedAt = datetime('now') WHERE symbol = 'OLD_TOKEN';
"

# If token already exists, update its indexes
sqlite3 prisma/dev.db "
UPDATE TokenConfig SET indexes = 'N100,DEFI', updatedAt = datetime('now') WHERE symbol = 'EXISTING_TOKEN';
"
```

### 4. Fetch Historical Price Data

```bash
npm run backfill-cmc
```

This fetches ~12 months of historical prices for new tokens.

### 5. Recalculate Index Snapshots

Delete existing snapshots for affected indexes and recalculate:

```bash
# For N100 changes
sqlite3 prisma/dev.db "DELETE FROM IndexSnapshot WHERE indexName LIKE 'N100%';"

# For DEFI changes
sqlite3 prisma/dev.db "DELETE FROM IndexSnapshot WHERE indexName LIKE 'DEFI%';"

# For INFRA changes
sqlite3 prisma/dev.db "DELETE FROM IndexSnapshot WHERE indexName LIKE 'INFRA%';"

# Recalculate all indexes
npm run backfill-cmc
```

### 6. Update Docker Deployment

```bash
# Stop container
docker-compose down

# Rebuild with new code
docker-compose build --no-cache

# Copy updated database to Docker volume
docker run --rm \
  -v crypto-index-dashboard_crypto-data:/data \
  -v $(pwd)/prisma:/src \
  alpine cp /src/dev.db /data/crypto-index.db

# Start container
docker-compose up -d
```

### 7. Verify Changes

```bash
# Check API response for new token
curl -s "http://localhost:3005/api/index/N100-MCW" | jq '.constituents[] | .symbol' | grep NEW_TOKEN

# Verify old token removed
curl -s "http://localhost:3005/api/index/N100-MCW" | jq '.constituents[] | .symbol' | grep OLD_TOKEN
```

### 8. Commit and Push

```bash
git add -A
git commit -m "Update INDEX: replace OLD_TOKEN with NEW_TOKEN"
git push
```

## Quick Reference: Files to Update

| File | What to Update |
|------|----------------|
| `src/lib/tokens.ts` | Token object in index array |
| `src/app/api/collect/route.ts` | Symbol in INDEX_TOKENS |
| `src/lib/coingecko-ids.ts` | CoinGecko slug mapping |
| `scripts/backfill-cmc.ts` | CMC numeric ID mapping |
| Database | TokenConfig table |

## Notes

- Always backup the database before making changes: `cp prisma/dev.db prisma/dev.db.backup`
- The index divisor will change slightly when tokens are replaced (different market caps at inception)
- Historical index values are recalculated from inception date (2024-11-25)
- Tokens can be in multiple indexes (e.g., AERO is in both N100 and DEFI)
- All MCW indexes use **25% capped market cap weighting**

## Recalculating Historical Snapshots

If you need to recalculate all historical index snapshots (e.g., after methodology changes):

```bash
# Run the recalculation script
npx tsx scripts/recalculate-capped-indexes.ts

# This will:
# 1. Calculate capped weights at inception for each MCW index
# 2. Determine fixed shares for each constituent
# 3. Recalculate all historical snapshots using: Index = Sum(Shares × Price) / Divisor
```

The script processes all MCW indexes and updates any snapshots where the recalculated value differs by more than 0.01%.
