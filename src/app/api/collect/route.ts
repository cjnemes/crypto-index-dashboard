import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CMC_API_KEY = process.env.CMC_API_KEY || ''
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v2'

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

  // Optional: Add API key protection
  const authHeader = request.headers.get('authorization')
  const expectedKey = process.env.COLLECT_API_KEY
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CMC_API_KEY) {
    return NextResponse.json({ error: 'CMC_API_KEY not configured' }, { status: 500 })
  }

  try {
    // Get all active tokens
    const tokens = await prisma.tokenConfig.findMany({
      where: { isActive: true }
    })

    const symbols = tokens.map(t => t.symbol)
    const prices = await fetchPrices(symbols)

    // Store prices
    const timestamp = new Date()
    let pricesStored = 0

    for (const [symbol, data] of prices) {
      if (!data.quote?.USD?.price) continue

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

    // Store index snapshots
    const indexConfigs = await prisma.indexConfig.findMany({
      where: { isActive: true }
    })

    for (const index of indexConfigs) {
      if (index.methodology === 'BENCHMARK') {
        const price = prices.get(index.symbol)
        if (price) {
          await prisma.indexSnapshot.create({
            data: {
              indexName: index.symbol,
              value: price.quote.USD.price,
              returns1d: price.quote.USD.percent_change_24h,
              returns7d: price.quote.USD.percent_change_7d,
              returns30d: price.quote.USD.percent_change_30d,
              timestamp
            }
          })
        }
      } else {
        // Calculate weighted index value
        const indexTokens = await prisma.tokenConfig.findMany({
          where: { indexes: { contains: index.baseIndex }, isActive: true }
        })

        let value = 0
        if (index.methodology === 'EW') {
          let count = 0
          for (const token of indexTokens) {
            const price = prices.get(token.symbol)
            if (price?.quote?.USD?.percent_change_30d) {
              value += price.quote.USD.percent_change_30d
              count++
            }
          }
          value = count > 0 ? value / count : 0
        } else if (index.methodology === 'MCW') {
          let totalMarketCap = 0
          for (const token of indexTokens) {
            const price = prices.get(token.symbol)
            if (price?.quote?.USD?.market_cap) {
              totalMarketCap += price.quote.USD.market_cap
            }
          }
          for (const token of indexTokens) {
            const price = prices.get(token.symbol)
            if (price?.quote?.USD && totalMarketCap > 0) {
              const weight = (price.quote.USD.market_cap || 0) / totalMarketCap
              value += weight * (price.quote.USD.percent_change_30d || 0)
            }
          }
        }

        await prisma.indexSnapshot.create({
          data: {
            indexName: index.symbol,
            value: 100 + value,
            returns30d: value,
            timestamp
          }
        })
      }
    }

    const duration = Date.now() - startTime
    await prisma.collectionLog.create({
      data: { status: 'success', tokensCount: pricesStored, duration }
    })

    return NextResponse.json({
      success: true,
      pricesStored,
      indexesUpdated: indexConfigs.length,
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
