/**
 * Backfill historical data for sector sub-indexes
 * Uses existing price data to calculate MCW index values
 */

import { PrismaClient } from '@prisma/client'

// Use the copied Docker database
const prisma = new PrismaClient({
  datasources: {
    db: { url: 'file:/tmp/crypto-index-copy.db' }
  }
})

const INDEX_INCEPTION_DATE = '2024-11-25'
const INDEX_BASE_VALUE = 1000

// Sector index token lists (must match tokens.ts)
const SECTOR_TOKENS: Record<string, string[]> = {
  L1: ['SOL', 'ADA', 'TRX', 'TON', 'AVAX', 'NEAR', 'SUI', 'APT', 'ICP', 'HBAR', 'ALGO', 'SEI', 'FLOW', 'EGLD', 'XTZ', 'EOS', 'NEO', 'CFX', 'ASTR', 'MINA', 'ZIL', 'CELO', 'ONE', 'ICX'],
  SCALE: ['ARB', 'OP', 'STX', 'MNT', 'SKL', 'DOT', 'ATOM', 'TIA', 'KSM'],
  AI: ['TAO', 'FET', 'RENDER', 'AKT', 'THETA', 'LPT', 'IOTX', 'HNT', 'IOTA', 'ANKR'],
  GAMING: ['IMX', 'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'APE', 'BLUR'],
  DEX: ['UNI', 'CRV', 'CAKE', 'SUSHI', 'BAL', 'ZRX', 'JOE', 'AERO', 'PHAR', 'HYPE', '1INCH'],
  YIELD: ['AAVE', 'COMP', 'MKR', 'KAVA', 'MORPHO', 'SNX', 'DYDX', 'GMX', 'LDO', 'RPL', 'PENDLE', 'YFI'],
  DATA: ['LINK', 'PYTH', 'API3', 'BAND', 'FIL', 'AR', 'STORJ', 'GRT', 'OCEAN', 'ENS']
}

const INDEX_SYMBOLS: Record<string, string> = {
  L1: 'L1-MCW',
  SCALE: 'SCALE-MCW',
  AI: 'AI-MCW',
  GAMING: 'GAMING-MCW',
  DEX: 'DEX-MCW',
  YIELD: 'YIELD-MCW',
  DATA: 'DATA-MCW'
}

async function main() {
  console.log('Backfilling sector index historical data...\n')

  // Get inception date prices for divisor calculation
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
  console.log(`Found ${inceptionPrices.length} prices at inception date`)

  // Calculate divisors for each sector index
  const divisors = new Map<string, number>()

  for (const [baseIndex, tokens] of Object.entries(SECTOR_TOKENS)) {
    let totalMarketCap = 0
    let foundTokens = 0

    for (const symbol of tokens) {
      const price = inceptionPriceMap.get(symbol)
      if (price && price.marketCap > 0) {
        totalMarketCap += price.marketCap
        foundTokens++
      }
    }

    const divisor = totalMarketCap / INDEX_BASE_VALUE
    divisors.set(baseIndex, divisor)
    console.log(`${baseIndex}: ${foundTokens}/${tokens.length} tokens, divisor = ${(divisor / 1e9).toFixed(2)}B`)
  }

  // Get all unique dates from price table using Prisma
  const allPrices = await prisma.price.findMany({
    where: {
      timestamp: { gte: inceptionDate }
    },
    select: { timestamp: true },
    distinct: ['timestamp'],
    orderBy: { timestamp: 'asc' }
  })

  // Group by date (normalize to noon UTC)
  const uniqueDates = new Map<string, Date>()
  for (const p of allPrices) {
    const dateKey = p.timestamp.toISOString().split('T')[0]
    if (!uniqueDates.has(dateKey)) {
      const normalized = new Date(dateKey)
      normalized.setUTCHours(12, 0, 0, 0)
      uniqueDates.set(dateKey, normalized)
    }
  }

  const dates = Array.from(uniqueDates.values()).sort((a, b) => a.getTime() - b.getTime())
  console.log(`\nProcessing ${dates.length} dates...`)

  let totalCreated = 0
  let totalSkipped = 0

  for (const targetDate of dates) {

    // Get prices for this date
    const dayPrices = await prisma.price.findMany({
      where: {
        timestamp: {
          gte: new Date(targetDate.getTime() - 12 * 60 * 60 * 1000),
          lte: new Date(targetDate.getTime() + 12 * 60 * 60 * 1000)
        }
      }
    })

    const priceMap = new Map(dayPrices.map(p => [p.symbol, p]))

    // Calculate and store each sector index
    for (const [baseIndex, tokens] of Object.entries(SECTOR_TOKENS)) {
      const indexSymbol = INDEX_SYMBOLS[baseIndex]
      const divisor = divisors.get(baseIndex)

      if (!divisor || divisor === 0) continue

      // Check if snapshot already exists
      const existing = await prisma.indexSnapshot.findFirst({
        where: {
          indexName: indexSymbol,
          timestamp: {
            gte: new Date(targetDate.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(targetDate.getTime() + 12 * 60 * 60 * 1000)
          }
        }
      })

      if (existing) {
        totalSkipped++
        continue
      }

      // Calculate MCW index value
      let totalMarketCap = 0
      for (const symbol of tokens) {
        const price = priceMap.get(symbol)
        if (price && price.marketCap > 0) {
          totalMarketCap += price.marketCap
        }
      }

      if (totalMarketCap > 0) {
        const indexValue = totalMarketCap / divisor

        await prisma.indexSnapshot.create({
          data: {
            indexName: indexSymbol,
            value: indexValue,
            timestamp: targetDate
          }
        })
        totalCreated++
      }
    }

  }

  // Progress complete
  process.stdout.write('\n')

  console.log(`\n\nBackfill complete!`)
  console.log(`Created: ${totalCreated} snapshots`)
  console.log(`Skipped: ${totalSkipped} (already existed)`)

  // Show sample of created data
  const samples = await prisma.indexSnapshot.findMany({
    where: {
      indexName: { in: Object.values(INDEX_SYMBOLS) }
    },
    orderBy: { timestamp: 'desc' },
    take: 14
  })

  console.log('\nRecent sector index snapshots:')
  for (const s of samples) {
    console.log(`  ${s.indexName}: ${s.value.toFixed(2)} (${s.timestamp.toISOString().split('T')[0]})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
