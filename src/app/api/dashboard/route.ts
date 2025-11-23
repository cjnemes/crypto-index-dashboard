import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        // Get earliest snapshot (inception) as fallback for return calculations
        const earliest = await prisma.indexSnapshot.findFirst({
          where: { indexName: config.symbol },
          orderBy: { timestamp: 'asc' }
        })

        let returns = { '24H': 0, '1M': 0, '3M': 0, '6M': 0, '1Y': 0 }

        if (latest) {
          // Calculate returns from historical data
          // Use the latest snapshot timestamp as reference point for period calculations
          const latestTime = latest.timestamp.getTime()
          const oneMonthAgo = new Date(latestTime - 30 * 24 * 60 * 60 * 1000)
          const threeMonthsAgo = new Date(latestTime - 90 * 24 * 60 * 60 * 1000)
          const sixMonthsAgo = new Date(latestTime - 180 * 24 * 60 * 60 * 1000)
          const oneYearAgo = new Date(latestTime - 365 * 24 * 60 * 60 * 1000)

          // For 24h, get the PREVIOUS snapshot (not time-based) to handle daily data correctly
          const [previousSnapshot, monthOld, threeMonthOld, sixMonthOld, yearOld] = await Promise.all([
            prisma.indexSnapshot.findFirst({
              where: { indexName: config.symbol, timestamp: { lt: latest.timestamp } },
              orderBy: { timestamp: 'desc' }
            }),
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

          // Helper to calculate return percentage
          const calcReturn = (oldValue: number | undefined | null): number => {
            if (!oldValue || oldValue === 0) return 0
            return ((latest.value - oldValue) / oldValue) * 100
          }

          // Use period-specific snapshot if available, otherwise fall back to earliest (inception)
          // This ensures we always calculate from real data, not hardcoded baselines
          returns = {
            '24H': calcReturn(previousSnapshot?.value ?? earliest?.value),
            '1M': calcReturn(monthOld?.value ?? earliest?.value),
            '3M': calcReturn(threeMonthOld?.value ?? earliest?.value),
            '6M': calcReturn(sixMonthOld?.value ?? earliest?.value),
            '1Y': calcReturn(yearOld?.value ?? earliest?.value)
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
