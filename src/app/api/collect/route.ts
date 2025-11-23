import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CMC_API_KEY = process.env.CMC_API_KEY || ''
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v2'

// Rate limiting - allow 1 request per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
let lastCollectionTime = 0

// Index configuration - must match tokens.ts
const INDEX_INCEPTION_DATE = '2024-11-25'
const INDEX_BASE_VALUE = 1000

const INDEX_TOKENS: Record<string, string[]> = {
  // Core indexes
  N100: ['BNB', 'XRP', 'SOL', 'ADA', 'DOGE', 'TRX', 'TON', 'AVAX', 'SHIB', 'DOT', 'LINK', 'XMR', 'NEAR', 'SUI', 'APT', 'UNI', 'ICP', 'PEPE', 'FET', 'RENDER', 'ATOM', 'XLM', 'OKB', 'WIF', 'ONDO', 'HYPE', 'IMX', 'STX', 'TAO', 'FIL', 'ARB', 'CRO', 'HBAR', 'MNT', 'OP', 'VET', 'INJ', 'MKR', 'AAVE', 'GRT', 'RUNE', 'THETA', 'AR', 'ALGO', 'SEI', 'AERO', 'BONK', 'FLOW', 'PYTH', 'TIA', 'EGLD', 'AXS', 'SAND', 'MANA', 'XTZ', 'EOS', 'SNX', 'GALA', 'LDO', 'NEO', 'KAVA', 'QNT', 'CFX', 'WLD', 'ASTR', 'BLUR', 'APE', 'DYDX', 'ROSE', 'CHZ', 'CRV', 'MINA', 'ZIL', 'ENJ', 'CAKE', 'IOTA', 'GMX', 'COMP', 'ZEC', '1INCH', 'ENS', 'RPL', 'OCEAN', 'LPT', 'ANKR', 'BAT', 'SKL', 'STORJ', 'CELO', 'YFI', 'BAL', 'SUSHI', 'HNT', 'KSM', 'IOTX', 'ONE', 'ZRX', 'ICX', 'API3', 'AKT'],
  DEFI: ['UNI', 'AAVE', 'MKR', 'LDO', 'INJ', 'RUNE', 'SNX', 'CRV', 'DYDX', 'GMX', 'COMP', '1INCH', 'CAKE', 'RPL', 'YFI', 'BAL', 'SUSHI', 'ZRX', 'KAVA', 'PENDLE', 'JOE', 'AERO', 'LQTY', 'PHAR', 'MORPHO', 'HYPE'],
  INFRA: ['LINK', 'RENDER', 'GRT', 'FIL', 'AR', 'TAO', 'FET', 'THETA', 'PYTH', 'QNT', 'OCEAN', 'LPT', 'ANKR', 'ENS', 'STORJ', 'HNT', 'IOTX', 'API3', 'BAND', 'AKT', 'NKN', 'SC', 'GLM', 'FLUX'],
  // Sector sub-indexes
  L1: ['SOL', 'ADA', 'TRX', 'TON', 'AVAX', 'NEAR', 'SUI', 'APT', 'ICP', 'HBAR', 'ALGO', 'SEI', 'FLOW', 'EGLD', 'XTZ', 'EOS', 'NEO', 'CFX', 'ASTR', 'MINA', 'ZIL', 'CELO', 'ONE', 'ICX'],
  SCALE: ['ARB', 'OP', 'STX', 'MNT', 'SKL', 'DOT', 'ATOM', 'TIA', 'KSM'],
  AI: ['TAO', 'FET', 'RENDER', 'AKT', 'THETA', 'LPT', 'IOTX', 'HNT', 'IOTA', 'ANKR'],
  GAMING: ['IMX', 'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'APE', 'BLUR'],
  DEX: ['UNI', 'CRV', 'CAKE', 'SUSHI', 'BAL', 'ZRX', 'JOE', 'AERO', 'PHAR', 'HYPE', '1INCH'],
  YIELD: ['AAVE', 'COMP', 'MKR', 'KAVA', 'MORPHO', 'SNX', 'DYDX', 'GMX', 'LDO', 'RPL', 'PENDLE', 'YFI'],
  DATA: ['LINK', 'PYTH', 'API3', 'BAND', 'FIL', 'AR', 'STORJ', 'GRT', 'OCEAN', 'ENS']
}

interface CMCQuote {
  symbol: string
  name: string
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

async function fetchPrices(symbols: string[]): Promise<Map<string, CMCQuote>> {
  const response = await fetch(
    `${CMC_BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbols.join(',')}`,
    {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`CMC API error: ${response.status}`)
  }

  const data = await response.json()
  const prices = new Map<string, CMCQuote>()

  if (data.data) {
    for (const symbol of Object.keys(data.data)) {
      const tokenData = data.data[symbol][0]
      if (tokenData) {
        prices.set(symbol, tokenData)
      }
    }
  }

  return prices
}

// POST /api/collect - Collect prices from CMC
export async function POST(request: Request) {
  const startTime = Date.now()

  // Rate limiting - prevent abuse
  const timeSinceLastCollection = startTime - lastCollectionTime
  if (timeSinceLastCollection < RATE_LIMIT_WINDOW) {
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastCollection) / 1000)
    return NextResponse.json(
      { error: `Rate limited. Please wait ${waitTime} seconds.` },
      { status: 429 }
    )
  }

  // API key protection - required in production
  const authHeader = request.headers.get('authorization')
  const expectedKey = process.env.COLLECT_API_KEY
  if (process.env.NODE_ENV === 'production' && !expectedKey) {
    return NextResponse.json({ error: 'COLLECT_API_KEY not configured' }, { status: 500 })
  }
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CMC_API_KEY) {
    return NextResponse.json({ error: 'CMC_API_KEY not configured' }, { status: 500 })
  }

  // Update rate limit timestamp
  lastCollectionTime = startTime

  try {
    // Get all active tokens
    const tokens = await prisma.tokenConfig.findMany({
      where: { isActive: true }
    })

    const symbols = tokens.map(t => t.symbol)
    const prices = await fetchPrices(symbols)

    // Store prices with normalized timestamp
    const timestamp = new Date()
    timestamp.setUTCHours(12, 0, 0, 0) // Normalize to noon UTC
    let pricesStored = 0

    for (const [symbol, data] of prices) {
      if (!data.quote?.USD?.price) continue

      // Check if price already exists for today
      const existing = await prisma.price.findFirst({
        where: {
          symbol: data.symbol,
          timestamp: {
            gte: new Date(timestamp.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(timestamp.getTime() + 12 * 60 * 60 * 1000)
          }
        }
      })

      if (!existing) {
        await prisma.price.create({
          data: {
            symbol: data.symbol,
            name: data.name,
            price: data.quote.USD.price,
            marketCap: data.quote.USD.market_cap || 0,
            volume24h: data.quote.USD.volume_24h || 0,
            change24h: data.quote.USD.percent_change_24h || 0,
            change7d: data.quote.USD.percent_change_7d || 0,
            change30d: data.quote.USD.percent_change_30d || 0,
            timestamp
          }
        })
        pricesStored++
      }
    }

    // =========================================================================
    // CALCULATE DIVISORS FROM INCEPTION DATA
    // =========================================================================
    const inceptionDate = new Date(INDEX_INCEPTION_DATE)
    inceptionDate.setUTCHours(12, 0, 0, 0)

    const inceptionPrices = await prisma.price.findMany({
      where: {
        timestamp: {
          gte: new Date(inceptionDate.getTime() - 12 * 60 * 60 * 1000),
          lte: new Date(inceptionDate.getTime() + 12 * 60 * 60 * 1000)
        }
      }
    })
    const inceptionPriceMap = new Map(inceptionPrices.map(p => [p.symbol, p]))

    // Calculate MCW divisors and EW baseline shares
    const mcwDivisors = new Map<string, number>()
    const ewBaselineShares = new Map<string, Map<string, number>>()
    const ewDivisors = new Map<string, number>()

    const indexConfigs = await prisma.indexConfig.findMany({
      where: { isActive: true }
    })

    for (const indexConfig of indexConfigs) {
      if (indexConfig.methodology === 'BENCHMARK') continue

      const indexTokens = INDEX_TOKENS[indexConfig.baseIndex] || []

      if (indexConfig.methodology === 'MCW') {
        let totalMarketCap = 0
        for (const symbol of indexTokens) {
          const price = inceptionPriceMap.get(symbol)
          if (price && price.marketCap > 0) {
            totalMarketCap += price.marketCap
          }
        }
        mcwDivisors.set(indexConfig.symbol, totalMarketCap / INDEX_BASE_VALUE)

      } else if (indexConfig.methodology === 'EW') {
        const tokenShares = new Map<string, number>()
        const notionalInvestment = 1_000_000
        const validTokens = indexTokens.filter(s => inceptionPriceMap.has(s))
        const investmentPerToken = notionalInvestment / validTokens.length

        let totalPortfolioValue = 0
        for (const symbol of indexTokens) {
          const price = inceptionPriceMap.get(symbol)
          if (price && price.price > 0) {
            const shares = investmentPerToken / price.price
            tokenShares.set(symbol, shares)
            totalPortfolioValue += shares * price.price
          }
        }

        ewBaselineShares.set(indexConfig.symbol, tokenShares)
        ewDivisors.set(indexConfig.symbol, totalPortfolioValue / INDEX_BASE_VALUE)
      }
    }

    // =========================================================================
    // CALCULATE AND STORE INDEX SNAPSHOTS
    // =========================================================================
    let indexesUpdated = 0

    for (const index of indexConfigs) {
      // Check if snapshot already exists for today
      const existingSnapshot = await prisma.indexSnapshot.findFirst({
        where: {
          indexName: index.symbol,
          timestamp: {
            gte: new Date(timestamp.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(timestamp.getTime() + 12 * 60 * 60 * 1000)
          }
        }
      })

      if (existingSnapshot) {
        continue // Skip if already exists
      }

      let indexValue: number | null = null

      if (index.methodology === 'BENCHMARK') {
        const price = prices.get(index.symbol)
        if (price) {
          indexValue = price.quote.USD.price
          await prisma.indexSnapshot.create({
            data: {
              indexName: index.symbol,
              value: indexValue,
              returns1d: price.quote.USD.percent_change_24h,
              returns7d: price.quote.USD.percent_change_7d,
              returns30d: price.quote.USD.percent_change_30d,
              timestamp
            }
          })
          indexesUpdated++
        }
      } else {
        const indexTokens = INDEX_TOKENS[index.baseIndex] || []

        if (index.methodology === 'MCW') {
          // MCW: Index = Total Market Cap / Divisor
          const divisor = mcwDivisors.get(index.symbol)
          if (divisor && divisor > 0) {
            let totalMarketCap = 0
            for (const symbol of indexTokens) {
              const price = prices.get(symbol)
              if (price && price.quote.USD.market_cap > 0) {
                totalMarketCap += price.quote.USD.market_cap
              }
            }
            indexValue = totalMarketCap / divisor
          }

        } else if (index.methodology === 'EW') {
          // EW: Index = Sum(Price × Shares) / Divisor
          const shares = ewBaselineShares.get(index.symbol)
          const divisor = ewDivisors.get(index.symbol)

          if (shares && divisor && divisor > 0) {
            let portfolioValue = 0
            for (const symbol of indexTokens) {
              const price = prices.get(symbol)
              const tokenShares = shares.get(symbol)
              if (price && tokenShares && price.quote.USD.price > 0) {
                portfolioValue += price.quote.USD.price * tokenShares
              }
            }
            indexValue = portfolioValue / divisor
          }
        }

        if (indexValue !== null) {
          await prisma.indexSnapshot.create({
            data: {
              indexName: index.symbol,
              value: indexValue,
              timestamp
            }
          })
          indexesUpdated++
        }
      }
    }

    const duration = Date.now() - startTime
    await prisma.collectionLog.create({
      data: { status: 'success', tokensCount: pricesStored, duration }
    })

    return NextResponse.json({
      success: true,
      pricesStored,
      indexesUpdated,
      duration,
      timestamp: timestamp.toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await prisma.collectionLog.create({
      data: { status: 'error', errorMessage, duration }
    })

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// GET /api/collect - Get collection status
export async function GET() {
  const logs = await prisma.collectionLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 10
  })

  const lastSuccess = logs.find(l => l.status === 'success')
  const priceCount = await prisma.price.count()
  const snapshotCount = await prisma.indexSnapshot.count()

  return NextResponse.json({
    lastCollection: lastSuccess?.timestamp,
    totalPriceRecords: priceCount,
    totalSnapshots: snapshotCount,
    recentLogs: logs
  })
}
