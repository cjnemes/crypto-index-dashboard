# Crypto Index Dashboard Roadmap

## Current Status (v0.9 - Pre-Release)

### Completed
- [x] Core index calculation engine with **capped MCW methodology** (25% max weight)
- [x] 12 indexes total:
  - 2 Benchmarks: BTC, ETH
  - 3 Core: N100-MCW, DEFI-MCW, INFRA-MCW
  - 7 Sector Sub-Indexes: L1, SCALE, AI, GAMING, DEX, YIELD, DATA
- [x] Historical data backfill (12 months)
- [x] Daily price collection via CoinMarketCap API
- [x] Docker containerization with persistent database
- [x] Security hardening (headers, API key protection)
- [x] Interactive dashboard with charts
- [x] Index detail pages with constituent breakdown
- [x] Capped weight limits (25% max per constituent)
- [x] Sector sub-indexes for granular market exposure
- [x] Risk metrics (volatility, Sharpe ratio, max drawdown, beta)
- [x] Dark/light theme support

### Deprecated
- Equal-weighted (EW) indexes - removed in favor of MCW-only strategy

---

## Phase 2: Data Quality & Automation

### Automated Price Collection
- [ ] Set up cron job / scheduled task for daily collection
- [ ] Add collection status monitoring
- [ ] Email/webhook alerts on collection failures
- [ ] Retry logic for API failures

### Data Validation
- [ ] Detect and flag anomalous price movements
- [ ] Handle token migrations/rebrands automatically
- [ ] Track data coverage gaps
- [ ] Add data quality dashboard

### Index Rebalancing
- [ ] Quarterly rebalancing mechanism
- [ ] Track constituent changes over time
- [ ] Historical rebalancing records

---

## Phase 3: Enhanced Analytics

### Performance Metrics
- [x] Sharpe ratio calculation ✅
- [x] Volatility metrics (30d, 90d, 1Y) ✅
- [x] Max drawdown tracking ✅
- [x] Beta vs BTC ✅
- [ ] Rolling returns (7d, 30d, 90d)

### Comparison Tools
- [x] Benchmark comparisons (vs BTC, ETH) ✅
- [ ] Side-by-side index comparison chart
- [ ] Correlation matrix between indexes

### Portfolio Simulation
- [ ] "What if" calculator (hypothetical investment)
- [ ] DCA simulation tool
- [ ] Export historical data (CSV/JSON)

---

## Phase 4: UI/UX Improvements

### Dashboard Enhancements
- [x] Dark mode support ✅
- [x] Customizable date ranges ✅
- [ ] Mobile-responsive improvements
- [ ] Real-time price updates (WebSocket)

### Visualization
- [ ] Candlestick charts option
- [ ] Sector breakdown pie charts
- [ ] Market cap treemap
- [ ] Constituent weight visualization

### User Features
- [ ] Watchlist functionality
- [ ] Price alerts
- [ ] Custom index builder

---

## Phase 5: API & Integration

### Public API
- [ ] RESTful API documentation
- [ ] Rate limiting
- [ ] API key management
- [ ] OpenAPI/Swagger spec

### Integrations
- [ ] TradingView widget integration
- [ ] Discord/Telegram bot for price alerts
- [ ] Google Sheets add-on
- [ ] Webhook notifications

---

## Phase 6: Infrastructure & Scale

### Performance
- [ ] Redis caching layer
- [ ] Database query optimization
- [ ] CDN for static assets
- [ ] Background job queue (Bull/BullMQ)

### Reliability
- [ ] Database backups automation
- [ ] Health monitoring (Uptime Kuma, etc.)
- [ ] Log aggregation
- [ ] Error tracking (Sentry)

### Deployment
- [ ] CI/CD pipeline
- [ ] Staging environment
- [ ] Blue-green deployments
- [ ] Kubernetes support (optional)

---

## Future Considerations

### New Index Types
- [x] Layer 1 Index (L1-MCW) ✅
- [x] Layer 2 / Scaling Index (SCALE-MCW) ✅
- [x] AI/ML Token Index (AI-MCW) ✅
- [x] Gaming/Metaverse Index (GAMING-MCW) ✅
- [x] DEX Index (DEX-MCW) ✅
- [x] Yield Index (YIELD-MCW) ✅
- [x] Data/Oracle Index (DATA-MCW) ✅
- [ ] RWA (Real World Assets) Index
- [ ] Meme Index

### Advanced Features
- [ ] On-chain verification of index values
- [ ] Token-gated premium features
- [ ] Multi-currency support (EUR, GBP, etc.)
- [ ] Historical constituent snapshots

---

## Technical Debt

- [ ] Remove `version` attribute from docker-compose.yml (deprecated warning)
- [ ] Add comprehensive test suite
- [ ] TypeScript strict mode
- [ ] ESLint/Prettier configuration
- [ ] API input validation (Zod)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.
