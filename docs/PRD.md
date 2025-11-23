# Product Requirements Document (PRD)
# Crypto Index Dashboard - "Nemes Index Platform"

**Version:** 1.0
**Date:** November 22, 2024
**Status:** Draft

---

## Executive Summary

The Nemes Index Platform is a professional-grade cryptocurrency index tracking application that provides institutional-quality market analytics through curated crypto indexes. Similar to how the S&P 500 and Nasdaq provide lens into traditional markets, Nemes provides structured views into the crypto market through purpose-built indexes that track specific market segments.

### Vision Statement
*"To be the Bloomberg Terminal of crypto indexes - providing clear, actionable market insights through professionally constructed indexes that make the crypto market comprehensible."*

---

## Problem Statement

### Current Market Gaps
1. **No True Crypto Indexes**: Existing "indexes" like TOTAL3 are simple market cap aggregations without proper methodology
2. **No Sector Segmentation**: Investors can't easily track DeFi performance vs Infrastructure vs the broader market
3. **No Methodology Transparency**: Most aggregations don't explain weighting or constituent selection
4. **Retail-Focused Tools**: Existing tools lack institutional-grade analytics (Sharpe ratio, volatility, drawdown)
5. **Outdated Benchmarks**: Current crypto benchmarks don't reflect market evolution (L2s, AI tokens, etc.)

### Target Users
- **Primary**: Crypto portfolio managers and analysts seeking sector-level insights
- **Secondary**: Retail investors wanting professional-grade market views
- **Tertiary**: Financial media needing quotable crypto market benchmarks

---

## Product Overview

### Core Indexes

| Index | Description | Tokens | Methodology Options |
|-------|-------------|--------|---------------------|
| **N100** | Top 100 cryptocurrencies (ex-benchmarks) | 100 | MCW, EW |
| **DeFi 25** | Leading DeFi protocols | 25 | MCW, EW |
| **Infra 25** | Blockchain infrastructure tokens | 25 | MCW, EW |
| **BTC** | Bitcoin benchmark | 1 | Price |
| **ETH** | Ethereum benchmark | 1 | Price |

### Methodology Definitions
- **MCW (Market Cap Weighted)**: Constituent weights based on market capitalization
- **EW (Equal Weighted)**: Each constituent has equal weight (rebalanced)
- **BENCHMARK**: Direct price tracking for reference assets

---

## Feature Requirements

### P0 - Must Have (MVP Completion)

#### 1. Index Detail Pages
**User Story**: As an investor, I want to click on any index to see its constituent tokens and their weights so I can understand what I'm tracking.

**Requirements**:
- [ ] Individual page for each index at `/index/[symbol]`
- [ ] Display all constituent tokens in a sortable table
- [ ] Show for each token:
  - Symbol, Name
  - Current price
  - 24h change (%)
  - Weight in index (for MCW)
  - Market cap
  - Sector/category
- [ ] Index performance chart (standalone)
- [ ] Index metadata (methodology, token count, last rebalance)

#### 2. Constituent Transparency Widget
**User Story**: As an investor, I want to see top holdings at a glance without navigating to detail pages.

**Requirements**:
- [ ] "Top 5 Holdings" preview on dashboard for each index
- [ ] Weight percentage bars
- [ ] Click-through to full constituent list

#### 3. Navigation & Information Architecture
**User Story**: As a user, I want intuitive navigation between dashboard overview and detailed views.

**Requirements**:
- [ ] Clickable index cards/rows on main dashboard
- [ ] Breadcrumb navigation on detail pages
- [ ] Tab navigation for different index views (chart, constituents, stats)

#### 4. Mobile Responsiveness
**User Story**: As a mobile user, I want to view index performance on my phone.

**Requirements**:
- [ ] Responsive chart sizing
- [ ] Mobile-optimized data tables (horizontal scroll or card view)
- [ ] Touch-friendly interactions

---

### P1 - Should Have (Enhanced Analytics)

#### 5. Risk Metrics Dashboard
**User Story**: As an analyst, I want to see standard risk metrics to evaluate index performance quality.

**Requirements**:
- [ ] Volatility (30-day, 90-day annualized)
- [ ] Sharpe Ratio (vs risk-free rate)
- [ ] Max Drawdown (with date)
- [ ] Sortino Ratio
- [ ] Beta vs BTC
- [ ] Correlation matrix between indexes

