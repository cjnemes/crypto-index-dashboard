/**
 * Weight calculation utilities for index constituents
 */

import { INDEX_TOKENS, INDEX_CONFIGS } from './tokens'

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
 * Get the base index key for an index symbol
 * N100-MCW -> N100, DEFI-EW -> DEFI, etc.
 */
export function getBaseIndexKey(indexSymbol: string): keyof typeof INDEX_TOKENS | null {
  const config = INDEX_CONFIGS.find(c => c.symbol === indexSymbol)
  if (!config) return null

  const baseIndex = config.baseIndex
  if (baseIndex === 'N100' || baseIndex === 'DEFI' || baseIndex === 'INFRA') {
    return baseIndex
  }
  return null
}

/**
 * Get tokens for a given index symbol
 */
export function getIndexTokens(indexSymbol: string): typeof INDEX_TOKENS.N100 {
  const baseKey = getBaseIndexKey(indexSymbol)
  if (!baseKey) return []
  return INDEX_TOKENS[baseKey]
}

/**
 * Calculate MCW (Market Cap Weighted) weights
 * Weight = token market cap / total market cap of all tokens
 */
export function calculateMCWWeights(
  tokens: { symbol: string; name: string; sector: string }[],
  priceData: Map<string, { price: number; marketCap: number; volume24h: number; change24h: number }>
): ConstituentWithWeight[] {
  // Get market caps for all tokens
  const tokenData: { token: typeof tokens[0]; data: { price: number; marketCap: number; volume24h: number; change24h: number } }[] = []
  let totalMarketCap = 0

  for (const token of tokens) {
    const data = priceData.get(token.symbol)
    if (data && data.marketCap > 0) {
      tokenData.push({ token, data })
      totalMarketCap += data.marketCap
    }
  }

  // Calculate weights and sort by market cap
  const constituents = tokenData
    .map(({ token, data }) => ({
      symbol: token.symbol,
      name: token.name,
      sector: token.sector,
      price: data.price,
      marketCap: data.marketCap,
      volume24h: data.volume24h,
      change24h: data.change24h,
      weight: totalMarketCap > 0 ? data.marketCap / totalMarketCap : 0,
      rank: 0
    }))
    .sort((a, b) => b.marketCap - a.marketCap)

  // Assign ranks
  constituents.forEach((c, i) => {
    c.rank = i + 1
  })

  return constituents
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
