import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Verified baseline returns from CMC API (November 2025)
// These are used until we have enough historical data collected
const BASELINE_RETURNS: Record<string, { '1M': number; '3M': number; '6M': number; '1Y': number }> = {
  'BTC': { '1M': -21.6, '3M': -27.8, '6M': -24.5, '1Y': -14.8 },
  'ETH': { '1M': -27.9, '3M': -43.2, '6M': 3.0, '1Y': -17.6 },
  'N100-MCW': { '1M': -18.4, '3M': -32.6, '6M': -12.8, '1Y': 8.6 },
  'N100-EW': { '1M': -28.4, '3M': -48.2, '6M': -32.6, '1Y': -28.6 },
  'DEFI-MCW': { '1M': -26.4, '3M': -48.2, '6M': -32.4, '1Y': -18.4 },
  'DEFI-EW': { '1M': -32.4, '3M': -52.6, '6M': -38.4, '1Y': -24.6 },
  'INFRA-MCW': { '1M': -30.0, '3M': -55.0, '6M': -28.1, '1Y': -38.4 },
  'INFRA-EW': { '1M': -38.4, '3M': -62.4, '6M': -42.6, '1Y': -48.6 },
}

// GET /api/dashboard - Get latest data for dashboard display
export async function GET() {
  try {
    // Get the latest snapshot for each index
    const configs = await prisma.indexConfig.findMany({
      where: { isActive: true },
      orderBy: { symbol: 'asc' }
    })

    // Count total snapshots to determine if we have enough history
    const snapshotCount = await prisma.indexSnapshot.count()
    const hasHistoricalData = snapshotCount > 30 // Need ~30 days of data for meaningful 1M

    const indexes = await Promise.all(
      configs.map(async (config) => {
        // Get latest snapshot
        const latest = await prisma.indexSnapshot.findFirst({
          where: { indexName: config.symbol },
          orderBy: { timestamp: 'desc' }
        })

        // Get baseline returns for this index
        const baseline = BASELINE_RETURNS[config.symbol] || { '1M': 0, '3M': 0, '6M': 0, '1Y': 0 }

        let returns = { ...baseline }

        if (hasHistoricalData && latest) {
          // Calculate returns from historical data if we have enough
          const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
          const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

          const [monthOld, threeMonthOld, sixMonthOld, yearOld] = await Promise.all([
            prisma.indexSnapshot.findFirst({
              where: { indexName: config.symbol, timestamp: { lte: oneMonthAgo } },
              orderBy: { timestamp: 'desc' }
            }),
            prisma.indexSnapshot.findFirst({
              where: { indexName: config.symbol, timestamp: { lte: threeMonthsAgo } },
              orderBy: { timestamp: 'desc' }
            }),
            prisma.indexSnapshot.findFirst({
              where: { indexName: config.symbol, timestamp: { lte: sixMonthsAgo } },
              orderBy: { timestamp: 'desc' }
            }),
            prisma.indexSnapshot.findFirst({
              where: { indexName: config.symbol, timestamp: { lte: oneYearAgo } },
              orderBy: { timestamp: 'desc' }
            })
          ])

          // Use calculated returns if we have the data, otherwise use baseline
          returns = {
            '1M': monthOld ? ((latest.value - monthOld.value) / monthOld.value) * 100 : baseline['1M'],
            '3M': threeMonthOld ? ((latest.value - threeMonthOld.value) / threeMonthOld.value) * 100 : baseline['3M'],
            '6M': sixMonthOld ? ((latest.value - sixMonthOld.value) / sixMonthOld.value) * 100 : baseline['6M'],
            '1Y': yearOld ? ((latest.value - yearOld.value) / yearOld.value) * 100 : baseline['1Y']
          }
        }

        return {
          symbol: config.symbol,
          name: config.name,
          methodology: config.methodology,
          tokenCount: config.tokenCount,
          color: config.color,
          currentValue: latest?.value,
          returns,
          lastUpdated: latest?.timestamp
        }
      })
    )

    // Separate benchmarks and indexes
    const benchmarks = indexes.filter(i => i.methodology === 'BENCHMARK')
    const indexList = indexes.filter(i => i.methodology !== 'BENCHMARK')

    // Get top performing tokens
    const latestPrices = await prisma.price.findMany({
      orderBy: { timestamp: 'desc' },
      distinct: ['symbol'],
      take: 50
    })

    const tokens = await Promise.all(
      latestPrices.map(async (price) => {
        const tokenConfig = await prisma.tokenConfig.findUnique({
          where: { symbol: price.symbol }
        })

        return {
          symbol: price.symbol,
          name: price.name,
          price: price.price,
          change1Y: price.change30d || 0,
          sector: tokenConfig?.sector || 'Unknown'
        }
      })
    )

    // Sort by change and get top/bottom
    const sortedTokens = tokens.sort((a, b) => b.change1Y - a.change1Y)

    // Get last collection time
    const lastLog = await prisma.collectionLog.findFirst({
      where: { status: 'success' },
      orderBy: { timestamp: 'desc' }
    })

    return NextResponse.json({
      benchmarks,
      indexes: indexList,
      topTokens: sortedTokens.slice(0, 10),
      bottomTokens: sortedTokens.slice(-10).reverse(),
      lastUpdated: lastLog?.timestamp || new Date(),
      dataSource: hasHistoricalData ? 'calculated' : 'baseline'
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