#### 6. Performance Attribution
**User Story**: As a portfolio manager, I want to understand what's driving index performance.

**Requirements**:
- [ ] Top/bottom 5 contributors to daily performance
- [ ] Sector breakdown chart
- [ ] Weight drift visualization (actual vs target for EW)

#### 7. Time Period Selection
**User Story**: As an analyst, I want to analyze specific time periods.

**Requirements**:
- [ ] Preset periods: 1D, 7D, 1M, 3M, 6M, 1Y, YTD, ALL
- [ ] Custom date range picker
- [ ] Period-over-period comparison

#### 8. Index Comparison Tool
**User Story**: As an investor, I want to compare multiple indexes on the same chart.

**Requirements**:
- [ ] Multi-select checkboxes for indexes
- [ ] Normalized view (rebased to 100)
- [ ] Overlay or split-panel modes
- [ ] Export comparison data

---

### P2 - Nice to Have (Professional Features)

#### 9. Historical Rebalancing Log
**User Story**: As an auditor, I want to see when index composition changed.

**Requirements**:
- [ ] Rebalance history with dates
- [ ] Additions/removals log
- [ ] Weight change deltas

#### 10. Alert System
**User Story**: As a trader, I want alerts when indexes hit certain levels.

**Requirements**:
- [ ] Price alerts (above/below threshold)
- [ ] Percentage change alerts (daily movement > X%)
- [ ] Email/browser notifications

#### 11. Data Export
**User Story**: As an analyst, I want to export data for external analysis.

**Requirements**:
- [ ] CSV export of historical data
- [ ] JSON API access
- [ ] PDF report generation

#### 12. Custom Index Builder
**User Story**: As a power user, I want to create custom indexes from available tokens.

**Requirements**:
- [ ] Token selection interface
- [ ] Custom weighting options
- [ ] Backtest custom index
- [ ] Save and track custom indexes

---

## Technical Architecture

### Current Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Charts**: Recharts
- **Database**: SQLite via Prisma ORM
- **Data Sources**: CoinMarketCap API (paid), CoinGecko (backup)

### Data Model

```
┌─────────────────┐     ┌──────────────────┐
│     Price       │     │  IndexSnapshot   │
├─────────────────┤     ├──────────────────┤
│ id              │     │ id               │
│ symbol          │     │ indexName        │
│ name            │     │ value            │
│ price           │     │ timestamp        │
│ marketCap       │     └──────────────────┘
│ volume24h       │
│ change24h       │     ┌──────────────────┐
│ change7d        │     │  IndexConfig     │
│ change30d       │     ├──────────────────┤
│ timestamp       │     │ id               │
└─────────────────┘     │ symbol           │
                        │ name             │
┌─────────────────┐     │ methodology      │
│ CollectionLog   │     │ tokenCount       │
├─────────────────┤     │ color            │
│ id              │     │ description      │
│ timestamp       │     └──────────────────┘
│ status          │
│ tokensCount     │
│ duration        │
│ errorMessage    │
└─────────────────┘
```

### Proposed New Models

```typescript
// Token weights for MCW indexes
model IndexConstituent {
  id          Int      @id @default(autoincrement())
  indexName   String   // N100-MCW, DEFI-MCW, etc.
  symbol      String   // Token symbol
  weight      Float    // Current weight (0-1)
  rank        Int      // Position in index
  timestamp   DateTime // When calculated

  @@index([indexName, timestamp])
}

// Risk metrics snapshots
model RiskMetrics {
  id              Int      @id @default(autoincrement())
  indexName       String
  period          String   // 30d, 90d, 1y
  volatility      Float
  sharpeRatio     Float?
  maxDrawdown     Float
  maxDrawdownDate DateTime?
  betaToBTC       Float?
  timestamp       DateTime

  @@index([indexName, timestamp])
}
```

### API Routes (Proposed)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/index/[symbol]` | GET | Index details + constituents |
| `/api/index/[symbol]/history` | GET | Historical index values |
| `/api/index/[symbol]/constituents` | GET | Current token weights |
| `/api/index/[symbol]/metrics` | GET | Risk metrics |
| `/api/compare` | GET | Multi-index comparison data |

---

## UI/UX Specifications

