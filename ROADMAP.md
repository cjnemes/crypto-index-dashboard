# Crypto Index Dashboard Roadmap

## Vision

Build a professional-grade crypto index family comparable to Nasdaq and S&P equity indexes, providing institutional-quality benchmarks for the cryptocurrency market.

---

## Current State (v1.0)

### Core Indexes
| Index | Description | Tokens | Status |
|-------|-------------|--------|--------|
| **N100-MCW** | Nemes 100 Market Cap Weighted | 100 | ✅ Active |
| **DEFI-MCW** | DeFi 25 Market Cap Weighted | 25 | ✅ Active |
| **INFRA-MCW** | Infrastructure 25 Market Cap Weighted | 25 | ✅ Active |

### Benchmarks
- **BTC** - Bitcoin
- **ETH** - Ethereum

### Methodology
- Divisor-based calculation (S&P 500 style)
- Base value: 1000 at inception (Nov 25, 2024)
- Daily snapshots at 12:00 UTC
- Market cap weighted allocation

---

## Phase 1: Index Consolidation (Current)

### Deprecate Equal-Weighted Indexes
- [x] Decision: Remove N100-EW, DEFI-EW, INFRA-EW
- [ ] Mark EW indexes as inactive in database
- [ ] Update UI to show only MCW indexes
- [ ] Archive historical EW data (don't delete)

**Rationale:** Market-cap weighting is the industry standard for investable indexes due to:
- Better liquidity alignment
- Lower rebalancing costs
- More representative of actual market
- Easier to replicate for fund managers

---

## Phase 2: Sector Sub-Indexes

### Proposed New Indexes

| Index | Description | Tokens | Parent |
|-------|-------------|--------|--------|
| **AI-MCW** | AI & Machine Learning | 15-20 | N100 subset |
| **L1-MCW** | Layer 1 Platforms | 20-25 | N100 subset |
| **L2-MCW** | Layer 2 & Scaling | 10-15 | N100 subset |
| **GAMING-MCW** | Gaming & Metaverse | 10-15 | N100 subset |
| **ORACLE-MCW** | Oracles & Data | 5-10 | INFRA subset |
| **STORAGE-MCW** | Decentralized Storage | 5-8 | INFRA subset |
| **DEX-MCW** | Decentralized Exchanges | 8-12 | DEFI subset |
| **LEND-MCW** | Lending Protocols | 8-10 | DEFI subset |

### Sector Classification System
Define clear sector taxonomy:
```
Layer 1 (L1)        - Base layer blockchains (SOL, AVAX, ADA, etc.)
Layer 2 (L2)        - Scaling solutions (ARB, OP, MATIC, etc.)
DeFi                - Decentralized finance protocols
  ├── DEX           - Decentralized exchanges
  ├── Lending       - Lending/borrowing protocols
  ├── Derivatives   - Perps, options, synthetics
  └── Yield         - Yield aggregators
Infrastructure      - Supporting services
  ├── Oracle        - Price feeds, data
  ├── Storage       - Decentralized storage
  ├── Compute       - Decentralized computing
  └── Identity      - Identity solutions
AI/ML               - AI and machine learning tokens
Gaming              - Gaming and metaverse
Meme                - Meme coins (excluded from most indexes)
```

### Implementation Tasks
- [ ] Define constituent rules for each sector index
- [ ] Create sector classification for all 100 tokens
- [ ] Set minimum market cap thresholds per sector
- [ ] Implement sector index calculations
- [ ] Add sector breakdown to dashboard

---

## Phase 3: Data & Analytics

### Volatility Metrics
- [ ] 30-day rolling standard deviation
- [ ] Beta vs BTC/ETH benchmarks
- [ ] Maximum drawdown tracking
- [ ] Sharpe ratio (using risk-free rate proxy)

### Correlation Analysis
- [ ] Index correlation matrix
- [ ] Rolling correlation charts
- [ ] Sector correlation heatmap

### Performance Attribution
- [ ] Sector contribution to returns
- [ ] Top/bottom contributors analysis
- [ ] Concentration metrics (HHI)

---

## Phase 4: Professional Features

### Data Export
- [ ] CSV export for historical data
- [ ] API endpoints for programmatic access
- [ ] Index methodology PDF generation
- [ ] Constituent list exports

### Rebalancing System
- [ ] Quarterly rebalancing schedule
- [ ] Rebalancing announcement page
- [ ] Constituent changes changelog
- [ ] Pre-announcement (T-5 days)
- [ ] Effective date tracking

### Index Governance
- [ ] Index rule book documentation
- [ ] Eligibility criteria documentation
- [ ] Buffer rules for additions/deletions
- [ ] Corporate action handling (forks, airdrops)

---

## Phase 5: Real-Time & Institutional

### Real-Time Data
- [ ] Intraday pricing (hourly snapshots)
- [ ] WebSocket feed for live updates
- [ ] Trading day views (market hours concept)

### Institutional Features
- [ ] Index licensing information
- [ ] Backtest data (simulated pre-inception)
- [ ] Index ticker symbol registry
- [ ] Press release templates
- [ ] Compliance documentation

### Advanced Products
- [ ] Volatility-controlled index variant
- [ ] Yield-inclusive index (staking rewards)
- [ ] Capped index (max 10% per constituent)
- [ ] ESG-screened variant (exclude certain sectors)

---

## Technical Debt & Improvements

### Performance
- [ ] Database query optimization
- [ ] Caching layer for API responses
- [ ] CDN for static assets

### Reliability
- [ ] Automated backup verification
- [ ] Failover data sources (CoinGecko backup)
- [ ] Health monitoring dashboard
- [ ] Alert system for collection failures

### Testing
- [ ] Unit tests for index calculations
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows

---

## Timeline (Suggested)

| Phase | Focus | Duration |
|-------|-------|----------|
| 1 | EW Deprecation | 1 week |
| 2 | Sector Sub-Indexes | 2-3 weeks |
| 3 | Analytics Dashboard | 2-3 weeks |
| 4 | Professional Features | 3-4 weeks |
| 5 | Real-Time & Institutional | Ongoing |

---

## Success Metrics

- **Data Quality:** 99.9% collection success rate
- **Coverage:** Track top 100 crypto assets by market cap
- **Accuracy:** Index values match manual calculation within 0.01%
- **Uptime:** Dashboard available 99.5% of time
- **Adoption:** External references to index values

---

## Notes

### Index Naming Convention
- Format: `{CATEGORY}-MCW` or `{SECTOR}-MCW`
- MCW = Market Cap Weighted
- All indexes start at base value 1000

### Constituent Rules
- Minimum market cap: Varies by index
- Minimum liquidity: 24h volume > $1M
- Listing requirement: Available on major exchanges
- Exclusions: Stablecoins, wrapped tokens, exchange tokens (varies)

### Rebalancing Schedule
- **Quarterly:** March, June, September, December
- **Announcement:** 5 business days before effective
- **Effective:** Third Friday of rebalancing month

---

*Last Updated: November 2024*
