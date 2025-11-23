/**
 * Historical Data Backfill Script using CoinMarketCap API
 *
 * Fetches 12 months of daily price data for all tokens in our indexes
 * Uses CMC paid plan with historical data access
 *
 * Usage: npm run backfill-cmc
 */

import { PrismaClient } from '@prisma/client'
import { INDEX_TOKENS, INDEX_CONFIGS, INDEX_INCEPTION_DATE, INDEX_BASE_VALUE } from '../src/lib/tokens'

const prisma = new PrismaClient()

// CMC API configuration
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com'
const CMC_API_KEY = process.env.CMC_API_KEY || ''
const RATE_LIMIT_DELAY = 2500 // 2.5 seconds between requests (24 calls/min, safe for rate limits)

// CMC ID mappings - use specific IDs to avoid symbol collisions
// IDs obtained from CMC cryptocurrency/map endpoint
const CMC_IDS: Record<string, number> = {
  // Benchmarks
  'BTC': 1,
  'ETH': 1027,
  'BCH': 1831,
  'LTC': 2,
  'ETC': 1321,

  // N100 tokens
  'BNB': 1839,
  'XRP': 52,
  'SOL': 5426,
  'ADA': 2010,
  'DOGE': 74,
  'TRX': 1958,
  'TON': 11419,
  'AVAX': 5805,
  'SHIB': 5994,
  'DOT': 6636,
  'LINK': 1975,
  'XMR': 328,
  'NEAR': 6535,
  'SUI': 20947,
  'APT': 21794,
  'UNI': 7083,
  'ICP': 8916,
  'PEPE': 24478,
  'FET': 3773,
  'RENDER': 5690,
  'ATOM': 3794,
  'XLM': 512,
  'OKB': 3897,
  'WIF': 28752,
  'ONDO': 21159,
  'IMX': 10603,
  'STX': 4847,
  'TAO': 22974,
  'FIL': 2280,
  'ARB': 11841,
  'CRO': 3635,
  'HBAR': 4642,
  'MNT': 27075,
  'OP': 11840,
  'VET': 3077,
  'INJ': 7226,
  'MKR': 1518,
  'AAVE': 7278,
  'GRT': 6719,
  'RUNE': 4157,
  'THETA': 2416,
  'AR': 5632,
  'ALGO': 4030,
  'SEI': 23149,
  'FTM': 3513,
  'BONK': 23095,
  'FLOW': 4558,
  'PYTH': 28177,
  'TIA': 22861,
  'EGLD': 6892,
  'AXS': 6783,
  'SAND': 6210,
  'MANA': 1966,
  'XTZ': 2011,
  'EOS': 1765,
  'SNX': 2586,
  'GALA': 7080,
  'LDO': 8000,
  'NEO': 1376,
  'KAVA': 4846,
  'QNT': 3155,
  'CFX': 7334,
  'WLD': 13502,
  'ASTR': 12885,
  'BLUR': 23121,
  'APE': 18876,
  'DYDX': 28324,
  'ROSE': 7653,
  'CHZ': 4066,
  'CRV': 6538,
  'MINA': 8646,
  'ZIL': 2469,
  'ENJ': 2130,
  'CAKE': 7186,
  'IOTA': 1720,
  'GMX': 11857,
  'COMP': 5692,
  'ZEC': 1437,
  '1INCH': 8104,
  'ENS': 13855,
  'RPL': 2943,
  'OCEAN': 3911,
  'LPT': 3640,
  'ANKR': 3783,
  'BAT': 1697,
  'SKL': 5691,
  'STORJ': 1772,
  'CELO': 5567,
  'YFI': 5864,
  'BAL': 5728,
  'SUSHI': 6758,
  'HNT': 5665,
  'KSM': 5034,
  'IOTX': 2777,
  'ONE': 3945,
  'ZRX': 1896,
  'ICX': 2099,
  'AUDIO': 7455,
  'API3': 7737,
  'AKT': 7431,
  // Additional DeFi tokens
  'PENDLE': 9481,
  'JOE': 11396,
  'AERO': 29270,
  'LQTY': 7429,
  'PHAR': 31969,
  'SPELL': 11289,
  // Additional Infra tokens
  'BAND': 4679,
  'NKN': 2780,
  'SC': 1042,
  'GLM': 1455,
  'FLUX': 3029,
}

