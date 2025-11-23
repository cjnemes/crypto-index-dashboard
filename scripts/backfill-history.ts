import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CMC_API_KEY = process.env.CMC_API_KEY || ''
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com'

// How many days back to fetch
const DAYS_TO_BACKFILL = 30

interface CMCHistoricalQuote {
  symbol: string
  name: string
  quotes: Array<{
    timestamp: string
    quote: {
      USD: {
        price: number
        market_cap: number
        volume_24h: number
      }
    }
  }>
}

async function fetchHistoricalPrice(symbol: string, timestamp: Date): Promise<any> {
  const timeStr = timestamp.toISOString()

  const response = await fetch(
    `${CMC_BASE_URL}/v2/cryptocurrency/quotes/historical?symbol=${symbol}&time_start=${timeStr}&time_end=${timeStr}&count=1`,
    {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const text = await response.text()
    console.error(`API error for ${symbol}: ${response.status} - ${text}`)
    return null
  }

  const data = await response.json()
  return data
}

async function fetchLatestPrices(symbols: string[]): Promise<Map<string, any>> {
  const response = await fetch(
    `${CMC_BASE_URL}/v2/cryptocurrency/quotes/latest?symbol=${symbols.join(',')}`,
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
  const prices = new Map<string, any>()

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
  console.log(`Backfilling ${DAYS_TO_BACKFILL} days of historical data...`)

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

    // Get index configs
    const indexConfigs = await prisma.indexConfig.findMany({
      where: { isActive: true }
    })

    console.log(`Fetching data for ${symbols.length} tokens...`)

    // For each day in the past, we'll use the CMC percent_change fields
    // to estimate historical prices from the current price
    const latestPrices = await fetchLatestPrices(symbols)
    console.log(`Got latest prices for ${latestPrices.size} tokens`)

    // Create historical snapshots by working backwards from current prices
    // Using the percent changes from CMC to estimate past values
    const now = new Date()

    for (let daysAgo = DAYS_TO_BACKFILL; daysAgo >= 0; daysAgo--) {
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      timestamp.setHours(12, 0, 0, 0) // Normalize to noon

      // Check if we already have data for this date
      const existingSnapshot = await prisma.indexSnapshot.findFirst({
        where: {
          timestamp: {
            gte: new Date(timestamp.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(timestamp.getTime() + 12 * 60 * 60 * 1000)
          }
        }
      })

      if (existingSnapshot) {
        console.log(`Day ${daysAgo}: Already have data, skipping`)
        continue
      }

      console.log(`Day ${daysAgo}: Creating snapshot for ${timestamp.toDateString()}`)

      // Store prices - estimate historical from current + percent changes
      for (const [symbol, data] of latestPrices) {
        if (!data.quote?.USD?.price) continue

        // Estimate historical price based on days ago and percent changes
        let estimatedPrice = data.quote.USD.price
        let estimatedMarketCap = data.quote.USD.market_cap || 0

        // Use percent_change_30d to estimate prices within last 30 days
        if (daysAgo > 0 && daysAgo <= 30 && data.quote.USD.percent_change_30d) {
          // Linear interpolation: if 30d change is -10%, then 15 days ago was ~5% higher
          const dailyChange = data.quote.USD.percent_change_30d / 30
          const changeFromNow = dailyChange * daysAgo
          estimatedPrice = data.quote.USD.price / (1 + changeFromNow / 100)
          estimatedMarketCap = (data.quote.USD.market_cap || 0) / (1 + changeFromNow / 100)
        }

        await prisma.price.create({
          data: {
            symbol: data.symbol,
            name: data.name,
            price: estimatedPrice,
            marketCap: estimatedMarketCap,
            volume24h: data.quote.USD.volume_24h || 0,
            change24h: data.quote.USD.percent_change_24h || 0,
            change7d: data.quote.USD.percent_change_7d || 0,
            change30d: data.quote.USD.percent_change_30d || 0,
            timestamp
          }
        })
      }

      // Create index snapshots
      for (const index of indexConfigs) {
        if (index.methodology === 'BENCHMARK') {
          const price = latestPrices.get(index.symbol)
          if (price?.quote?.USD?.price) {
            let estimatedPrice = price.quote.USD.price
            if (daysAgo > 0 && daysAgo <= 30 && price.quote.USD.percent_change_30d) {
              const dailyChange = price.quote.USD.percent_change_30d / 30
              const changeFromNow = dailyChange * daysAgo
              estimatedPrice = price.quote.USD.price / (1 + changeFromNow / 100)
            }

            await prisma.indexSnapshot.create({
              data: {
                indexName: index.symbol,
                value: estimatedPrice,
                returns1d: price.quote.USD.percent_change_24h,
                returns7d: price.quote.USD.percent_change_7d,
                returns30d: price.quote.USD.percent_change_30d,
                timestamp
              }
            })
          }
        } else {
          // Calculate index value
          const indexTokens = await prisma.tokenConfig.findMany({
            where: { indexes: { contains: index.baseIndex }, isActive: true }
          })

          let indexValue = 100 // Base value

          if (index.methodology === 'EW') {
            let totalChange = 0
            let count = 0
            for (const token of indexTokens) {
              const price = latestPrices.get(token.symbol)
              if (price?.quote?.USD?.percent_change_30d) {
                // Estimate the change at this point in time
                const dailyChange = price.quote.USD.percent_change_30d / 30
                const changeAtThisPoint = dailyChange * (30 - daysAgo)
                totalChange += changeAtThisPoint
                count++
              }
            }
            if (count > 0) {
              indexValue = 100 + (totalChange / count)
            }
          } else if (index.methodology === 'MCW') {
            let totalMarketCap = 0
            for (const token of indexTokens) {
              const price = latestPrices.get(token.symbol)
              if (price?.quote?.USD?.market_cap) {
                totalMarketCap += price.quote.USD.market_cap
              }
            }

            let weightedChange = 0
            for (const token of indexTokens) {
              const price = latestPrices.get(token.symbol)
              if (price?.quote?.USD && totalMarketCap > 0) {
                const weight = (price.quote.USD.market_cap || 0) / totalMarketCap
                const dailyChange = (price.quote.USD.percent_change_30d || 0) / 30
                const changeAtThisPoint = dailyChange * (30 - daysAgo)
                weightedChange += weight * changeAtThisPoint
              }
            }
            indexValue = 100 + weightedChange
          }

          await prisma.indexSnapshot.create({
            data: {
              indexName: index.symbol,
              value: indexValue,
              returns30d: indexValue - 100,
              timestamp
            }
          })
        }
      }
    }

    // Log success
    await prisma.collectionLog.create({
      data: {
        status: 'success',
        tokensCount: latestPrices.size,
        duration: 0
      }
    })

    const totalSnapshots = await prisma.indexSnapshot.count()
    const totalPrices = await prisma.price.count()

    console.log(`\nBackfill complete!`)
    console.log(`Total index snapshots: ${totalSnapshots}`)
    console.log(`Total price records: ${totalPrices}`)

  } catch (error) {
    console.error('Backfill failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
