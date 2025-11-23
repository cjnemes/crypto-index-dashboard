import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  calculateAllPeriodAnalytics,
  calculateAnalytics,
  PERIODS,
  type PeriodKey,
  type IndexAnalytics,
} from '@/lib/analytics'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Formatted analytics data for API response
 */
interface FormattedPeriodAnalytics {
  volatility: {
    daily: number
    annualized: number
  }
  sharpeRatio: {
    value: number
    annualizedReturn: number
    annualizedVolatility: number
    riskFreeRate: number
  }
  maxDrawdown: {
    percentage: number
    peakDate: string | null
    troughDate: string | null
    peakValue: number | null
    troughValue: number | null
    durationDays: number | null
  }
  betaVsBTC: {
    beta: number
    correlation: number
    rSquared: number
  } | null
  betaVsETH: {
    beta: number
    correlation: number
    rSquared: number
  } | null
  sortinoRatio: {
    value: number
    annualizedReturn: number
    downsideDeviation: number
    riskFreeRate: number
  }
  totalReturn: number
  dataPoints: number
  startDate: string
  endDate: string
}

interface IndexAnalyticsResponse {
  indexName: string
  displayName: string
  periods: {
    '30d'?: FormattedPeriodAnalytics | null
    '90d'?: FormattedPeriodAnalytics | null
    '1y'?: FormattedPeriodAnalytics | null
  }
}

interface SuccessResponse {
  success: true
  period: '30d' | '90d' | '1y' | 'all'
  data: Record<string, IndexAnalyticsResponse>
  calculatedAt: string
}

interface ErrorResponse {
  success: false
  error: string
  details?: string
}

type AnalyticsResponse = SuccessResponse | ErrorResponse

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats raw IndexAnalytics data into API response format
 */
function formatAnalyticsData(analytics: IndexAnalytics): FormattedPeriodAnalytics {
  return {
    volatility: {
      daily: roundToDecimals(analytics.volatility.daily, 6),
      annualized: roundToDecimals(analytics.volatility.annualized, 4),
    },
    sharpeRatio: {
      value: roundToDecimals(analytics.sharpe.ratio, 2),
      annualizedReturn: roundToDecimals(analytics.sharpe.annualizedReturn, 4),
      annualizedVolatility: roundToDecimals(analytics.sharpe.annualizedVolatility, 4),
      riskFreeRate: analytics.sharpe.riskFreeRate,
    },
    maxDrawdown: {
      percentage: roundToDecimals(analytics.maxDrawdown.maxDrawdown * 100, 2),
      peakDate: analytics.maxDrawdown.peakDate?.toISOString() || null,
      troughDate: analytics.maxDrawdown.troughDate?.toISOString() || null,
      peakValue: analytics.maxDrawdown.peakValue,
      troughValue: analytics.maxDrawdown.troughValue,
      durationDays: analytics.maxDrawdown.drawdownDuration,
    },
    betaVsBTC: analytics.betaVsBTC
      ? {
          beta: roundToDecimals(analytics.betaVsBTC.beta, 3),
          correlation: roundToDecimals(analytics.betaVsBTC.correlation, 3),
          rSquared: roundToDecimals(analytics.betaVsBTC.rSquared, 3),
        }
      : null,
    betaVsETH: analytics.betaVsETH
      ? {
          beta: roundToDecimals(analytics.betaVsETH.beta, 3),
          correlation: roundToDecimals(analytics.betaVsETH.correlation, 3),
          rSquared: roundToDecimals(analytics.betaVsETH.rSquared, 3),
        }
      : null,
    sortinoRatio: {
      value: analytics.sortino.ratio === Infinity
        ? 999.99
        : roundToDecimals(analytics.sortino.ratio, 2),
      annualizedReturn: roundToDecimals(analytics.sortino.annualizedReturn, 4),
      downsideDeviation: roundToDecimals(analytics.sortino.downsideDeviation, 4),
      riskFreeRate: analytics.sortino.riskFreeRate,
    },
    totalReturn: roundToDecimals(analytics.totalReturn * 100, 2),
    dataPoints: analytics.volatility.dataPoints,
    startDate: analytics.startDate.toISOString(),
    endDate: analytics.endDate.toISOString(),
  }
}

/**
 * Rounds a number to specified decimal places
 */
function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Validates and normalizes the period parameter
 */
function validatePeriod(period: string | null): '30d' | '90d' | '1y' | 'all' {
  if (!period) return 'all'

  const normalizedPeriod = period.toLowerCase()

  // Handle '1Y' -> '1y' conversion
  if (normalizedPeriod === '1y') return '1y'
  if (normalizedPeriod === '30d') return '30d'
  if (normalizedPeriod === '90d') return '90d'
  if (normalizedPeriod === 'all') return 'all'

  // Default to 'all' for invalid periods
  return 'all'
}