interface CMCQuote {
  timestamp: string
  quote: {
    USD: {
      price: number
      market_cap: number
      volume_24h: number
      percent_change_24h: number
      percent_change_7d: number
      percent_change_30d: number
    }
  }
}

interface CMCHistoricalResponse {
  status: {
    error_code: number
    error_message: string | null
  }
  data: {
    [symbol: string]: Array<{
      id: number
      name: string
      symbol: string
      quotes: CMCQuote[]
    }>
  }
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fetch historical data for a single coin
async function fetchCoinHistory(
  symbol: string,
  cmcId: number,
  startDate: string,
  endDate: string
): Promise<CMCQuote[] | null> {
  try {
    const url = `${CMC_BASE_URL}/v2/cryptocurrency/quotes/historical?id=${cmcId}&time_start=${startDate}&time_end=${endDate}&interval=daily`

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`  HTTP error ${response.status} for ${symbol}`)
      return null
    }

    const data = await response.json()

    if (data.status?.error_code !== 0) {
      console.error(`  API error for ${symbol}: ${data.status?.error_message}`)
      return null
    }

    // When querying by ID, response is data.quotes[] directly
    const quotes = data.data?.quotes
    if (!quotes || quotes.length === 0) {
      console.error(`  No data returned for ${symbol} (ID: ${cmcId})`)
      return null
    }

    return quotes
  } catch (error) {
    console.error(`  Error fetching ${symbol}:`, error)
    return null
  }
}

// Get all unique tokens across all indexes
function getAllTokens(): { symbol: string, name: string }[] {
  const tokenMap = new Map<string, string>()

  // Add benchmarks
  tokenMap.set('BTC', 'Bitcoin')
  tokenMap.set('ETH', 'Ethereum')
  tokenMap.set('BCH', 'Bitcoin Cash')
  tokenMap.set('LTC', 'Litecoin')
  tokenMap.set('ETC', 'Ethereum Classic')

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
        let sum = 0
        let count = 0
        for (const token of indexTokens) {
          const price = priceMap.get(token.symbol)
          if (price && price.price > 0) {
            sum += price.price
            count++
          }
        }
        if (count > 0) {
          indexValues.set(indexConfig.symbol, sum / count)
        }
      } else if (indexConfig.methodology === 'MCW') {
        // Market Cap Weighted: Track total market cap of constituents
        // Index value = (total_mcap_today / total_mcap_baseline) × 100
        // This is how S&P 500 and similar indexes work
        let totalMarketCap = 0
        for (const token of indexTokens) {
          const price = priceMap.get(token.symbol)
          if (price && price.marketCap > 0) {
            totalMarketCap += price.marketCap
          }
        }

        if (totalMarketCap > 0) {
          indexValues.set(indexConfig.symbol, totalMarketCap)
        }
      }
    }
  }

  return indexValues
}

