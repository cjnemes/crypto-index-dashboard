# Crypto Index Dashboard

A Next.js dashboard for tracking cryptocurrency index performance against BTC and ETH benchmarks, with SQLite database for historical tracking.

## Index Methodology

This dashboard uses **capped market cap weighted (MCW) methodology** similar to MSCI Capped Indexes and the DeFi Pulse Index, providing professional-grade index calculation with diversification.

### Key Parameters
- **Inception Date**: November 25, 2024
- **Base Value**: 1000 (all indexes start at this value)
- **Weight Cap**: 25% maximum per constituent
- **Data Source**: CoinMarketCap Pro API
- **Update Frequency**: Daily snapshots at 12:00 UTC

### Calculation Method

**Capped Market Cap Weighted (MCW)**
```
1. Calculate raw weights from market caps
2. Cap any constituent exceeding 25%
3. Redistribute excess weight proportionally to uncapped constituents
4. Calculate shares at inception using capped weights
5. Index Value = Sum(Shares × Current Price) / Divisor
```

For complete methodology documentation, see [docs/INDEX_METHODOLOGY.md](docs/INDEX_METHODOLOGY.md).

## Features

- **Live Price Collection** - Fetches current prices from CoinMarketCap Pro API
- **Historical Tracking** - SQLite database stores 364 days of price history
- **Divisor-Based Indexes** - Professional methodology like S&P 500
- **Time-Series Charts** - Interactive charts showing index performance over time
- **Performance Comparison** - Compare all indexes against BTC and ETH benchmarks
- **Individual Index Pages** - Detailed view for each index with holdings breakdown
- **Docker Ready** - Easy deployment with persistent database storage

## Indexes Tracked

### Core Indexes

| Index | Description | Tokens |
|-------|-------------|--------|
| **N100-MCW** | Nemes 100 - Top 100 altcoins | 100 |
| **DEFI-MCW** | DeFi 25 - Top DeFi protocols | 25 |
| **INFRA-MCW** | Infra 25 - Infrastructure tokens | 25 |

### Sector Sub-Indexes

| Index | Description | Tokens | Parent |
|-------|-------------|--------|--------|
| **L1-MCW** | Layer 1 smart contract platforms | 24 | N100 |
| **SCALE-MCW** | L2s + Layer 0 interoperability | 9 | N100 |
| **AI-MCW** | AI, GPU, Compute, IoT | 10 | INFRA |
| **GAMING-MCW** | Gaming, Metaverse, NFT | 8 | N100 |
| **DEX-MCW** | Decentralized Exchanges | 11 | DEFI |
| **YIELD-MCW** | Lending, Derivatives, Staking | 11 | DEFI |
| **DATA-MCW** | Oracles, Storage, Indexing | 10 | INFRA |

**Benchmarks**: BTC (Bitcoin) and ETH (Ethereum)

All indexes use 25% capped market cap weighting.

## Quick Start

### Prerequisites

- Node.js 18+
- CoinMarketCap Pro API key

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your CMC_API_KEY

# Initialize database
npx prisma migrate dev

# Seed initial data
npm run db:seed

# Collect initial prices
npm run collect-prices

# Run development server (port 3005)
npm run dev -- -p 3005
```

Open [http://localhost:3005](http://localhost:3005)

### Docker Deployment

#### Fresh Deployment

```bash
# Set up environment
cp .env.example .env
# Edit .env and add your CMC_API_KEY

# Build and run
docker-compose up -d

# Initialize database (first time only)
docker-compose exec crypto-dashboard npx prisma migrate deploy
docker-compose exec crypto-dashboard npx prisma db seed

# Collect initial prices
curl -X POST http://localhost:3000/api/collect

# View logs
docker-compose logs -f
```

#### Deploying with Existing Database

To preserve your existing database when moving to Docker:

```bash
# 1. Create the Docker volume first
docker volume create crypto-index-dashboard_crypto-data

# 2. Copy your existing database to the volume
docker run --rm -v crypto-index-dashboard_crypto-data:/data -v $(pwd)/prisma:/src alpine cp /src/dev.db /data/crypto-index.db

# 3. Build and start the container
docker-compose up -d

# 4. Verify data is preserved
curl http://localhost:3000/api/collect | jq '.totalSnapshots'
```

#### Docker Commands

```bash
# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build

# Remove everything (CAUTION: deletes database!)
docker-compose down -v
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Get current index data for dashboard |
| `/api/history` | GET | Get historical price data |
| `/api/collect` | POST | Trigger price collection from CMC |
| `/api/collect` | GET | Get collection status and logs |
| `/api/prices` | GET | Get latest prices |
| `/api/index/[symbol]` | GET | Get detailed index data |
| `/api/index/[symbol]/holdings` | GET | Get index holdings with weights |

### Query Parameters

**GET /api/history**
- `period`: `7d`, `30d`, `90d`, `1y`, `all` (default: `30d`)
- `index`: Filter by specific index symbol

## Scripts

```bash
# Seed database with token/index configurations
npm run db:seed

# Collect prices from CoinMarketCap
npm run collect-prices

# Backfill historical data from CoinGecko
npm run backfill-coingecko

# Open Prisma Studio (database GUI)
npm run db:studio

# Run database migrations
npm run db:migrate
```

## Scheduled Price Collection

For automated daily price collection:

### Option 1: Cron Job
```bash
# Daily at noon UTC
0 12 * * * cd /path/to/crypto-index-dashboard && npm run collect-prices
```

### Option 2: n8n Workflow
Create a workflow that calls `POST /api/collect` on a schedule.

### Option 3: Manual
Click the "Collect" button in the dashboard UI.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CMC_API_KEY` | Yes | CoinMarketCap Pro API key |
| `DATABASE_URL` | No | SQLite path (default: `file:./prisma/dev.db`) |
| `COLLECT_API_KEY` | No | Protect `/api/collect` endpoint |

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: SQLite with Prisma ORM
- **Deployment**: Docker with persistent volumes

## Database Schema

```
Price           - Individual token prices from CMC
IndexSnapshot   - Calculated index values over time
TokenConfig     - Token definitions and index membership
IndexConfig     - Index configurations (MCW/EW methodology)
CollectionLog   - Price collection job history
```

## Project Structure

```
crypto-index-dashboard/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── dashboard/ # Dashboard data endpoint
│   │   │   ├── collect/   # Price collection endpoint
│   │   │   └── index/     # Individual index endpoints
│   │   ├── index/         # Index detail pages
│   │   ├── page.tsx       # Main dashboard
│   │   └── layout.tsx     # App layout
│   ├── components/        # React components
│   │   ├── IndexCard.tsx
│   │   ├── HistoryChart.tsx
│   │   ├── TopHoldingsSection.tsx
│   │   └── ...
│   └── lib/               # Utilities and config
│       ├── tokens.ts      # Index definitions
│       └── prisma.ts      # Database client
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed script
│   └── migrations/        # Database migrations
├── scripts/
│   ├── collect-prices.ts  # CLI price collection
│   └── backfill-*.ts      # Historical data scripts
├── docs/
│   └── INDEX_METHODOLOGY.md  # Detailed methodology docs
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Data Quality

- **Coverage**: 364 daily snapshots per index (Nov 25, 2024 - present)
- **Inception**: All custom indexes start at exactly 1000.0
- **Accuracy**: Divisor-based calculation ensures consistency with major index providers

## License

MIT
