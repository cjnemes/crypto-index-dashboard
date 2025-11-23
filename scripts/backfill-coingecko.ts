/**
 * Backfill historical price data from CoinGecko
 * For tokens that were added to indexes but don't have historical data
 *
 * Usage:
 *   npx tsx scripts/backfill-coingecko.ts                    # Use default DATABASE_URL
 *   npx tsx scripts/backfill-coingecko.ts /tmp/copy.db       # Use specific database file
 */

import { PrismaClient } from '@prisma/client'

// Allow database path override via CLI argument
const dbPath = process.argv[2]
const prisma = new PrismaClient(dbPath ? {
  datasources: { db: { url: `file:${dbPath}` } }
} : undefined)

// CoinGecko IDs for tokens (lowercase slug from coingecko.com)
const COINGECKO_IDS: Record<string, string> = {
  MORPHO: 'morpho',
  HYPE: 'hyperliquid',
}

const TOKENS_TO_BACKFILL = ['MORPHO', 'HYPE']

async function fetchHistoricalData(coinId: string, days: number = 365): Promise<any> {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    }
  })

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  return response.json()
}

async function main() {
  console.log('Backfilling historical data from CoinGecko...\n')

  for (const symbol of TOKENS_TO_BACKFILL) {
    const coinId = COINGECKO_IDS[symbol]
    if (!coinId) {
      console.log(`No CoinGecko ID for ${symbol}, skipping`)
      continue
    }

    console.log(`Fetching ${symbol} (${coinId})...`)

    try {
      const data = await fetchHistoricalData(coinId)

      if (!data.prices || !data.market_caps) {
        console.log(`  No data returned for ${symbol}`)
        continue
      }

      // Get token config for name
      const tokenConfig = await prisma.tokenConfig.findUnique({
        where: { symbol }
      })

      if (!tokenConfig) {
        console.log(`  Token ${symbol} not in config, skipping`)
        continue
      }

      let created = 0
      let skipped = 0

      // Process daily data
      for (let i = 0; i < data.prices.length; i++) {
        const [timestamp, price] = data.prices[i]
        const marketCap = data.market_caps[i]?.[1] || 0
        const volume = data.total_volumes?.[i]?.[1] || 0

        // Normalize to noon UTC
        const date = new Date(timestamp)
        date.setUTCHours(12, 0, 0, 0)

        // Check if we already have data for this day
        const existing = await prisma.price.findFirst({
          where: {
            symbol,
            timestamp: {
              gte: new Date(date.getTime() - 12 * 60 * 60 * 1000),
              lte: new Date(date.getTime() + 12 * 60 * 60 * 1000)
            }
          }
        })

        if (existing) {
          skipped++
          continue
        }

        await prisma.price.create({
          data: {
            symbol,
            name: tokenConfig.name,
            price,
            marketCap,
            volume24h: volume,
            change24h: 0,
            timestamp: date
          }
        })
        created++
      }

      console.log(`  Created: ${created}, Skipped: ${skipped}`)

      // Rate limit: wait 1 second between tokens
      await new Promise(r => setTimeout(r, 1000))

    } catch (error) {
      console.error(`  Error fetching ${symbol}:`, error)
    }
  }

  console.log('\nBackfill complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
