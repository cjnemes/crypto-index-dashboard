# Crypto Index Dashboard Roadmap

## Current Status (v1.0)

### Completed
- [x] Core index calculation engine (MCW + EW methodologies)
- [x] 8 indexes: BTC, ETH, N100-MCW, N100-EW, DEFI-MCW, DEFI-EW, INFRA-MCW, INFRA-EW
- [x] Historical data backfill (12 months)
- [x] Daily price collection via CoinMarketCap API
- [x] Docker containerization with persistent database
- [x] Security hardening (headers, API key protection)
- [x] Interactive dashboard with charts
- [x] Index detail pages with constituent breakdown

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
- [ ] Sharpe ratio calculation
- [ ] Volatility metrics (30d, 90d, 1Y)
- [ ] Max drawdown tracking
- [ ] Rolling returns (7d, 30d, 90d)

### Comparison Tools
- [ ] Side-by-side index comparison
- [ ] Benchmark comparisons (vs BTC, ETH, S&P 500)
- [ ] Correlation matrix between indexes

### Portfolio Simulation
- [ ] "What if" calculator (hypothetical investment)
- [ ] DCA simulation tool
- [ ] Export historical data (CSV/JSON)

---

## Phase 4: UI/UX Improvements

### Dashboard Enhancements
- [ ] Dark mode support
- [ ] Customizable date ranges
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
- [ ] Layer 1 Index
- [ ] Layer 2 Index
- [ ] AI/ML Token Index
- [ ] Gaming/Metaverse Index
- [ ] RWA (Real World Assets) Index

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
