/**
 * Recalculate all index snapshots with current constituent lists
 */

import { PrismaClient } from '@prisma/client'

const dbPath = process.argv[2]
const prisma = new PrismaClient(dbPath ? {
  datasources: { db: { url: `file:${dbPath}` } }
} : undefined)

const INDEX_BASE_VALUE = 1000
const INDEX_INCEPTION_DATE = '2024-11-25'

const INDEX_TOKENS: Record<string, string[]> = {
  DEFI: ['UNI', 'AAVE', 'MKR', 'LDO', 'INJ', 'RUNE', 'SNX', 'CRV', 'DYDX', 'GMX', 'COMP', '1INCH', 'CAKE', 'YFI', 'BAL', 'SUSHI', 'ZRX', 'KAVA', 'PENDLE', 'JOE', 'AERO', 'LQTY', 'PHAR', 'MORPHO', 'HYPE'],
  INFRA: ['LINK', 'RENDER', 'GRT', 'FIL', 'AR', 'TAO', 'FET', 'THETA', 'PYTH', 'QNT', 'OCEAN', 'LPT', 'ANKR', 'ENS', 'STORJ', 'HNT', 'IOTX', 'IOTA', 'API3', 'BAND', 'AKT', 'NKN', 'SC', 'GLM', 'FLUX'],
  DEX: ['UNI', 'CRV', 'CAKE', 'SUSHI', 'BAL', 'ZRX', 'JOE', 'AERO', 'PHAR', 'HYPE', '1INCH'],
  YIELD: ['AAVE', 'COMP', 'MKR', 'KAVA', 'MORPHO', 'SNX', 'DYDX', 'GMX', 'LDO', 'PENDLE', 'YFI'],
}

async function getInceptionDivisor(tokens: string[]): Promise<number> {
  const inceptionDate = new Date(INDEX_INCEPTION_DATE)
  inceptionDate.setUTCHours(12, 0, 0, 0)
  
  const prices = await prisma.price.findMany({
    where: {
      symbol: { in: tokens },
      timestamp: {
        gte: new Date(inceptionDate.getTime() - 24 * 60 * 60 * 1000),
        lte: new Date(inceptionDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })
  
  const priceMap = new Map<string, number>()
  for (const p of prices) {
    if (!priceMap.has(p.symbol) && p.marketCap > 0) {
      priceMap.set(p.symbol, p.marketCap)
    }
  }
  
  let totalMarketCap = 0
  for (const token of tokens) {
    totalMarketCap += priceMap.get(token) || 0
  }
  
  return totalMarketCap / INDEX_BASE_VALUE
}

async function recalculateIndex(indexKey: string, tokens: string[]) {
  const indexSymbol = indexKey + '-MCW'
  console.log(`\nRecalculating ${indexSymbol}...`)
  
  const divisor = await getInceptionDivisor(tokens)
  if (divisor === 0) {
    console.log('  Skipping - no inception data')
    return
  }
  console.log('  Divisor:', divisor.toFixed(2))
  
  const snapshots = await prisma.indexSnapshot.findMany({
    where: { indexName: indexSymbol },
    orderBy: { timestamp: 'asc' }
  })
  
  console.log('  Snapshots to update:', snapshots.length)
  
  let updated = 0
  for (const snapshot of snapshots) {
    const prices = await prisma.price.findMany({
      where: {
        symbol: { in: tokens },
        timestamp: {
          gte: new Date(snapshot.timestamp.getTime() - 12 * 60 * 60 * 1000),
          lte: new Date(snapshot.timestamp.getTime() + 12 * 60 * 60 * 1000)
        }
      }
    })
    
    const priceMap = new Map<string, number>()
    for (const p of prices) {
      if (!priceMap.has(p.symbol) || p.marketCap > priceMap.get(p.symbol)!) {
        priceMap.set(p.symbol, p.marketCap)
      }
    }
    
    let totalMarketCap = 0
    for (const token of tokens) {
      totalMarketCap += priceMap.get(token) || 0
    }
    
    const newValue = totalMarketCap / divisor
    
    if (Math.abs(newValue - snapshot.value) > 0.01) {
      await prisma.indexSnapshot.update({
        where: { id: snapshot.id },
        data: { value: newValue }
      })
      updated++
    }
  }
  
  console.log('  Updated:', updated)
}

async function main() {
  console.log('Recalculating index snapshots...')
  
  for (const [key, tokens] of Object.entries(INDEX_TOKENS)) {
    await recalculateIndex(key, tokens)
  }
  
  console.log('\nDone!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
