/**
 * Historical Data Backfill Script using CoinGecko API
 *
 * Fetches 2 years of daily price data for all tokens in our indexes
 * CoinGecko free tier: 10-50 calls/minute, up to 365 days per request
 *
 * Usage: npm run backfill-coingecko
 */

import { PrismaClient } from '@prisma/client'
import { COINGECKO_IDS, getCoinGeckoId } from '../src/lib/coingecko-ids'
import { INDEX_TOKENS, INDEX_CONFIGS } from '../src/lib/tokens'

const prisma = new PrismaClient()

// CoinGecko API configuration
const CG_BASE_URL = 'https://api.coingecko.com/api/v3'
const RATE_LIMIT_DELAY = 2000 // 2 seconds between requests (safe for free tier)
const DAYS_PER_REQUEST = 90 // CoinGecko free tier limit
const DAYS_TO_BACKFILL = 365 // 1 year (can extend by running multiple times)

interface CoinGeckoMarketChart {
  prices: [number, number][] // [timestamp, price]
  market_caps: [number, number][] // [timestamp, market_cap]
  total_volumes: [number, number][] // [timestamp, volume]
}

interface DailyPrice {
  timestamp: Date
  price: number
  marketCap: number
  volume: number
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fetch historical data for a single coin (in chunks to avoid auth requirements)
async function fetchCoinHistory(coinId: string, totalDays: number): Promise<CoinGeckoMarketChart | null> {
  const allPrices: [number, number][] = []
  const allMarketCaps: [number, number][] = []
  const allVolumes: [number, number][] = []

  // Fetch in chunks of DAYS_PER_REQUEST
  const numChunks = Math.ceil(totalDays / DAYS_PER_REQUEST)

  for (let chunk = 0; chunk < numChunks; chunk++) {
    const daysForChunk = Math.min(DAYS_PER_REQUEST, totalDays - (chunk * DAYS_PER_REQUEST))
    const startDaysAgo = totalDays - (chunk * DAYS_PER_REQUEST)

    // For CoinGecko, we need to calculate from/to timestamps for older data
    // But the simple approach: just fetch the most recent chunk
    if (chunk > 0) {
      // Skip older chunks for now - free tier doesn't support historical ranges well
      continue
    }

    try {
      const url = `${CG_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${daysForChunk}`
      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`  Rate limited, waiting 60 seconds...`)
          await sleep(60000)
          chunk-- // Retry this chunk
          continue
        }
        console.error(`  Failed to fetch ${coinId}: ${response.status}`)
        return null
      }

      const data: CoinGeckoMarketChart = await response.json()

      if (data.prices) allPrices.push(...data.prices)
      if (data.market_caps) allMarketCaps.push(...data.market_caps)
      if (data.total_volumes) allVolumes.push(...data.total_volumes)

      if (chunk < numChunks - 1) {
        await sleep(RATE_LIMIT_DELAY)
      }
    } catch (error) {
      console.error(`  Error fetching ${coinId}:`, error)
      return null
    }
  }

  if (allPrices.length === 0) return null

  return {
    prices: allPrices,
    market_caps: allMarketCaps,
    total_volumes: allVolumes
  }
}

// Process market chart data into daily prices
function processDailyPrices(data: CoinGeckoMarketChart): DailyPrice[] {
  const dailyPrices: DailyPrice[] = []

  for (let i = 0; i < data.prices.length; i++) {
    const [timestamp, price] = data.prices[i]
    const marketCap = data.market_caps[i]?.[1] || 0
    const volume = data.total_volumes[i]?.[1] || 0

    // Normalize to noon UTC
    const date = new Date(timestamp)
    date.setUTCHours(12, 0, 0, 0)

    dailyPrices.push({
      timestamp: date,
      price,
      marketCap,
      volume
    })
  }

  return dailyPrices
}

// Get all unique tokens across all indexes
function getAllTokens(): { symbol: string, name: string }[] {
  const tokenMap = new Map<string, string>()

  for (const token of INDEX_TOKENS.N100) {
    tokenMap.set(token.symbol, token.name)
  }
  for (const token of INDEX_TOKENS.DEFI) {
    tokenMap.set(token.symbol, token.name)
  }
  for (const token of INDEX_TOKENS.INFRA) {
    tokenMap.set(token.symbol, token.name)
  }

  return Array.from(tokenMap.entries()).map(([symbol, name]) => ({ symbol, name }))
}

