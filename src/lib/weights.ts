/**
 * Weight calculation utilities for index constituents
 *
 * Implements Capped Market Cap Weighted (MCW) methodology following industry standards:
 * - 25% maximum weight per constituent (aligned with DeFi Pulse Index & RIC rules)
 * - Excess weight redistributed proportionally to uncapped constituents
 * - Iterative capping until all weights within limits
 *
 * References:
 * - DeFi Pulse Index: 25% cap (https://indexcoop.com/blog/defi-pulse-index-methodology)
 * - SEC RIC Diversification: 25% max single position
 * - S&P Capped Indices: Various caps with proportional redistribution
 */

import { INDEX_CONFIGS, getIndexTokens as getTokensForIndex } from './tokens'

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Maximum weight any single constituent can have in a capped index
 * Industry standard for sector indexes (DeFi Pulse Index uses 25%)
 * Also aligns with SEC RIC diversification requirements
 */
export const MAX_CONSTITUENT_WEIGHT = 0.25 // 25%

/**
 * Maximum iterations for weight redistribution to prevent infinite loops
 */
const MAX_CAPPING_ITERATIONS = 10

export interface ConstituentWithWeight {
  symbol: string
  name: string
  sector: string
  price: number
  marketCap: number
  volume24h: number
  change24h: number
  weight: number // 0-1 (e.g., 0.12 = 12%)
  rank: number
}

export interface IndexDetails {
  symbol: string
  name: string
  methodology: string
  tokenCount: number
  color: string
  value: number
  change24h: number
  constituents: ConstituentWithWeight[]
}

/**
 * Get tokens for a given index symbol
 * Uses the centralized getIndexTokens from tokens.ts which supports all indexes
 */
export function getIndexTokens(indexSymbol: string): { symbol: string; name: string; sector: string }[] {
  const config = INDEX_CONFIGS.find(c => c.symbol === indexSymbol)
  if (!config) return []
  return getTokensForIndex(config.baseIndex)
}

/**
 * Calculate Capped MCW (Market Cap Weighted) weights
 *
 * Implements industry-standard capped market cap weighting:
 * 1. Calculate initial weights based on market cap
 * 2. Cap any constituent exceeding MAX_CONSTITUENT_WEIGHT (25%)
 * 3. Redistribute excess weight proportionally to uncapped constituents
 * 4. Repeat until all weights are within limits
 *
 * This methodology follows DeFi Pulse Index standards and ensures
 * diversification while still respecting market cap ranking.
 *
 * @param tokens - Array of token definitions
 * @param priceData - Map of current price/market cap data
 * @param maxWeight - Optional custom cap (defaults to MAX_CONSTITUENT_WEIGHT)
 * @returns Array of constituents with capped weights
 */
export function calculateMCWWeights(
  tokens: { symbol: string; name: string; sector: string }[],
  priceData: Map<string, { price: number; marketCap: number; volume24h: number; change24h: number }>,
  maxWeight: number = MAX_CONSTITUENT_WEIGHT
): ConstituentWithWeight[] {
  // Get market caps for all tokens with valid data
  const tokenData: { token: typeof tokens[0]; data: { price: number; marketCap: number; volume24h: number; change24h: number } }[] = []
  let totalMarketCap = 0

  for (const token of tokens) {
    const data = priceData.get(token.symbol)
    if (data && data.marketCap > 0) {
      tokenData.push({ token, data })
      totalMarketCap += data.marketCap
    }
  }

  if (tokenData.length === 0 || totalMarketCap === 0) {
    return []
  }

  // Build initial constituents with uncapped market cap weights
  const constituents: ConstituentWithWeight[] = tokenData
    .map(({ token, data }) => ({
      symbol: token.symbol,
      name: token.name,
      sector: token.sector,
      price: data.price,
      marketCap: data.marketCap,
      volume24h: data.volume24h,
      change24h: data.change24h,
      weight: data.marketCap / totalMarketCap,
      rank: 0
    }))
    .sort((a, b) => b.marketCap - a.marketCap)

  // Apply iterative capping algorithm
  applyWeightCaps(constituents, maxWeight)

  // Assign final ranks (by original market cap, not capped weight)
  constituents.forEach((c, i) => {
    c.rank = i + 1
  })

  return constituents
}

/**
 * Apply weight caps iteratively until all constituents are within limits
 *
 * Algorithm:
 * 1. Find all constituents exceeding the cap
 * 2. Cap them at maxWeight
 * 3. Calculate total excess weight to redistribute
 * 4. Redistribute excess proportionally to uncapped constituents
 * 5. Repeat if redistribution causes new breaches
 *
 * @param constituents - Array of constituents (modified in place)
 * @param maxWeight - Maximum allowed weight (0-1)
 */