/**
 * Maps API period key to analytics library period key
 */
function mapPeriodToAnalyticsKey(period: '30d' | '90d' | '1y'): PeriodKey {
  if (period === '1y') return '1Y'
  return period as PeriodKey
}

/**
 * Creates CORS headers for the response
 */
function getCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/**
 * Creates cache headers for the response
 * Analytics calculations are expensive, so cache for 5 minutes
 */
function getCacheHeaders(): HeadersInit {
  return {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  }
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/analytics
 *
 * Calculates and returns risk analytics for crypto indexes.
 *
 * Query Parameters:
 * - index (optional): Specific index name (e.g., "DEFI-MCW").
 *                     If omitted, returns analytics for all active indexes.
 * - period (optional): "30d", "90d", "1y", or "all" (default: "all")
 *
 * Response Format:
 * {
 *   "success": true,
 *   "period": "30d" | "90d" | "1y" | "all",
 *   "data": {
 *     "DEFI-MCW": {
 *       "indexName": "DEFI-MCW",
 *       "displayName": "DeFi 25",
 *       "periods": {
 *         "30d": { volatility, sharpeRatio, maxDrawdown, ... },
 *         "90d": { ... },
 *         "1y": { ... }
 *       }
 *     }
 *   },
 *   "calculatedAt": "2024-01-15T12:00:00.000Z"
 * }
 */
export async function GET(request: Request): Promise<NextResponse<AnalyticsResponse>> {
  const { searchParams } = new URL(request.url)
  const indexParam = searchParams.get('index')
  const periodParam = searchParams.get('period')

  const period = validatePeriod(periodParam)

  try {
    // Get active index configurations
    const configs = await prisma.indexConfig.findMany({
      where: { isActive: true },
      orderBy: { symbol: 'asc' },
    })

    if (configs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active indexes found',
          details: 'Please ensure index configurations are set up in the database.',
        },
        {
          status: 404,
          headers: { ...getCorsHeaders() },
        }
      )
    }

    // Filter configs if specific index requested
    const targetConfigs = indexParam
      ? configs.filter((c) => c.symbol === indexParam)
      : configs

    if (indexParam && targetConfigs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Index "${indexParam}" not found`,
          details: `Available indexes: ${configs.map((c) => c.symbol).join(', ')}`,
        },
        {
          status: 404,
          headers: { ...getCorsHeaders() },
        }
      )
    }

    // Calculate analytics for each index
    const data: Record<string, IndexAnalyticsResponse> = {}

    for (const config of targetConfigs) {
      const indexResponse: IndexAnalyticsResponse = {
        indexName: config.symbol,
        displayName: config.name,
        periods: {},
      }

      if (period === 'all') {
        // Calculate all periods
        const multiPeriod = await calculateAllPeriodAnalytics(config.symbol)

        if (multiPeriod.periods['30d']) {
          indexResponse.periods['30d'] = formatAnalyticsData(multiPeriod.periods['30d'])
        }
        if (multiPeriod.periods['90d']) {
          indexResponse.periods['90d'] = formatAnalyticsData(multiPeriod.periods['90d'])
        }
        if (multiPeriod.periods['1Y']) {
          indexResponse.periods['1y'] = formatAnalyticsData(multiPeriod.periods['1Y'])
        }
      } else {
        // Calculate specific period
        const analyticsKey = mapPeriodToAnalyticsKey(period)
        const periodDays = PERIODS[analyticsKey]
        const result = await calculateAnalytics(config.symbol, periodDays)

        if (result.success) {
          indexResponse.periods[period] = formatAnalyticsData(result.data)
        } else {
          // Include null with error info when calculation fails
          indexResponse.periods[period] = null
        }
      }

      data[config.symbol] = indexResponse
    }

    // Check if we have any data
    const hasData = Object.values(data).some(
      (index) => Object.values(index.periods).some((p) => p !== null)
    )

    if (!hasData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient data for analytics calculation',
          details: 'Not enough historical data points available. Analytics require at least 2 data points per index.',
        },
        {
          status: 400,
          headers: { ...getCorsHeaders() },
        }
      )
    }

    const response: SuccessResponse = {
      success: true,
      period,
      data,
      calculatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        ...getCorsHeaders(),
        ...getCacheHeaders(),
      },
    })

  } catch (error) {
    console.error('Analytics API error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    const isDbError = message.includes('prisma') || message.includes('database')

    return NextResponse.json(
      {
        success: false,
        error: isDbError ? 'Database connection error' : 'Failed to calculate analytics',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      {
        status: 500,
        headers: { ...getCorsHeaders() },
      }
    )
  }
}

/**
 * OPTIONS /api/analytics
 *
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(),
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}