async function main() {
  console.log('=' .repeat(60))
  console.log('CoinMarketCap Historical Data Backfill')
  console.log('=' .repeat(60))

  if (!CMC_API_KEY) {
    console.error('ERROR: CMC_API_KEY not set in environment')
    process.exit(1)
  }

  // Calculate date range (12 months back from today)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 12)
  startDate.setDate(startDate.getDate() + 1) // Start 1 day after to stay within 12 months

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  console.log(`Date range: ${startStr} to ${endStr}`)
  console.log('')

  try {
    const allTokens = getAllTokens()
    const tokensWithCMCId = allTokens.filter(t => CMC_IDS[t.symbol])
    const tokensWithoutCMCId = allTokens.filter(t => !CMC_IDS[t.symbol])

    console.log(`Total tokens: ${allTokens.length}`)
    console.log(`Tokens with CMC ID: ${tokensWithCMCId.length}`)
    console.log(`Tokens without CMC ID: ${tokensWithoutCMCId.length}`)

    if (tokensWithoutCMCId.length > 0) {
      console.log('\nMissing CMC IDs for:')
      tokensWithoutCMCId.forEach(t => console.log(`  - ${t.symbol} (${t.name})`))
    }

    console.log('\n' + '-'.repeat(60))
    console.log('Phase 1: Fetching price history from CoinMarketCap')
    console.log('-'.repeat(60))

    let processed = 0
    let failed = 0
    const allDates = new Set<string>()

    for (const token of tokensWithCMCId) {
      const cmcId = CMC_IDS[token.symbol]
      processed++

      console.log(`[${processed}/${tokensWithCMCId.length}] Fetching ${token.symbol} (ID: ${cmcId})...`)

      // Check if we already have data for this token
      const existingCount = await prisma.price.count({
        where: { symbol: token.symbol }
      })

      if (existingCount > 300) {
        console.log(`  Already have ${existingCount} records, skipping...`)
        continue
      }

      const quotes = await fetchCoinHistory(token.symbol, cmcId, startStr, endStr)

      if (!quotes || quotes.length === 0) {
        failed++
        continue
      }

      console.log(`  Got ${quotes.length} daily quotes`)

      // Store prices
      let stored = 0
      for (const quote of quotes) {
        const timestamp = new Date(quote.timestamp)
        timestamp.setUTCHours(12, 0, 0, 0) // Normalize to noon UTC
        const dateStr = timestamp.toISOString().split('T')[0]
        allDates.add(dateStr)

        const usd = quote.quote.USD

        // Check if price already exists for this date
        const existing = await prisma.price.findFirst({
          where: {
            symbol: token.symbol,
            timestamp: {
              gte: new Date(timestamp.getTime() - 12 * 60 * 60 * 1000),
              lte: new Date(timestamp.getTime() + 12 * 60 * 60 * 1000)
            }
          }
        })

        if (!existing) {
          await prisma.price.create({
            data: {
              symbol: token.symbol,
              name: token.name,
              price: usd.price,
              marketCap: usd.market_cap,
              volume24h: usd.volume_24h,
              change24h: usd.percent_change_24h || 0,
              change7d: usd.percent_change_7d || 0,
              change30d: usd.percent_change_30d || 0,
              timestamp
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
    console.log('Phase 2: Creating index snapshots (Divisor Method)')
    console.log('-'.repeat(60))

    // Get all unique dates from the database (not just this run)
    const allPriceDates = await prisma.price.findMany({
      select: { timestamp: true },
      distinct: ['timestamp'],
      orderBy: { timestamp: 'asc' }
    })

    const sortedDates = [...new Set(allPriceDates.map(p => {
      const d = new Date(p.timestamp)
      d.setUTCHours(12, 0, 0, 0)
      return d.toISOString().split('T')[0]
    }))].sort()

    console.log(`Processing ${sortedDates.length} unique dates`)
    console.log(`Index inception date: ${INDEX_INCEPTION_DATE}`)
    console.log(`Index base value: ${INDEX_BASE_VALUE}`)

    if (sortedDates.length === 0) {
      console.log('No dates to process')
      return
    }

    // =========================================================================
    // STEP 1: Calculate divisors and baseline shares from inception date
    // =========================================================================
    const inceptionDate = new Date(INDEX_INCEPTION_DATE)
    inceptionDate.setUTCHours(12, 0, 0, 0)

    // Get prices for inception date
    const inceptionPrices = await prisma.price.findMany({
      where: {
        timestamp: {
          gte: new Date(inceptionDate.getTime() - 12 * 60 * 60 * 1000),
          lte: new Date(inceptionDate.getTime() + 12 * 60 * 60 * 1000)
        }
      }
    })
    const inceptionPriceMap = new Map(inceptionPrices.map(p => [p.symbol, p]))

    console.log(`\nInception date prices: ${inceptionPrices.length} tokens`)

    // Calculate divisors for MCW indexes and baseline shares for EW indexes
    const mcwDivisors = new Map<string, number>()
    const ewBaselineShares = new Map<string, Map<string, number>>() // indexName -> (tokenSymbol -> shares)
    const ewDivisors = new Map<string, number>()

    for (const indexConfig of INDEX_CONFIGS) {
      if (indexConfig.methodology === 'BENCHMARK') continue

      const indexKey = indexConfig.baseIndex as keyof typeof INDEX_TOKENS
      const indexTokens = INDEX_TOKENS[indexKey] || []

      if (indexConfig.methodology === 'MCW') {
        // MCW: Divisor = Total Market Cap at inception / Base Value
        let totalMarketCap = 0
        for (const token of indexTokens) {
          const price = inceptionPriceMap.get(token.symbol)
          if (price && price.marketCap > 0) {
            totalMarketCap += price.marketCap
          }
        }
        const divisor = totalMarketCap / INDEX_BASE_VALUE
        mcwDivisors.set(indexConfig.symbol, divisor)
        console.log(`  ${indexConfig.symbol} divisor: $${(divisor / 1e6).toFixed(2)}M (from $${(totalMarketCap / 1e9).toFixed(2)}B total mcap)`)

      } else if (indexConfig.methodology === 'EW') {
        // EW: Each token gets equal dollar weight at inception
        // Shares per token = (Notional / N) / Price
        // We use a notional value that gives us our base index value

        const tokenShares = new Map<string, number>()
        const notionalInvestment = 1_000_000 // $1M notional portfolio
        const numTokens = indexTokens.filter(t => inceptionPriceMap.has(t.symbol)).length
        const investmentPerToken = notionalInvestment / numTokens

        let totalPortfolioValue = 0
        for (const token of indexTokens) {
          const price = inceptionPriceMap.get(token.symbol)
          if (price && price.price > 0) {
            const shares = investmentPerToken / price.price
            tokenShares.set(token.symbol, shares)
            totalPortfolioValue += shares * price.price
          }
        }

        ewBaselineShares.set(indexConfig.symbol, tokenShares)
        const divisor = totalPortfolioValue / INDEX_BASE_VALUE
        ewDivisors.set(indexConfig.symbol, divisor)
        console.log(`  ${indexConfig.symbol} divisor: $${divisor.toFixed(2)} (${numTokens} tokens, equal weight)`)
      }
    }

    // =========================================================================
    // STEP 2: Calculate index values for each date using divisors
    // =========================================================================
    console.log('\nCalculating index values...')
    let snapshotsCreated = 0

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr)
      date.setUTCHours(12, 0, 0, 0)

      // Get prices for this date
      const prices = await prisma.price.findMany({
        where: {
          timestamp: {
            gte: new Date(date.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(date.getTime() + 12 * 60 * 60 * 1000)
          }
        }
      })
      const priceMap = new Map(prices.map(p => [p.symbol, p]))

      for (const indexConfig of INDEX_CONFIGS) {
        // Check if snapshot already exists
        const existing = await prisma.indexSnapshot.findFirst({
          where: {
            indexName: indexConfig.symbol,
            timestamp: {
              gte: new Date(date.getTime() - 12 * 60 * 60 * 1000),
              lte: new Date(date.getTime() + 12 * 60 * 60 * 1000)
            }
          }
        })
        if (existing) continue

        let indexValue: number | null = null

        if (indexConfig.methodology === 'BENCHMARK') {
          // Benchmark: just use raw price
          const price = priceMap.get(indexConfig.symbol)
          if (price) {
            indexValue = price.price
          }

        } else if (indexConfig.methodology === 'MCW') {
          // MCW: Index = Total Market Cap / Divisor
          const divisor = mcwDivisors.get(indexConfig.symbol)
          if (!divisor) continue

          const indexKey = indexConfig.baseIndex as keyof typeof INDEX_TOKENS
          const indexTokens = INDEX_TOKENS[indexKey] || []

          let totalMarketCap = 0
          for (const token of indexTokens) {
            const price = priceMap.get(token.symbol)
            if (price && price.marketCap > 0) {
              totalMarketCap += price.marketCap
            }
          }

          if (totalMarketCap > 0) {
            indexValue = totalMarketCap / divisor
          }

        } else if (indexConfig.methodology === 'EW') {
          // EW: Index = Sum(Price × Shares) / Divisor
          const shares = ewBaselineShares.get(indexConfig.symbol)
          const divisor = ewDivisors.get(indexConfig.symbol)
          if (!shares || !divisor) continue

          let portfolioValue = 0
          for (const [symbol, tokenShares] of shares) {
            const price = priceMap.get(symbol)
            if (price && price.price > 0) {
              portfolioValue += price.price * tokenShares
            }
          }

          if (portfolioValue > 0) {
            indexValue = portfolioValue / divisor
          }
        }

        if (indexValue !== null) {
          await prisma.indexSnapshot.create({
            data: {
              indexName: indexConfig.symbol,
              value: indexValue,
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
        tokensCount: tokensWithCMCId.length - failed,
        duration: 0
      }
    })

    // Final stats
    const totalPrices = await prisma.price.count()
    const totalSnapshots = await prisma.indexSnapshot.count()

    console.log('\n' + '='.repeat(60))
    console.log('Backfill Complete!')
    console.log('='.repeat(60))
    console.log(`Tokens processed: ${processed - failed}/${tokensWithCMCId.length}`)
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
