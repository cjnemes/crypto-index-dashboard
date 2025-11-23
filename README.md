# Crypto Index Dashboard

A Next.js dashboard for tracking cryptocurrency index performance against BTC and ETH benchmarks, with SQLite database for historical tracking.

## Features

- **Live Price Collection** - Fetches current prices from CoinMarketCap Pro API
- **Historical Tracking** - SQLite database stores price history for trend analysis
- **Time-Series Charts** - Interactive charts showing index performance over time
- **Performance Comparison** - Compare all indexes against BTC and ETH benchmarks
- **Docker Ready** - Easy deployment with persistent database storage

## Indexes Tracked

| Index | Description |
|-------|-------------|
| **Nemes 100 MCW** | Top 100 cryptocurrencies, market cap weighted |
| **Nemes 100 EW** | Top 100 cryptocurrencies, equal weighted |
| **DeFi 25 MCW** | Top 25 DeFi tokens, market cap weighted |
| **DeFi 25 EW** | Top 25 DeFi tokens, equal weighted |
| **Infra 25 MCW** | Top 25 infrastructure tokens, market cap weighted |
| **Infra 25 EW** | Top 25 infrastructure tokens, equal weighted |

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

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker Deployment

```bash
# Set up environment
cp .env.example .env
# Edit .env and add your CMC_API_KEY

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Get current index data for dashboard |
| `/api/history` | GET | Get historical price data |
| `/api/collect` | POST | Trigger price collection from CMC |
| `/api/collect` | GET | Get collection status and logs |
| `/api/prices` | GET | Get latest prices |

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

# Open Prisma Studio (database GUI)
npm run db:studio

# Run database migrations
npm run db:migrate
```

## Scheduled Price Collection

For automated price collection, you can:

1. **Use cron** - Schedule `npm run collect-prices` to run daily
2. **Use n8n** - Call `POST /api/collect` endpoint on a schedule
3. **Use the UI** - Click "Collect" button in the dashboard

Example cron entry (daily at midnight):
```
0 0 * * * cd /path/to/crypto-index-dashboard && npm run collect-prices
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CMC_API_KEY` | Yes | CoinMarketCap Pro API key |
| `DATABASE_URL` | No | SQLite database path (default: `file:./prisma/dev.db`) |
| `COLLECT_API_KEY` | No | Optional API key to protect `/api/collect` endpoint |

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: SQLite with Prisma ORM
- **Deployment**: Docker

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
│   │   ├── page.tsx       # Main dashboard
│   │   └── layout.tsx     # App layout
│   ├── components/        # React components
│   └── lib/               # Utilities and config
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed script
│   └── migrations/        # Database migrations
├── scripts/
│   └── collect-prices.ts  # Price collection script
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT
