/**
 * Recalculate all MCW index snapshots with capped market cap methodology
 *
 * This script applies the 25% weight cap to all historical index calculations,
 * ensuring historical performance data reflects the capped methodology.
 *
 * Algorithm:
 * 1. At inception, calculate capped weights for each constituent
 * 2. Determine "shares" for each token based on capped weights
 * 3. For each historical date: Index = Sum(shares × price) / divisor
 */

import { PrismaClient } from '@prisma/client'
import { INDEX_TOKENS, INDEX_CONFIGS, INDEX_INCEPTION_DATE, INDEX_BASE_VALUE } from '../src/lib/tokens'

const prisma = new PrismaClient()

// Maximum weight any single constituent can have (25%)
const MAX_CONSTITUENT_WEIGHT = 0.25
const MAX_CAPPING_ITERATIONS = 10

interface TokenWeight {
  symbol: string
  marketCap: number
  weight: number
}

/**
 * Calculate capped weights from market caps
 * Implements iterative redistribution algorithm
 */
function calculateCappedWeights(
  marketCaps: Map<string, number>,
  maxWeight: number = MAX_CONSTITUENT_WEIGHT
): Map<string, number> {
  // Build initial weights from market caps
  let totalMarketCap = 0
  for (const mc of marketCaps.values()) {
    totalMarketCap += mc
  }

  if (totalMarketCap === 0) {
    return new Map()
  }

  const weights = new Map<string, number>()
  for (const [symbol, mc] of marketCaps) {
    weights.set(symbol, mc / totalMarketCap)
  }

  // Apply iterative capping
  for (let iteration = 0; iteration < MAX_CAPPING_ITERATIONS; iteration++) {
    const capped: string[] = []
    const uncapped: string[] = []

    for (const [symbol, weight] of weights) {
      if (weight > maxWeight) {
        capped.push(symbol)
      } else {
        uncapped.push(symbol)
      }
    }

    // If nothing exceeds cap, we're done
    if (capped.length === 0) {
      break
    }

    // Calculate excess weight to redistribute
    let excessWeight = 0
    for (const symbol of capped) {
      const weight = weights.get(symbol)!
      excessWeight += weight - maxWeight
      weights.set(symbol, maxWeight)
    }

    if (uncapped.length === 0) {
      break
    }

    // Calculate total weight of uncapped constituents
    let uncappedTotalWeight = 0
    for (const symbol of uncapped) {
      uncappedTotalWeight += weights.get(symbol)!
    }

    // Redistribute excess proportionally
    if (uncappedTotalWeight > 0) {
      for (const symbol of uncapped) {
        const currentWeight = weights.get(symbol)!
        const proportion = currentWeight / uncappedTotalWeight
        weights.set(symbol, currentWeight + excessWeight * proportion)
      }
    }

    // Normalize to ensure sum is 1
    let totalWeight = 0
    for (const w of weights.values()) {
      totalWeight += w
    }
    if (Math.abs(totalWeight - 1) > 0.0001) {
      for (const [symbol, w] of weights) {
        weights.set(symbol, w / totalWeight)
      }
    }
  }

  return weights
}

/**
 * Calculate inception shares using capped weights
 */
async function calculateInceptionShares(
  indexSymbol: string,
  tokens: { symbol: string }[]
): Promise<{ shares: Map<string, number>; divisor: number } | null> {
  const inceptionDate = new Date(INDEX_INCEPTION_DATE)
  inceptionDate.setUTCHours(12, 0, 0, 0)

  // Get inception prices
  const inceptionPrices = await prisma.price.findMany({
    where: {
      symbol: { in: tokens.map(t => t.symbol) },
      timestamp: {
        gte: new Date(inceptionDate.getTime() - 24 * 60 * 60 * 1000),
        lte: new Date(inceptionDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })

  // Build price and market cap maps
  const priceMap = new Map<string, number>()
  const marketCapMap = new Map<string, number>()

  for (const p of inceptionPrices) {
    if (!priceMap.has(p.symbol) && p.price > 0 && p.marketCap > 0) {
      priceMap.set(p.symbol, p.price)
      marketCapMap.set(p.symbol, p.marketCap)
    }
  }

  if (marketCapMap.size === 0) {
    console.log(`  No inception data found for ${indexSymbol}`)
    return null
  }

  // Calculate capped weights
  const cappedWeights = calculateCappedWeights(marketCapMap)

  // Calculate shares for each token based on capped weights
  // Using $1M notional investment at inception
  const notionalInvestment = 1_000_000
  const shares = new Map<string, number>()

  let inceptionPortfolioValue = 0
  for (const token of tokens) {
    const weight = cappedWeights.get(token.symbol)
    const price = priceMap.get(token.symbol)

    if (weight && price && weight > 0 && price > 0) {
      const tokenInvestment = notionalInvestment * weight
      const tokenShares = tokenInvestment / price
      shares.set(token.symbol, tokenShares)
      inceptionPortfolioValue += tokenShares * price
    }
  }

  if (inceptionPortfolioValue === 0) {
    return null
  }

  const divisor = inceptionPortfolioValue / INDEX_BASE_VALUE

  return { shares, divisor }
}

/**
 * Recalculate index value for a specific date using capped methodology
 */
async function calculateIndexValue(
  shares: Map<string, number>,
  divisor: number,
  timestamp: Date,
  tokens: { symbol: string }[]
): Promise<number | null> {
  // Get prices for this date
  const prices = await prisma.price.findMany({
    where: {
      symbol: { in: tokens.map(t => t.symbol) },
      timestamp: {
        gte: new Date(timestamp.getTime() - 12 * 60 * 60 * 1000),
        lte: new Date(timestamp.getTime() + 12 * 60 * 60 * 1000)
      }
    }
  })

  const priceMap = new Map<string, number>()
  for (const p of prices) {
    if (!priceMap.has(p.symbol) || p.price > priceMap.get(p.symbol)!) {
      priceMap.set(p.symbol, p.price)
    }
  }

  // Calculate portfolio value
  let portfolioValue = 0
  for (const [symbol, tokenShares] of shares) {
    const price = priceMap.get(symbol)
    if (price && price > 0) {
      portfolioValue += tokenShares * price
    }
  }

  if (portfolioValue === 0 || divisor === 0) {
    return null
  }

  return portfolioValue / divisor
}

async function recalculateIndex(indexConfig: typeof INDEX_CONFIGS[0]) {
  console.log(`\nRecalculating ${indexConfig.symbol}...`)

  if (indexConfig.methodology !== 'MCW') {
    console.log('  Skipping - not MCW methodology')
    return
  }

  const indexKey = indexConfig.baseIndex as keyof typeof INDEX_TOKENS
  const tokens = INDEX_TOKENS[indexKey]

  if (!tokens || tokens.length === 0) {
    console.log('  Skipping - no tokens defined')
    return
  }

  // Calculate inception shares with capped weights
  const inception = await calculateInceptionShares(indexConfig.symbol, tokens)
  if (!inception) {
    console.log('  Skipping - could not calculate inception shares')
    return
  }

  console.log(`  Divisor: ${inception.divisor.toFixed(2)}`)
  console.log(`  Shares for ${inception.shares.size} tokens`)

  // Log capped weights at inception for verification
  const weightLog: string[] = []
  for (const [symbol, tokenShares] of inception.shares) {
    const totalShares = Array.from(inception.shares.values()).reduce((a, b) => a + b, 0)
    // Weight approximation (won't be exact due to price differences)
    weightLog.push(symbol)
  }
  console.log(`  Tokens: ${weightLog.slice(0, 5).join(', ')}${weightLog.length > 5 ? '...' : ''}`)

  // Get all snapshots for this index
  const snapshots = await prisma.indexSnapshot.findMany({
    where: { indexName: indexConfig.symbol },
    orderBy: { timestamp: 'asc' }
  })

  console.log(`  Snapshots to recalculate: ${snapshots.length}`)

  let updated = 0
  let skipped = 0

  for (const snapshot of snapshots) {
    const newValue = await calculateIndexValue(
      inception.shares,
      inception.divisor,
      snapshot.timestamp,
      tokens
    )

    if (newValue === null) {
      skipped++
      continue
    }

    // Update if value changed significantly (more than 0.01%)
    const percentDiff = Math.abs((newValue - snapshot.value) / snapshot.value) * 100
    if (percentDiff > 0.01) {
      await prisma.indexSnapshot.update({
        where: { id: snapshot.id },
        data: { value: newValue }
      })
      updated++
    }
  }

  console.log(`  Updated: ${updated}, Skipped: ${skipped}`)
}

async function main() {
  console.log('='.repeat(60))
  console.log('RECALCULATING INDEX SNAPSHOTS WITH CAPPED METHODOLOGY')
  console.log('='.repeat(60))
  console.log(`\nMax constituent weight: ${(MAX_CONSTITUENT_WEIGHT * 100).toFixed(0)}%`)
  console.log(`Index base value: ${INDEX_BASE_VALUE}`)
  console.log(`Inception date: ${INDEX_INCEPTION_DATE}`)

  // Recalculate all MCW indexes
  for (const indexConfig of INDEX_CONFIGS) {
    if (indexConfig.methodology === 'MCW') {
      await recalculateIndex(indexConfig)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('RECALCULATION COMPLETE')
  console.log('='.repeat(60))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
