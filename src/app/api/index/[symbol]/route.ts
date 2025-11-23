import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { INDEX_CONFIGS } from '@/lib/tokens'
import { calculateConstituents, ConstituentWithWeight } from '@/lib/weights'

interface RouteParams {
  params: { symbol: string }
}

// GET /api/index/[symbol] - Get detailed index information including constituents
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { symbol } = params
    const indexSymbol = decodeURIComponent(symbol).toUpperCase()

    // Get days parameter from query string (default 30)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Find index config
    const config = INDEX_CONFIGS.find(c => c.symbol === indexSymbol)
    if (!config) {
      return NextResponse.json(
        { error: `Index not found: ${indexSymbol}` },
        { status: 404 }
      )
    }

    // Get latest index snapshot
    const latest = await prisma.indexSnapshot.findFirst({
      where: { indexName: indexSymbol },
      orderBy: { timestamp: 'desc' }
    })

    // Get previous day snapshot for 24h change
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const previousDay = await prisma.indexSnapshot.findFirst({
      where: {
        indexName: indexSymbol,
        timestamp: { lte: yesterday }
      },
      orderBy: { timestamp: 'desc' }
    })

    // Calculate 24h change
    let change24h = 0
    if (latest && previousDay && previousDay.value > 0) {
      change24h = ((latest.value - previousDay.value) / previousDay.value) * 100
    }

    // Get latest prices for all tokens (for constituent calculation)
    const latestPrices = await prisma.price.findMany({
      orderBy: { timestamp: 'desc' },
      distinct: ['symbol']
    })

    // Build price data map
    const priceData = new Map<string, { price: number; marketCap: number; volume24h: number; change24h: number }>()
    for (const price of latestPrices) {
      priceData.set(price.symbol, {
        price: price.price,
        marketCap: price.marketCap,
        volume24h: price.volume24h ?? 0,
        change24h: price.change24h ?? 0
      })
    }

    // Calculate constituents with weights
    const constituents = calculateConstituents(indexSymbol, priceData)

    // Get historical data for chart based on days parameter
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const history = await prisma.indexSnapshot.findMany({
      where: {
        indexName: indexSymbol,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'asc' }
    })

    // Calculate sector breakdown
    const sectorBreakdown = calculateSectorBreakdown(constituents)

    return NextResponse.json({
      index: {
        symbol: config.symbol,
        name: config.name,
        methodology: config.methodology,
        tokenCount: config.tokenCount,
        color: config.color,
        currentValue: latest?.value || 0,
        change24h,
        lastUpdated: latest?.timestamp || new Date()
      },
      constituents,
      sectorBreakdown,
      history: history.map(h => ({
        timestamp: h.timestamp,
        value: h.value
      }))
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Calculate sector breakdown from constituents
function calculateSectorBreakdown(constituents: ConstituentWithWeight[]): { sector: string; weight: number; count: number }[] {
  const sectorMap = new Map<string, { weight: number; count: number }>()

  for (const constituent of constituents) {
    const existing = sectorMap.get(constituent.sector) || { weight: 0, count: 0 }
    sectorMap.set(constituent.sector, {
      weight: existing.weight + constituent.weight,
      count: existing.count + 1
    })
  }

  return Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      weight: data.weight,
      count: data.count
    }))
    .sort((a, b) => b.weight - a.weight)
}
