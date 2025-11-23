import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

async function calculateIndexValue(
  indexSymbol: string,
  methodology: string,
  baseIndex: string,
  prices: Map<string, CMCQuote>
): Promise<number> {
  // Get tokens for this index
  const tokens = await prisma.tokenConfig.findMany({
    where: {
      indexes: { contains: baseIndex },
      isActive: true
    }
  })

  if (tokens.length === 0) return 0

  if (methodology === 'EW') {
    // Equal Weight: Simple average of returns
    let totalReturn = 0
    let count = 0
    for (const token of tokens) {
      const price = prices.get(token.symbol)
      if (price) {
        totalReturn += price.quote.USD.percent_change_30d || 0
        count++
      }
    }
    return count > 0 ? totalReturn / count : 0
  } else if (methodology === 'MCW') {
    // Market Cap Weighted
    let totalMarketCap = 0
    let weightedReturn = 0

    for (const token of tokens) {
      const price = prices.get(token.symbol)
      if (price) {
        const marketCap = price.quote.USD.market_cap || 0
        totalMarketCap += marketCap
      }
    }

    for (const token of tokens) {
      const price = prices.get(token.symbol)
      if (price && totalMarketCap > 0) {
        const weight = (price.quote.USD.market_cap || 0) / totalMarketCap
        weightedReturn += weight * (price.quote.USD.percent_change_30d || 0)
      }
    }

    return weightedReturn
  }

  return 0
}

async function main() {
  const startTime = Date.now()
  console.log('Starting price collection...')

  if (!CMC_API_KEY) {
    console.error('CMC_API_KEY not set!')
    process.exit(1)
  }

  try {
    // Get all active tokens
    const tokens = await prisma.tokenConfig.findMany({
      where: { isActive: true }
    })

    const symbols = tokens.map(t => t.symbol)
    console.log(`Fetching prices for ${symbols.length} tokens...`)

    // Fetch prices from CMC
    const prices = await fetchPrices(symbols)
    console.log(`Received prices for ${prices.size} tokens`)

    // Store prices in database
    const timestamp = new Date()
    let pricesStored = 0

    for (const [symbol, data] of prices) {
      // Skip tokens without valid price data
      if (!data.quote?.USD?.price) {
        console.log(`Skipping ${symbol} - no price data`)
        continue
      }

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
    console.log(`Stored ${pricesStored} price records`)

    // Calculate and store index snapshots
    const indexConfigs = await prisma.indexConfig.findMany({
      where: { isActive: true }
    })

    for (const index of indexConfigs) {
      if (index.methodology === 'BENCHMARK') {
        // For benchmarks (BTC, ETH), just store the price change
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
        // For indexes, calculate weighted value
        const value = await calculateIndexValue(
          index.symbol,
          index.methodology,
          index.baseIndex,
          prices
        )

        await prisma.indexSnapshot.create({
          data: {
            indexName: index.symbol,
            value: 100 + value, // Normalize to base 100
            returns30d: value,
            timestamp
          }
        })
      }
    }
    console.log(`Stored ${indexConfigs.length} index snapshots`)

    // Log success
    const duration = Date.now() - startTime
    await prisma.collectionLog.create({
      data: {
        status: 'success',
        tokensCount: pricesStored,
        duration
      }
    })

    console.log(`Collection completed in ${duration}ms`)

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await prisma.collectionLog.create({
      data: {
        status: 'error',
        errorMessage,
        duration
      }
    })

    console.error('Collection failed:', errorMessage)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