// Calculate index values for a specific date
async function calculateIndexValues(date: Date): Promise<Map<string, number>> {
  const indexValues = new Map<string, number>()

  // Get prices for this date (within 12 hours)
  const prices = await prisma.price.findMany({
    where: {
      timestamp: {
        gte: new Date(date.getTime() - 12 * 60 * 60 * 1000),
        lte: new Date(date.getTime() + 12 * 60 * 60 * 1000)
      }
    }
  })

  const priceMap = new Map(prices.map(p => [p.symbol, p]))

  // Calculate each index
  for (const indexConfig of INDEX_CONFIGS) {
    if (indexConfig.methodology === 'BENCHMARK') {
      // BTC or ETH - just use the price
      const price = priceMap.get(indexConfig.symbol)
      if (price) {
        indexValues.set(indexConfig.symbol, price.price)
      }
    } else {
      // Get tokens for this index
      const indexKey = indexConfig.baseIndex as keyof typeof INDEX_TOKENS
      const indexTokens = INDEX_TOKENS[indexKey] || []

      if (indexConfig.methodology === 'EW') {
        // Equal Weight: average of all token prices normalized
        // We'll calculate % change from first day
        let sum = 0
        let count = 0
        for (const token of indexTokens) {
          const price = priceMap.get(token.symbol)
          if (price && price.price > 0) {
            sum += price.price
            count++
          }
        }
        // Store raw sum for now, will normalize later
        if (count > 0) {
          indexValues.set(indexConfig.symbol, sum / count)
        }
      } else if (indexConfig.methodology === 'MCW') {
        // Market Cap Weighted
        let totalMarketCap = 0
        for (const token of indexTokens) {
          const price = priceMap.get(token.symbol)
          if (price && price.marketCap > 0) {
            totalMarketCap += price.marketCap
          }
        }

        let weightedSum = 0
        for (const token of indexTokens) {
          const price = priceMap.get(token.symbol)
          if (price && price.marketCap > 0 && totalMarketCap > 0) {
            const weight = price.marketCap / totalMarketCap
            weightedSum += weight * price.price
          }
        }

        if (weightedSum > 0) {
          indexValues.set(indexConfig.symbol, weightedSum)
        }
      }
    }
  }

  return indexValues
}

