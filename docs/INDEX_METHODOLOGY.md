# Index Methodology

This document describes the calculation methodology for the Nemes crypto indexes, following industry-standard practices used by major index providers like S&P Dow Jones Indices.

## Overview

All indexes use a **divisor-based methodology** similar to the S&P 500 and Dow Jones Industrial Average, combined with **capped market cap weighting** to ensure diversification. This ensures:
- Consistent, absolute index values (not percentages)
- Continuity when constituents change
- Professional-grade index calculation
- Diversification through 25% constituent weight caps

## Index Inception

- **Inception Date**: November 25, 2024
- **Base Value**: 1000 (all indexes start at this value)
- **Divisors**: Calculated from inception date market data using capped weights
- **Weight Cap**: 25% maximum per constituent (industry standard)

## Index Types

### Capped Market Cap Weighted (MCW)

**Used by**: All core and sector indexes (N100-MCW, DEFI-MCW, INFRA-MCW, L1-MCW, etc.)

**Methodology**: Capped market cap weighted, similar to MSCI Capped Indexes and DeFi Pulse Index. Larger market cap tokens have greater influence, but no single constituent can exceed 25% weight.

**Weight Capping Algorithm**:
1. Calculate initial weights from market caps: `Weight = Token Market Cap / Total Market Cap`
2. Identify constituents exceeding 25% cap
3. Cap them at 25% and redistribute excess weight proportionally to uncapped constituents
4. Iterate until all weights ≤ 25% (max 10 iterations)

**Index Calculation (Shares-Based)**:
```
At Inception:
  1. Calculate capped weights for each constituent
  2. Using $1M notional: Shares = (Notional × Capped_Weight) / Price
  3. Divisor = Total_Portfolio_Value / 1000

Daily Calculation:
  Index Value = Sum(Shares × Current_Price) / Divisor
```

**Example** (simplified 3-token index with 40% cap):
- Token A: $600B mcap → 60% raw weight → capped to 40%
- Token B: $300B mcap → 30% raw weight → adjusted to 36%
- Token C: $100B mcap → 10% raw weight → adjusted to 24%
- Excess 20% from A redistributed proportionally to B and C

**Why Capped Weights?**
- **Diversification**: Prevents single token from dominating index returns
- **Industry Standard**: DeFi Pulse Index, MSCI, S&P Capped indexes all use this approach
- **Regulatory Alignment**: SEC RIC rules require max 25% concentration
- **Risk Management**: Reduces idiosyncratic risk from any single constituent

### Equal Weighted (EW) - DEPRECATED

> **Note**: Equal-weighted indexes were deprecated in November 2024 in favor of a MCW-only strategy. All active indexes now use capped market cap weighting.

**Historical Methodology**: Each token contributed equally to index returns, regardless of market cap. Shares were calculated at inception based on equal dollar allocation.

## Current Indexes

### Core Indexes

| Index | Description | Tokens | Methodology |
|-------|-------------|--------|-------------|
| N100-MCW | Nemes 100 - Top 100 altcoins | 100 | Capped MCW (25%) |
| DEFI-MCW | DeFi 25 - Top DeFi protocols | 25 | Capped MCW (25%) |
| INFRA-MCW | Infra 25 - Infrastructure tokens | 25 | Capped MCW (25%) |

### Sector Sub-Indexes

| Index | Description | Tokens | Parent |
|-------|-------------|--------|--------|
| L1-MCW | Layer 1 smart contract platforms | 24 | N100 |
| SCALE-MCW | L2s + Layer 0 interoperability | 9 | N100 |
| AI-MCW | AI, GPU, Compute, IoT | 10 | INFRA |
| GAMING-MCW | Gaming, Metaverse, NFT | 8 | N100 |
| DEX-MCW | Decentralized Exchanges | 11 | DEFI |
| YIELD-MCW | Lending, Derivatives, Staking | 11 | DEFI |
| DATA-MCW | Oracles, Storage, Indexing | 10 | INFRA |

### Benchmarks

| Symbol | Description |
|--------|-------------|
| BTC | Bitcoin - primary market benchmark |
| ETH | Ethereum - smart contract benchmark |

## Divisors

Divisors are calculated at inception using capped weights and a $1M notional investment. The divisor ensures all indexes start at exactly 1000.

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

## Implemented Features

### ✅ Capped Weight Limits (November 2024)
**Status**: Complete

All MCW indexes use 25% weight caps with iterative redistribution. This prevents single token domination and aligns with industry standards (DeFi Pulse Index, MSCI Capped Indexes).

**Implementation**: `src/lib/weights.ts` - `calculateMCWWeights()` function with `applyWeightCaps()` algorithm.

---

### ✅ Sector Sub-Indexes (November 2024)
**Status**: Complete

Seven sector sub-indexes provide granular exposure to specific market segments:
- **L1-MCW**: Layer 1 smart contract platforms (24 tokens)
- **SCALE-MCW**: L2s and interoperability (9 tokens)
- **AI-MCW**: AI, GPU, Compute, IoT (10 tokens)
- **GAMING-MCW**: Gaming, Metaverse, NFT (8 tokens)
- **DEX-MCW**: Decentralized Exchanges (11 tokens)
- **YIELD-MCW**: Lending, Derivatives, Staking (11 tokens)
- **DATA-MCW**: Oracles, Storage, Indexing (10 tokens)

**Implementation**: Token definitions in `src/lib/tokens.ts`, index configs in `INDEX_CONFIGS`.

---

## Future Enhancements

### 1. Float-Adjusted Market Cap (IWF)
**Priority**: Medium | **Complexity**: High

Currently using full circulating supply. Float adjustment would exclude tokens held by:
- Founders/team (locked or vesting)
- Treasury/protocol reserves
- Major long-term holders (>5% stake)

**Challenge**: Crypto float data is harder to obtain than traditional equities. Would require:
- Manual research per token
- Integration with on-chain analytics (Nansen, Arkham)
- Regular updates for vesting schedules

---

### 2. Quarterly Rebalancing
**Priority**: Medium | **Complexity**: Medium

Recalculate capped weights quarterly to account for market cap changes. Currently, shares are fixed at inception.

**Implementation**:
```
On rebalance date (e.g., 3rd Friday of Mar/Jun/Sep/Dec):
1. Recalculate capped weights from current market caps
2. Calculate new shares based on updated weights
3. Adjust divisor to maintain index continuity
```

---

### 3. Real-Time Index Updates
**Priority**: Low | **Complexity**: High

Current: Daily snapshots at 12:00 UTC
Enhanced: Real-time or 5-minute updates

**Requirements**:
- WebSocket connection to price feeds
- Efficient delta calculations
- Rate limit management (CMC API limits)
- Historical data at higher resolution

---

### 4. Automated Constituent Selection
**Priority**: Low | **Complexity**: High

Currently: Fixed token lists defined in code
Enhanced: Automatic quarterly reconstitution based on:
- Market cap ranking
- Minimum liquidity thresholds
- Exchange listing requirements
- Sector classification

---

## Implementation Roadmap

| Phase | Enhancement | Status |
|-------|-------------|--------|
| 1 | Capped Weight Limits (25%) | ✅ Complete |
| 2 | Sector Sub-Indexes | ✅ Complete |
| 3 | Quarterly Rebalancing | 🔜 Planned |
| 4 | Float-Adjusted MCW | 📋 Backlog |
| 5 | Automated Reconstitution | 📋 Backlog |
| 6 | Real-Time Updates | 📋 Backlog |
