# Index Methodology

This document describes the calculation methodology for the Nemes crypto indexes, following industry-standard practices used by major index providers like S&P Dow Jones Indices.

## Overview

All indexes use a **divisor-based methodology** similar to the S&P 500 and Dow Jones Industrial Average. This ensures:
- Consistent, absolute index values (not percentages)
- Continuity when constituents change
- Professional-grade index calculation

## Index Inception

- **Inception Date**: November 25, 2024
- **Base Value**: 1000 (all indexes start at this value)
- **Divisors**: Calculated from inception date market data

## Index Types

### Market Cap Weighted (MCW)

**Used by**: N100-MCW, DEFI-MCW, INFRA-MCW

**Methodology**: Similar to the S&P 500. Larger market cap tokens have proportionally greater influence on the index.

**Formula**:
```
Index Value = Total Market Cap of Constituents / Divisor

Where:
  Divisor = Total Market Cap at Inception / 1000
```

**Example**:
- N100-MCW inception total market cap: $677.52B
- Divisor: $677.52B / 1000 = $677.52M
- If today's total market cap is $480B:
  - Index = $480B / $677.52M = 708.5

**Weight Calculation**:
```
Token Weight = Token Market Cap / Total Index Market Cap
```

### Equal Weighted (EW)

**Used by**: N100-EW, DEFI-EW, INFRA-EW

**Methodology**: Similar to the S&P 500 Equal Weight Index. Each token contributes equally to index returns, regardless of market cap.

**Formula**:
```
At Inception:
  Shares per Token = (Notional Investment / N) / Token Price

Daily Calculation:
  Index Value = Sum(Token Price × Token Shares) / Divisor
```

**How it works**:
1. At inception, allocate equal dollar amounts to each token
2. Calculate "shares" for each token based on inception price
3. These shares remain fixed (until rebalancing)
4. Index value = portfolio value / divisor

**Example** (3-token index):
- Inception: $1M notional, 3 tokens
- Each token gets $333,333
- Token A at $100: 3,333.33 shares
- Token B at $50: 6,666.67 shares
- Token C at $10: 33,333.33 shares

If prices change to A=$120, B=$45, C=$12:
- Portfolio = (3,333.33 × $120) + (6,666.67 × $45) + (33,333.33 × $12)
- Portfolio = $400,000 + $300,000 + $400,000 = $1,100,000
- Index = $1,100,000 / 1000 = 1100 (10% gain)

## Divisors

### Current Divisors (as of inception)

| Index | Divisor | Baseline Market Data |
|-------|---------|---------------------|
| N100-MCW | $677.52M | $677.52B total market cap |
| N100-EW | $1,000 | $1M notional / 100 tokens |
| DEFI-MCW | $24.64M | $24.64B total market cap |
| DEFI-EW | $1,000 | $1M notional / 25 tokens |
| INFRA-MCW | $42.04M | $42.04B total market cap |
| INFRA-EW | $1,000 | $1M notional / 25 tokens |

### Divisor Adjustments

Divisors are adjusted to maintain index continuity when:
- Constituents are added or removed
- Corporate actions affect market cap (token burns, etc.)

**Adjustment Formula**:
```
New Divisor = Old Divisor × (New Total Value / Old Total Value)
```

This ensures the index value remains unchanged immediately after the adjustment.

## Data Sources

- **Price Data**: CoinMarketCap API
- **Market Cap**: Circulating supply × price
- **Update Frequency**: Daily snapshots at 12:00 UTC

## Index Constituents

### N100 (Nemes 100)
Top 100 cryptocurrencies by market cap, excluding:
- BTC, ETH (tracked as benchmarks)
- Bitcoin forks (BCH, LTC)
- Ethereum Classic (ETC)

### DEFI 25
Top 25 DeFi protocols including DEXs, lending, derivatives, and yield platforms.

### INFRA 25
Top 25 blockchain infrastructure tokens including oracles, storage, compute, and data services.

## Benchmarks

BTC and ETH are tracked as benchmarks using raw prices (no divisor calculation).

## Comparison to Traditional Indexes

| Feature | S&P 500 | Nemes Indexes |
|---------|---------|---------------|
| Methodology | Market Cap Weighted | MCW and EW variants |
| Base Value | 10 (1941-43) | 1000 (Nov 2024) |
| Divisor | ~8.9B | Varies by index |
| Rebalancing | Quarterly | TBD |
| Float Adjustment | Yes (IWF) | No (uses full market cap) |