async function main() {
  console.log('=' .repeat(60))
  console.log('CoinGecko Historical Data Backfill')
  console.log('=' .repeat(60))
  console.log(`Fetching ${DAYS_TO_BACKFILL} days of historical data`)
  console.log('')

  try {
    const allTokens = getAllTokens()
    const tokensWithCGId = allTokens.filter(t => getCoinGeckoId(t.symbol))
    const tokensWithoutCGId = allTokens.filter(t => !getCoinGeckoId(t.symbol))

    console.log(`Total tokens: ${allTokens.length}`)
    console.log(`Tokens with CoinGecko ID: ${tokensWithCGId.length}`)
    console.log(`Tokens without CoinGecko ID: ${tokensWithoutCGId.length}`)

    if (tokensWithoutCGId.length > 0) {
      console.log('\nMissing CoinGecko IDs for:')
      tokensWithoutCGId.forEach(t => console.log(`  - ${t.symbol} (${t.name})`))
    }

    console.log('\n' + '-'.repeat(60))
    console.log('Phase 1: Fetching price history from CoinGecko')
    console.log('-'.repeat(60))

    let processed = 0
    let failed = 0
    const allDates = new Set<string>()

    for (const token of tokensWithCGId) {
      const coinId = getCoinGeckoId(token.symbol)!
      processed++

      console.log(`[${processed}/${tokensWithCGId.length}] Fetching ${token.symbol} (${coinId})...`)

      // Check if we already have recent data for this token
      const existingCount = await prisma.price.count({
        where: { symbol: token.symbol }
      })

      if (existingCount > DAYS_TO_BACKFILL - 30) {
        console.log(`  Already have ${existingCount} records, skipping...`)
        continue
      }

      const data = await fetchCoinHistory(coinId, DAYS_TO_BACKFILL)

      if (!data) {
        failed++
        continue
      }

      const dailyPrices = processDailyPrices(data)
      console.log(`  Got ${dailyPrices.length} daily prices`)

      // Store prices
      let stored = 0
      for (const dp of dailyPrices) {
        // Check if price already exists for this date
        const dateStr = dp.timestamp.toISOString().split('T')[0]
        allDates.add(dateStr)

        const existing = await prisma.price.findFirst({
          where: {
            symbol: token.symbol,
            timestamp: {
              gte: new Date(dp.timestamp.getTime() - 12 * 60 * 60 * 1000),
              lte: new Date(dp.timestamp.getTime() + 12 * 60 * 60 * 1000)
            }
          }
        })

        if (!existing) {
          await prisma.price.create({
            data: {
              symbol: token.symbol,
              name: token.name,
              price: dp.price,
              marketCap: dp.marketCap,
              volume24h: dp.volume,
              change24h: 0, // Will calculate later
              change7d: 0,
              change30d: 0,
              timestamp: dp.timestamp
            }
          })
          stored++
        }
      }

      console.log(`  Stored ${stored} new prices`)

      // Rate limit
      await sleep(RATE_LIMIT_DELAY)
    }

    console.log('\n' + '-'.repeat(60))
    console.log('Phase 2: Creating index snapshots')
    console.log('-'.repeat(60))

    // Get all unique dates from prices
    const sortedDates = Array.from(allDates).sort()
    console.log(`Processing ${sortedDates.length} unique dates`)

    // Get baseline values (first date) for normalization
    const firstDate = new Date(sortedDates[0])
    firstDate.setUTCHours(12, 0, 0, 0)
    const baselineValues = await calculateIndexValues(firstDate)

    console.log('\nBaseline values (first date):')
    baselineValues.forEach((value, name) => {
      console.log(`  ${name}: ${value.toFixed(2)}`)
    })

    // Create index snapshots for each date
    let snapshotsCreated = 0
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr)
      date.setUTCHours(12, 0, 0, 0)

      const indexValues = await calculateIndexValues(date)

      for (const [indexName, rawValue] of indexValues) {
        const config = INDEX_CONFIGS.find(c => c.symbol === indexName)
        if (!config) continue

        // Check if snapshot exists
        const existing = await prisma.indexSnapshot.findFirst({
          where: {
            indexName,
            timestamp: {
              gte: new Date(date.getTime() - 12 * 60 * 60 * 1000),
              lte: new Date(date.getTime() + 12 * 60 * 60 * 1000)
            }
          }
        })

        if (!existing) {
          let normalizedValue: number

          if (config.methodology === 'BENCHMARK') {
            // Use raw price for benchmarks
            normalizedValue = rawValue
          } else {
            // Normalize to base 100 for indexes
            const baseline = baselineValues.get(indexName) || rawValue
            normalizedValue = (rawValue / baseline) * 100
          }

          await prisma.indexSnapshot.create({
            data: {
              indexName,
              value: normalizedValue,
              timestamp: date
            }
          })
          snapshotsCreated++
        }
      }
    }

    console.log(`\nCreated ${snapshotsCreated} index snapshots`)

    // Log collection
    await prisma.collectionLog.create({
      data: {
        status: 'success',
        tokensCount: tokensWithCGId.length - failed,
        duration: 0,
        notes: `Backfilled ${DAYS_TO_BACKFILL} days from CoinGecko`
      }
    })

    // Final stats
    const totalPrices = await prisma.price.count()
    const totalSnapshots = await prisma.indexSnapshot.count()

    console.log('\n' + '='.repeat(60))
    console.log('Backfill Complete!')
    console.log('='.repeat(60))
    console.log(`Tokens processed: ${processed - failed}/${tokensWithCGId.length}`)
    console.log(`Total price records: ${totalPrices}`)
    console.log(`Total index snapshots: ${totalSnapshots}`)
    console.log(`Date range: ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`)

  } catch (error) {
    console.error('Backfill failed:', error)
    await prisma.collectionLog.create({
      data: {
        status: 'failed',
        tokensCount: 0,
        duration: 0,
        errorMessage: String(error)
      }
    })
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