### Dashboard Layout (Current)
```
┌─────────────────────────────────────────────────┐
│  Header: Nemes Index Dashboard                  │
├─────────────────────────────────────────────────┤
│  Summary Cards: BTC | ETH | N100 | DEFI | INFRA │
├─────────────────────────────────────────────────┤
│                                                 │
│           Historical Performance Chart          │
│           (All Indexes Overlaid)                │
│                                                 │
├─────────────────────────────────────────────────┤
│  Data Table: Index | Value | 24h | 7d | 30d    │
└─────────────────────────────────────────────────┘
```

### Index Detail Page (Proposed)
```
┌─────────────────────────────────────────────────┐
│  ← Back to Dashboard    N100-MCW                │
├─────────────────────────────────────────────────┤
│  Value: 142.35  │  24h: +2.4%  │  Tokens: 100  │
├───────────────────────┬─────────────────────────┤
│                       │  Methodology: MCW       │
│   Performance Chart   │  Last Update: 5m ago    │
│   (Single Index)      │  ────────────────────   │
│                       │  Top Holdings:          │
│                       │  1. SOL (12.4%)         │
│                       │  2. BNB (9.2%)          │
│                       │  3. XRP (8.1%)          │
├───────────────────────┴─────────────────────────┤
│  Tabs: [Constituents] [Performance] [Metrics]   │
├─────────────────────────────────────────────────┤
│  Constituents Table (Sortable)                  │
│  ───────────────────────────────────────────    │
│  # │ Token │ Price │ 24h │ Weight │ Mkt Cap    │
│  1 │ SOL   │ $245  │ +3% │ 12.4%  │ $115B      │
│  2 │ BNB   │ $612  │ +1% │ 9.2%   │ $89B       │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

### Design Principles
1. **Data Density**: Professional users want information-rich screens
2. **Scannable**: Key metrics visible without scrolling
3. **Consistent**: Same patterns across all index pages
4. **Fast**: Data loads < 2 seconds, charts interactive immediately

---

## Success Metrics

### Launch Metrics (MVP)
- Page load time < 2 seconds
- All 8 indexes displaying correctly
- Mobile-usable without horizontal scroll issues
- Zero data staleness > 1 hour

### Growth Metrics (3 months)
- User time on site > 3 minutes average
- Return visitor rate > 30%
- API uptime > 99.5%
- Feature adoption: 50%+ users view detail pages

### Quality Metrics
- Data accuracy: Index values match manual calculation within 0.1%
- Historical coverage: 12+ months for all indexes
- Mobile PageSpeed score > 80

---

## Implementation Phases

### Phase 1: Constituent Transparency (1-2 weeks)
- Build index detail page framework
- Implement constituent table with weights
- Add navigation from dashboard to detail pages
- Deploy and validate

### Phase 2: Enhanced Analytics (2-3 weeks)
- Calculate and store risk metrics
- Build metrics dashboard component
- Add time period selection
- Implement comparison tool

### Phase 3: Professional Features (3-4 weeks)
- Add rebalancing simulation
- Build alert system
- Implement data export
- Create custom index builder (stretch)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CMC API rate limits | Data staleness | Implement caching, use CoinGecko backup |
| SQLite scale limits | Performance degradation | Plan migration path to PostgreSQL |
| Complex calculations slow UI | Poor UX | Pre-calculate metrics, use background jobs |
| Mobile chart performance | User abandonment | Use lazy loading, reduce data points |

---

## Appendix

### Competitor Analysis

| Feature | Nemes | CoinGecko | TradingView | Messari |
|---------|-------|-----------|-------------|---------|
| Custom Indexes | Yes | No | No | Limited |
| Methodology Transparency | Yes | N/A | N/A | Yes |
| Risk Metrics | Planned | No | Basic | Yes |
| Free Tier | Yes | Yes | Yes | Limited |
| API Access | Planned | Yes | Yes | Yes |

### Glossary
- **MCW**: Market Cap Weighted - larger tokens have more influence
- **EW**: Equal Weighted - all tokens count equally
- **Sharpe Ratio**: Risk-adjusted return measure
- **Max Drawdown**: Largest peak-to-trough decline
- **Beta**: Volatility relative to Bitcoin
- **Rebalancing**: Adjusting weights back to target

---

*Document maintained by: Development Team*
*Last updated: November 22, 2024*