function applyWeightCaps(constituents: ConstituentWithWeight[], maxWeight: number): void {
  for (let iteration = 0; iteration < MAX_CAPPING_ITERATIONS; iteration++) {
    // Find constituents that exceed the cap
    const capped: ConstituentWithWeight[] = []
    const uncapped: ConstituentWithWeight[] = []

    for (const c of constituents) {
      if (c.weight > maxWeight) {
        capped.push(c)
      } else {
        uncapped.push(c)
      }
    }

    // If nothing exceeds cap, we're done
    if (capped.length === 0) {
      return
    }

    // Calculate total excess weight to redistribute
    let excessWeight = 0
    for (const c of capped) {
      excessWeight += c.weight - maxWeight
      c.weight = maxWeight // Cap it
    }

    // If no uncapped constituents to redistribute to, we're done
    // (edge case: all constituents are at or above cap)
    if (uncapped.length === 0) {
      return
    }

    // Calculate total weight of uncapped constituents (for proportional redistribution)
    const uncappedTotalWeight = uncapped.reduce((sum, c) => sum + c.weight, 0)

    if (uncappedTotalWeight === 0) {
      // Edge case: distribute equally if all uncapped have zero weight
      const equalShare = excessWeight / uncapped.length
      for (const c of uncapped) {
        c.weight += equalShare
      }
    } else {
      // Redistribute excess weight proportionally to uncapped constituents
      for (const c of uncapped) {
        const proportion = c.weight / uncappedTotalWeight
        c.weight += excessWeight * proportion
      }
    }

    // Verify weights still sum to 1 (floating point safety)
    const totalWeight = constituents.reduce((sum, c) => sum + c.weight, 0)
    if (Math.abs(totalWeight - 1) > 0.0001) {
      // Normalize to ensure weights sum to 1
      for (const c of constituents) {
        c.weight = c.weight / totalWeight
      }
    }
  }

  // If we hit max iterations, log a warning (shouldn't happen with reasonable data)
  console.warn(`Weight capping reached max iterations (${MAX_CAPPING_ITERATIONS})`)
}

/**
 * Calculate EW (Equal Weighted) weights
 * Weight = 1 / number of tokens
 */
export function calculateEWWeights(
  tokens: { symbol: string; name: string; sector: string }[],
  priceData: Map<string, { price: number; marketCap: number; volume24h: number; change24h: number }>
): ConstituentWithWeight[] {
  const tokenData: { token: typeof tokens[0]; data: { price: number; marketCap: number; volume24h: number; change24h: number } }[] = []

  for (const token of tokens) {
    const data = priceData.get(token.symbol)
    if (data && data.price > 0) {
      tokenData.push({ token, data })
    }
  }

  const equalWeight = tokenData.length > 0 ? 1 / tokenData.length : 0

  // Sort by market cap for consistent ordering
  const constituents = tokenData
    .map(({ token, data }) => ({
      symbol: token.symbol,
      name: token.name,
      sector: token.sector,
      price: data.price,
      marketCap: data.marketCap,
      volume24h: data.volume24h,
      change24h: data.change24h,
      weight: equalWeight,
      rank: 0
    }))
    .sort((a, b) => b.marketCap - a.marketCap)

  // Assign ranks (by market cap, even though weights are equal)
  constituents.forEach((c, i) => {
    c.rank = i + 1
  })

  return constituents
}

/**
 * Calculate constituents with weights for any index
 */
export function calculateConstituents(
  indexSymbol: string,
  priceData: Map<string, { price: number; marketCap: number; volume24h: number; change24h: number }>
): ConstituentWithWeight[] {
  const config = INDEX_CONFIGS.find(c => c.symbol === indexSymbol)
  if (!config) return []

  // Benchmarks (BTC, ETH) have no constituents - they are the constituent
  if (config.methodology === 'BENCHMARK') {
    const data = priceData.get(indexSymbol)
    if (!data) return []

    return [{
      symbol: indexSymbol,
      name: config.name,
      sector: 'Benchmark',
      price: data.price,
      marketCap: data.marketCap,
      volume24h: data.volume24h,
      change24h: data.change24h,
      weight: 1,
      rank: 1
    }]
  }

  const tokens = getIndexTokens(indexSymbol)

  if (config.methodology === 'MCW') {
    return calculateMCWWeights(tokens, priceData)
  } else if (config.methodology === 'EW') {
    return calculateEWWeights(tokens, priceData)
  }

  return []
}

/**
 * Format weight as percentage string
 */
export function formatWeight(weight: number): string {
  return `${(weight * 100).toFixed(2)}%`
}

/**
 * Format large numbers (market cap, volume)
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`
  }
  return `$${value.toFixed(2)}`
}

/**
 * Format price with appropriate decimals
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`
  } else {
    return `$${price.toFixed(6)}`
  }
}

/**
 * Format percentage change
 */
export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}
