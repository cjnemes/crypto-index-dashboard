import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/history - Get historical index data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30d'
  const indexName = searchParams.get('index')
  const customStart = searchParams.get('start')
  const customEnd = searchParams.get('end')

  // Calculate date range
  const now = new Date()
  let startDate: Date
  let endDate: Date = now

  // Use custom date range if provided
  if (customStart && customEnd) {
    startDate = new Date(customStart)
    endDate = new Date(customEnd)
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999)
  } else {
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '60d':
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = new Date(0)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  try {
    // Get index snapshots
    const where: any = {
      timestamp: { gte: startDate, lte: endDate }
    }
    if (indexName) {
      where.indexName = indexName
    }

    const snapshots = await prisma.indexSnapshot.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      select: {
        indexName: true,
        value: true,
        returns1d: true,
        returns7d: true,
        returns30d: true,
        timestamp: true
      }
    })

    // Group by index name
    const byIndex: Record<string, typeof snapshots> = {}
    for (const snapshot of snapshots) {
      if (!byIndex[snapshot.indexName]) {
        byIndex[snapshot.indexName] = []
      }
      byIndex[snapshot.indexName].push(snapshot)
    }

    // Get index configs for metadata
    const configs = await prisma.indexConfig.findMany({
      where: { isActive: true }
    })

    const configMap = new Map(configs.map(c => [c.symbol, c]))

    // Build response with metadata - only include indexes with active configs
    const result = Object.entries(byIndex)
      .filter(([name]) => configMap.has(name)) // Only show indexes with active configs
      .map(([name, data]) => ({
        indexName: name,
        config: configMap.get(name),
        dataPoints: data.length,
        history: data.map(d => ({
          timestamp: d.timestamp,
          value: d.value,
          returns1d: d.returns1d,
          returns7d: d.returns7d,
          returns30d: d.returns30d
        }))
      }))

    return NextResponse.json({
      period: customStart && customEnd ? 'custom' : period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      indexes: result
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