## Future Enhancements

### 1. Quarterly Rebalancing for Equal Weight Indexes
**Priority**: High | **Complexity**: Medium

Equal weight indexes naturally drift away from equal weighting as token prices diverge. Quarterly rebalancing restores equal weights.

**Implementation**:
```
On rebalance date (e.g., 3rd Friday of Mar/Jun/Sep/Dec):
1. Calculate new equal allocation: Notional / N tokens
2. Recalculate shares for each token at current price
3. Adjust divisor to maintain index continuity:
   New Divisor = Old Divisor × (New Portfolio Value / Old Index Value × Old Divisor)
```

**Industry Reference**: S&P 500 Equal Weight Index rebalances quarterly.

---

### 2. Float-Adjusted Market Cap (IWF)
**Priority**: Medium | **Complexity**: High

Currently using full circulating supply. Float adjustment excludes tokens held by:
- Founders/team (locked or vesting)
- Treasury/protocol reserves
- Major long-term holders (>5% stake)

**Implementation**:
```
Investable Weight Factor (IWF) = Float Shares / Total Shares
Adjusted Market Cap = Price × Circulating Supply × IWF
```

**Challenge**: Crypto float data is harder to obtain than traditional equities. Would require:
- Manual research per token
- Integration with on-chain analytics (Nansen, Arkham)
- Regular updates for vesting schedules

---

### 3. Capped Weight Limits
**Priority**: Medium | **Complexity**: Low

Prevent single token domination in MCW indexes. Common cap: 10% or 25%.

**Implementation**:
```
If token weight > cap:
  1. Set token weight = cap
  2. Redistribute excess weight proportionally to uncapped tokens
  3. Iterate until all weights ≤ cap
```

**Example**: If XRP reaches 15% weight with a 10% cap:
- Cap XRP at 10%
- Redistribute 5% to other tokens proportionally

**Industry Reference**: MSCI Capped Indexes use 25% caps.

---

### 4. Sector Sub-Indexes
**Priority**: Low | **Complexity**: Medium

Create specialized indexes beyond DeFi and Infra:

| Sector | Examples | Token Count |
|--------|----------|-------------|
| Layer 1s | SOL, AVAX, NEAR, SUI | 10-15 |
| Layer 2s | ARB, OP, MATIC, BASE | 10 |
| AI/Compute | RNDR, FET, AGIX, TAO | 10-15 |
| Gaming/Metaverse | AXS, SAND, MANA, IMX | 10-15 |
| Memecoins | DOGE, SHIB, PEPE, WIF | 10 |
| RWA | ONDO, MKR, PENDLE | 5-10 |

**Implementation**: Add new IndexConfig entries with sector-specific token lists.

---

### 5. Real-Time Index Updates
**Priority**: Low | **Complexity**: High

Current: Daily snapshots at 12:00 UTC
Enhanced: Real-time or 5-minute updates

**Requirements**:
- WebSocket connection to price feeds
- Efficient delta calculations
- Rate limit management (CMC API limits)
- Historical data at higher resolution

---

### 6. Automated Constituent Selection
**Priority**: Low | **Complexity**: High

Currently: Fixed token lists defined in code
Enhanced: Automatic quarterly reconstitution based on:
- Market cap ranking
- Minimum liquidity thresholds
- Exchange listing requirements
- Sector classification

**Implementation**:
```
Quarterly Selection Process:
1. Fetch top 150 tokens by market cap
2. Apply exclusion rules (forks, stablecoins, wrapped tokens)
3. Apply liquidity filter (min $10M daily volume)
4. Select top 100 for N100, top 25 per sector for DEFI/INFRA
5. Adjust divisors for any constituent changes
```

---

## Implementation Roadmap

| Phase | Enhancement | Est. Effort |
|-------|-------------|-------------|
| 1 | Quarterly EW Rebalancing | 2-3 days |
| 2 | Capped Weight Limits | 1-2 days |
| 3 | Sector Sub-Indexes | 3-5 days |
| 4 | Float-Adjusted MCW | 1-2 weeks |
| 5 | Automated Reconstitution | 1-2 weeks |
| 6 | Real-Time Updates | 2-4 weeks |
