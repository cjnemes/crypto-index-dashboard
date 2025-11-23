import { PrismaClient } from '@prisma/client'
import { INDEX_TOKENS, INDEX_CONFIGS, INDEX_INCEPTION_DATE, INDEX_BASE_VALUE } from '../src/lib/tokens'

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
    timestamp.setUTCHours(12, 0, 0, 0) // Normalize to noon UTC
    let pricesStored = 0

    for (const [symbol, data] of prices) {
      if (!data.quote?.USD?.price) {
        console.log(`Skipping ${symbol} - no price data`)
        continue
      }

      // Check if we already have a price for this date
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
    console.log(`Stored ${pricesStored} price records`)

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

    for (const indexConfig of INDEX_CONFIGS) {
      if (indexConfig.methodology === 'BENCHMARK') continue

      const indexKey = indexConfig.baseIndex as keyof typeof INDEX_TOKENS
      const indexTokens = INDEX_TOKENS[indexKey] || []

      if (indexConfig.methodology === 'MCW') {
        let totalMarketCap = 0
        for (const token of indexTokens) {
          const price = inceptionPriceMap.get(token.symbol)
          if (price && price.marketCap > 0) {
            totalMarketCap += price.marketCap
          }
        }
        mcwDivisors.set(indexConfig.symbol, totalMarketCap / INDEX_BASE_VALUE)

      } else if (indexConfig.methodology === 'EW') {
        const tokenShares = new Map<string, number>()
        const notionalInvestment = 1_000_000
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
        ewDivisors.set(indexConfig.symbol, totalPortfolioValue / INDEX_BASE_VALUE)
      }
    }

    // =========================================================================
    // CALCULATE AND STORE INDEX SNAPSHOTS
    // =========================================================================
    const todayPriceMap = new Map<string, CMCQuote>()
    for (const [symbol, data] of prices) {
      todayPriceMap.set(symbol, data)
    }

    const indexConfigs = await prisma.indexConfig.findMany({
      where: { isActive: true }
    })

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
        console.log(`Snapshot already exists for ${index.symbol} today, skipping`)
        continue
      }

      let indexValue: number | null = null

      if (index.methodology === 'BENCHMARK') {
        // Benchmarks: just use the price
        const price = todayPriceMap.get(index.symbol)
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
        }
      } else {
        const indexKey = index.baseIndex as keyof typeof INDEX_TOKENS
        const indexTokens = INDEX_TOKENS[indexKey] || []

        if (index.methodology === 'MCW') {
          // MCW: Index = Total Market Cap / Divisor
          const divisor = mcwDivisors.get(index.symbol)
          if (divisor && divisor > 0) {
            let totalMarketCap = 0
            for (const token of indexTokens) {
              const price = todayPriceMap.get(token.symbol)
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
            for (const token of indexTokens) {
              const price = todayPriceMap.get(token.symbol)
              const tokenShares = shares.get(token.symbol)
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
          console.log(`  ${index.symbol}: ${indexValue.toFixed(2)}`)
        }
      }
    }
    console.log(`Created index snapshots`)

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
