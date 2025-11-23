/**
 * Crypto Index Analytics Library
 *
 * This module provides comprehensive risk metrics calculations for crypto indexes.
 * All metrics follow industry-standard financial formulas adapted for crypto markets.
 *
 * Trading Days: Uses 365 days for crypto (24/7 markets) vs 252 for traditional markets.
 * Data Source: IndexSnapshot table from Prisma database.
 *
 * @module analytics
 */

import { prisma } from './prisma'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Number of trading days per year for annualization.
 * Crypto markets trade 24/7, so we use 365 instead of traditional 252.
 */
const TRADING_DAYS_PER_YEAR = 365

/**
 * Default risk-free rate for Sharpe/Sortino calculations.
 * Based on US Treasury rates, adjustable via function parameters.
 */
const DEFAULT_RISK_FREE_RATE = 0.05 // 5% annual

/**
 * Standard period definitions in days
 */
export const PERIODS = {
  '30d': 30,
  '90d': 90,
  '1Y': 365,
} as const

export type PeriodKey = keyof typeof PERIODS

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a single data point from the IndexSnapshot table
 */
export interface SnapshotData {
  timestamp: Date
  value: number
}

/**
 * Volatility metrics for an index
 */
export interface VolatilityMetrics {
  /** Daily volatility (standard deviation of daily returns) */
  daily: number
  /** Annualized volatility (daily * sqrt(365)) */
  annualized: number
  /** Number of data points used in calculation */
  dataPoints: number
}

/**
 * Sharpe ratio metrics (risk-adjusted returns)
 */
export interface SharpeMetrics {
  /** The Sharpe ratio value */
  ratio: number
  /** Annualized return used in calculation */
  annualizedReturn: number
  /** Annualized volatility used in calculation */
  annualizedVolatility: number
  /** Risk-free rate used in calculation */
  riskFreeRate: number
}

/**
 * Maximum drawdown metrics
 */
export interface DrawdownMetrics {
  /** Maximum drawdown as a decimal (e.g., -0.25 = -25%) */
  maxDrawdown: number
  /** Maximum drawdown as a percentage string (e.g., "-25.00%") */
  maxDrawdownPercent: string
  /** Date when the peak occurred */
  peakDate: Date | null
  /** Date when the trough occurred */
  troughDate: Date | null
  /** Value at peak */
  peakValue: number | null
  /** Value at trough */
  troughValue: number | null
  /** Number of days from peak to trough */
  drawdownDuration: number | null
}

/**
 * Beta metrics vs a benchmark
 */
export interface BetaMetrics {
  /** Beta coefficient */
  beta: number
  /** Correlation coefficient */
  correlation: number
  /** Covariance between index and benchmark */
  covariance: number
  /** Variance of the benchmark */
  benchmarkVariance: number
  /** R-squared (coefficient of determination) */
  rSquared: number
}

/**
 * Sortino ratio metrics (downside risk-adjusted returns)
 */
export interface SortinoMetrics {
  /** The Sortino ratio value */
  ratio: number
  /** Annualized return used in calculation */
  annualizedReturn: number
  /** Downside deviation (annualized) */
  downsideDeviation: number
  /** Risk-free rate used in calculation */
  riskFreeRate: number
}

/**
 * Complete analytics result for an index
 */
export interface IndexAnalytics {
  /** Index name (e.g., "N100-MCW") */
  indexName: string
  /** Period in days */
  periodDays: number
  /** Period label (e.g., "30d", "90d", "1Y") */
  periodLabel: string
  /** Start date of the analysis period */
  startDate: Date
  /** End date of the analysis period */
  endDate: Date
  /** Total return over the period */
  totalReturn: number
  /** Volatility metrics */
  volatility: VolatilityMetrics
  /** Sharpe ratio metrics */
  sharpe: SharpeMetrics
  /** Maximum drawdown metrics */
  maxDrawdown: DrawdownMetrics
  /** Beta vs BTC */
  betaVsBTC: BetaMetrics | null
  /** Beta vs ETH */
  betaVsETH: BetaMetrics | null
  /** Sortino ratio metrics */
  sortino: SortinoMetrics
  /** Timestamp when analytics were calculated */
  calculatedAt: Date
}

/**
 * Multi-period analytics result
 */
export interface MultiPeriodAnalytics {
  indexName: string
  periods: {
    '30d': IndexAnalytics | null
    '90d': IndexAnalytics | null
    '1Y': IndexAnalytics | null
  }
  calculatedAt: Date
}

/**
 * Error result when analytics cannot be calculated
 */
export interface AnalyticsError {
  success: false
  error: string
  indexName: string
  periodDays: number
}

/**
 * Success result with analytics data
 */
export interface AnalyticsSuccess {
  success: true
  data: IndexAnalytics
}

export type AnalyticsResult = AnalyticsSuccess | AnalyticsError

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetches index snapshot data for a given index and period
 *
 * @param indexName - The index identifier (e.g., "N100-MCW")
 * @param periodDays - Number of days to look back
 * @returns Array of snapshot data sorted by timestamp ascending
 */
async function fetchSnapshotData(
  indexName: string,
  periodDays: number
): Promise<SnapshotData[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  const snapshots = await prisma.indexSnapshot.findMany({
    where: {
      indexName,
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
    select: {
      timestamp: true,
      value: true,
    },
  })

  return snapshots
}

/**
 * Calculates daily returns from price/value data
 *
 * @param data - Array of snapshot data with values
 * @returns Array of daily returns as decimals (e.g., 0.05 = 5%)
 */
function calculateDailyReturns(data: SnapshotData[]): number[] {
  if (data.length < 2) return []

  const returns: number[] = []
  for (let i = 1; i < data.length; i++) {
    const prevValue = data[i - 1].value
    const currValue = data[i].value

    // Avoid division by zero
    if (prevValue === 0) {
      returns.push(0)
    } else {
      returns.push((currValue - prevValue) / prevValue)
    }
  }

  return returns
}

/**
 * Calculates the mean (average) of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Mean value, or 0 if array is empty
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

/**
 * Calculates standard deviation of an array of numbers
 *
 * @param values - Array of numbers
 * @param isSample - If true, uses n-1 for sample std dev (default: true)
 * @returns Standard deviation
 */
function standardDeviation(values: number[], isSample = true): number {
  if (values.length < 2) return 0

  const avg = mean(values)
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2))
  const divisor = isSample ? values.length - 1 : values.length
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / divisor

  return Math.sqrt(variance)
}

/**
 * Calculates downside deviation (standard deviation of negative returns only)
 *
 * @param returns - Array of returns
 * @param threshold - Minimum acceptable return (default: 0)
 * @returns Downside deviation
 */
function downsideDeviation(returns: number[], threshold = 0): number {
  const negativeReturns = returns.filter((r) => r < threshold)

  if (negativeReturns.length < 2) return 0

  // Calculate squared deviations from threshold for negative returns
  const squaredDeviations = negativeReturns.map((r) =>
    Math.pow(Math.min(r - threshold, 0), 2)
  )

  const meanSquaredDeviation =
    squaredDeviations.reduce((sum, val) => sum + val, 0) / returns.length

  return Math.sqrt(meanSquaredDeviation)
}

/**
 * Calculates covariance between two arrays of returns
 *
 * @param x - First array of returns
 * @param y - Second array of returns
 * @returns Covariance value
 */
function covariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0

  const meanX = mean(x)
  const meanY = mean(y)

  let sum = 0
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY)
  }

  return sum / (x.length - 1)
}

/**
 * Calculates variance of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Variance value
 */
function variance(values: number[]): number {
  if (values.length < 2) return 0
  return Math.pow(standardDeviation(values), 2)
}

/**
 * Gets the period label for a given number of days
 *
 * @param days - Number of days
 * @returns Period label (e.g., "30d", "90d", "1Y")
 */
function getPeriodLabel(days: number): string {
  if (days <= 30) return '30d'
  if (days <= 90) return '90d'
  if (days <= 365) return '1Y'
  return `${days}d`
}

// ============================================================================
// METRIC CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculates annualized volatility (standard deviation of returns)
 *
 * Volatility measures the dispersion of returns around the mean.
 * Higher volatility indicates higher risk/uncertainty.
 *
 * Formula: Annualized Volatility = Daily Std Dev * sqrt(365)
 *
 * @param returns - Array of daily returns
 * @returns Volatility metrics object
 *
 * @example
 * const returns = [0.02, -0.01, 0.03, -0.02, 0.01]
 * const vol = calculateVolatility(returns)
 * console.log(vol.annualized) // e.g., 0.35 (35% annualized volatility)
 */
export function calculateVolatility(returns: number[]): VolatilityMetrics {
  const dailyVol = standardDeviation(returns)
  const annualizedVol = dailyVol * Math.sqrt(TRADING_DAYS_PER_YEAR)

  return {
    daily: dailyVol,
    annualized: annualizedVol,
    dataPoints: returns.length,
  }
}

/**
 * Calculates the Sharpe Ratio (risk-adjusted returns)
 *
 * The Sharpe ratio measures excess return per unit of risk.
 * Higher values indicate better risk-adjusted performance.
 *
 * Formula: Sharpe = (Annualized Return - Risk-Free Rate) / Annualized Volatility
 *
 * Interpretation:
 * - < 0: Underperforming risk-free rate
 * - 0-1: Acceptable but not great
 * - 1-2: Good
 * - 2-3: Very good
 * - > 3: Excellent (rare)
 *
 * @param returns - Array of daily returns
 * @param riskFreeRate - Annual risk-free rate (default: 5%)
 * @returns Sharpe ratio metrics object
 *
 * @example
 * const returns = [0.02, -0.01, 0.03, -0.02, 0.01]
 * const sharpe = calculateSharpeRatio(returns, 0.05)
 * console.log(sharpe.ratio) // e.g., 1.5
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = DEFAULT_RISK_FREE_RATE
): SharpeMetrics {
  if (returns.length === 0) {
    return {
      ratio: 0,
      annualizedReturn: 0,
      annualizedVolatility: 0,
      riskFreeRate,
    }
  }

  // Calculate annualized return from daily returns
  const meanDailyReturn = mean(returns)
  const annualizedReturn = meanDailyReturn * TRADING_DAYS_PER_YEAR

  // Calculate annualized volatility
  const volatility = calculateVolatility(returns)

  // Avoid division by zero
  if (volatility.annualized === 0) {
    return {
      ratio: 0,
      annualizedReturn,
      annualizedVolatility: 0,
      riskFreeRate,
    }
  }

  const sharpeRatio =
    (annualizedReturn - riskFreeRate) / volatility.annualized

  return {
    ratio: sharpeRatio,
    annualizedReturn,
    annualizedVolatility: volatility.annualized,
    riskFreeRate,
  }
}

/**
 * Calculates Maximum Drawdown (largest peak-to-trough decline)
 *
 * Maximum drawdown measures the largest percentage drop from a peak
 * to a subsequent trough. It represents the worst-case loss scenario
 * for an investor who bought at the peak.
 *
 * Formula: Max Drawdown = (Trough Value - Peak Value) / Peak Value
 *
 * @param data - Array of snapshot data with timestamps and values
 * @returns Drawdown metrics object with dates and values
 *
 * @example
 * const data = [
 *   { timestamp: new Date('2024-01-01'), value: 100 },
 *   { timestamp: new Date('2024-01-02'), value: 110 },
 *   { timestamp: new Date('2024-01-03'), value: 90 },
 * ]
 * const drawdown = calculateMaxDrawdown(data)
 * console.log(drawdown.maxDrawdown) // -0.1818 (-18.18%)
 */
export function calculateMaxDrawdown(data: SnapshotData[]): DrawdownMetrics {
  if (data.length < 2) {
    return {
      maxDrawdown: 0,
      maxDrawdownPercent: '0.00%',
      peakDate: null,
      troughDate: null,
      peakValue: null,
      troughValue: null,
      drawdownDuration: null,
    }
  }

  let maxDrawdown = 0
  let peak = data[0].value
  let peakDate = data[0].timestamp
  let maxDrawdownPeakDate = data[0].timestamp
  let maxDrawdownTroughDate = data[0].timestamp
  let maxDrawdownPeakValue = data[0].value
  let maxDrawdownTroughValue = data[0].value

  for (const point of data) {
    // Update peak if we have a new high
    if (point.value > peak) {
      peak = point.value
      peakDate = point.timestamp
    }

    // Calculate current drawdown from peak
    const currentDrawdown = (point.value - peak) / peak

    // Update max drawdown if this is worse
    if (currentDrawdown < maxDrawdown) {
      maxDrawdown = currentDrawdown
      maxDrawdownPeakDate = peakDate
      maxDrawdownTroughDate = point.timestamp
      maxDrawdownPeakValue = peak
      maxDrawdownTroughValue = point.value
    }
  }

  // Calculate duration in days
  const duration =
    maxDrawdownPeakDate && maxDrawdownTroughDate
      ? Math.round(
          (maxDrawdownTroughDate.getTime() - maxDrawdownPeakDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

  return {
    maxDrawdown,
    maxDrawdownPercent: `${(maxDrawdown * 100).toFixed(2)}%`,
    peakDate: maxDrawdownPeakDate,
    troughDate: maxDrawdownTroughDate,
    peakValue: maxDrawdownPeakValue,
    troughValue: maxDrawdownTroughValue,
    drawdownDuration: duration,
  }
}

/**
 * Calculates Beta vs a benchmark (systematic risk)
 *
 * Beta measures how much an asset moves relative to a benchmark.
 * - Beta = 1: Moves with the market
 * - Beta > 1: More volatile than the market (amplifies movements)
 * - Beta < 1: Less volatile than the market (dampens movements)
 * - Beta < 0: Moves opposite to the market (rare)
 *
 * Formula: Beta = Covariance(Index, Benchmark) / Variance(Benchmark)
 *
 * @param indexReturns - Array of index daily returns
 * @param benchmarkReturns - Array of benchmark daily returns (same length)
 * @returns Beta metrics object
 *
 * @example
 * const indexReturns = [0.02, -0.01, 0.03]
 * const btcReturns = [0.03, -0.02, 0.04]
 * const beta = calculateBeta(indexReturns, btcReturns)
 * console.log(beta.beta) // e.g., 0.85
 */
export function calculateBeta(
  indexReturns: number[],
  benchmarkReturns: number[]
): BetaMetrics {
  // Ensure arrays are the same length
  const minLength = Math.min(indexReturns.length, benchmarkReturns.length)
  const indexSlice = indexReturns.slice(0, minLength)
  const benchmarkSlice = benchmarkReturns.slice(0, minLength)

  if (minLength < 2) {
    return {
      beta: 0,
      correlation: 0,
      covariance: 0,
      benchmarkVariance: 0,
      rSquared: 0,
    }
  }

  const cov = covariance(indexSlice, benchmarkSlice)
  const benchmarkVar = variance(benchmarkSlice)
  const indexVar = variance(indexSlice)

  // Avoid division by zero
  if (benchmarkVar === 0) {
    return {
      beta: 0,
      correlation: 0,
      covariance: cov,
      benchmarkVariance: 0,
      rSquared: 0,
    }
  }

  const beta = cov / benchmarkVar

  // Calculate correlation coefficient
  const correlation =
    indexVar > 0 && benchmarkVar > 0
      ? cov / (Math.sqrt(indexVar) * Math.sqrt(benchmarkVar))
      : 0

  // R-squared is correlation squared
  const rSquared = Math.pow(correlation, 2)

  return {
    beta,
    correlation,
    covariance: cov,
    benchmarkVariance: benchmarkVar,
    rSquared,
  }
}

/**
 * Calculates the Sortino Ratio (downside risk-adjusted returns)
 *
 * Similar to Sharpe ratio but only considers downside volatility.
 * This is more appropriate for asymmetric return distributions
 * common in crypto markets.
 *
 * Formula: Sortino = (Annualized Return - Risk-Free Rate) / Downside Deviation
 *
 * Interpretation:
 * - Higher is better (more return per unit of downside risk)
 * - Generally higher than Sharpe for assets with positive skew
 *
 * @param returns - Array of daily returns
 * @param riskFreeRate - Annual risk-free rate (default: 5%)
 * @returns Sortino ratio metrics object
 *
 * @example
 * const returns = [0.02, -0.01, 0.03, -0.02, 0.01]
 * const sortino = calculateSortinoRatio(returns, 0.05)
 * console.log(sortino.ratio) // e.g., 2.1
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = DEFAULT_RISK_FREE_RATE
): SortinoMetrics {
  if (returns.length === 0) {
    return {
      ratio: 0,
      annualizedReturn: 0,
      downsideDeviation: 0,
      riskFreeRate,
    }
  }

  // Calculate annualized return
  const meanDailyReturn = mean(returns)
  const annualizedReturn = meanDailyReturn * TRADING_DAYS_PER_YEAR

  // Calculate annualized downside deviation
  const dailyDownsideDev = downsideDeviation(returns, 0)
  const annualizedDownsideDev = dailyDownsideDev * Math.sqrt(TRADING_DAYS_PER_YEAR)

  // Avoid division by zero
  if (annualizedDownsideDev === 0) {
    // If no downside deviation, return infinity-like high value or 0
    return {
      ratio: annualizedReturn > riskFreeRate ? Infinity : 0,
      annualizedReturn,
      downsideDeviation: 0,
      riskFreeRate,
    }
  }

  const sortinoRatio = (annualizedReturn - riskFreeRate) / annualizedDownsideDev

  return {
    ratio: sortinoRatio,
    annualizedReturn,
    downsideDeviation: annualizedDownsideDev,
    riskFreeRate,
  }
}

/**
 * Calculates total return over a period
 *
 * @param data - Array of snapshot data
 * @returns Total return as a decimal (e.g., 0.25 = 25%)
 */
function calculateTotalReturn(data: SnapshotData[]): number {
  if (data.length < 2) return 0

  const startValue = data[0].value
  const endValue = data[data.length - 1].value

  if (startValue === 0) return 0

  return (endValue - startValue) / startValue
}

// ============================================================================
// MAIN ANALYTICS FUNCTION
// ============================================================================

/**
 * Calculates all analytics metrics for a given index and period
 *
 * This is the main entry point for the analytics library.
 * It fetches data from the database and calculates all risk metrics.
 *
 * @param indexName - The index identifier (e.g., "N100-MCW", "DEFI-MCW", "BTC", "ETH")
 * @param periodDays - Number of days to analyze (e.g., 30, 90, 365)
 * @param options - Optional configuration
 * @param options.riskFreeRate - Annual risk-free rate (default: 5%)
 * @returns Promise resolving to analytics result (success or error)
 *
 * @example
 * // Calculate 30-day analytics for N100 index
 * const result = await calculateAnalytics('N100-MCW', 30)
 * if (result.success) {
 *   console.log(`Volatility: ${result.data.volatility.annualized}`)
 *   console.log(`Sharpe Ratio: ${result.data.sharpe.ratio}`)
 *   console.log(`Max Drawdown: ${result.data.maxDrawdown.maxDrawdownPercent}`)
 * }
 *
 * @example
 * // Calculate 1-year analytics with custom risk-free rate
 * const result = await calculateAnalytics('DEFI-MCW', 365, { riskFreeRate: 0.04 })
 */
export async function calculateAnalytics(
  indexName: string,
  periodDays: number,
  options: { riskFreeRate?: number } = {}
): Promise<AnalyticsResult> {
  const { riskFreeRate = DEFAULT_RISK_FREE_RATE } = options

  try {
    // Fetch index data
    const indexData = await fetchSnapshotData(indexName, periodDays)

    // Validate we have enough data
    if (indexData.length < 2) {
      return {
        success: false,
        error: `Insufficient data for ${indexName}. Found ${indexData.length} data points, need at least 2.`,
        indexName,
        periodDays,
      }
    }

    // Calculate daily returns
    const returns = calculateDailyReturns(indexData)

    // Fetch benchmark data (BTC and ETH) for beta calculations
    let btcReturns: number[] | null = null
    let ethReturns: number[] | null = null

    // Only fetch benchmark data if we're not calculating for benchmarks themselves
    if (indexName !== 'BTC') {
      const btcData = await fetchSnapshotData('BTC', periodDays)
      if (btcData.length >= 2) {
        btcReturns = calculateDailyReturns(btcData)
      }
    }

    if (indexName !== 'ETH') {
      const ethData = await fetchSnapshotData('ETH', periodDays)
      if (ethData.length >= 2) {
        ethReturns = calculateDailyReturns(ethData)
      }
    }

    // Calculate all metrics
    const volatility = calculateVolatility(returns)
    const sharpe = calculateSharpeRatio(returns, riskFreeRate)
    const maxDrawdown = calculateMaxDrawdown(indexData)
    const sortino = calculateSortinoRatio(returns, riskFreeRate)
    const totalReturn = calculateTotalReturn(indexData)

    // Calculate beta vs benchmarks
    const betaVsBTC = btcReturns ? calculateBeta(returns, btcReturns) : null
    const betaVsETH = ethReturns ? calculateBeta(returns, ethReturns) : null

    const analytics: IndexAnalytics = {
      indexName,
      periodDays,
      periodLabel: getPeriodLabel(periodDays),
      startDate: indexData[0].timestamp,
      endDate: indexData[indexData.length - 1].timestamp,
      totalReturn,
      volatility,
      sharpe,
      maxDrawdown,
      betaVsBTC,
      betaVsETH,
      sortino,
      calculatedAt: new Date(),
    }

    return {
      success: true,
      data: analytics,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage,
      indexName,
      periodDays,
    }
  }
}

/**
 * Calculates analytics for all standard periods (30d, 90d, 1Y)
 *
 * Convenience function to get a complete picture of index performance
 * across multiple time horizons.
 *
 * @param indexName - The index identifier
 * @param options - Optional configuration
 * @returns Promise resolving to multi-period analytics
 *
 * @example
 * const analytics = await calculateAllPeriodAnalytics('N100-MCW')
 * console.log(analytics.periods['30d']?.sharpe.ratio)
 * console.log(analytics.periods['90d']?.maxDrawdown.maxDrawdownPercent)
 * console.log(analytics.periods['1Y']?.volatility.annualized)
 */
export async function calculateAllPeriodAnalytics(
  indexName: string,
  options: { riskFreeRate?: number } = {}
): Promise<MultiPeriodAnalytics> {
  const [result30d, result90d, result1Y] = await Promise.all([
    calculateAnalytics(indexName, PERIODS['30d'], options),
    calculateAnalytics(indexName, PERIODS['90d'], options),
    calculateAnalytics(indexName, PERIODS['1Y'], options),
  ])

  return {
    indexName,
    periods: {
      '30d': result30d.success ? result30d.data : null,
      '90d': result90d.success ? result90d.data : null,
      '1Y': result1Y.success ? result1Y.data : null,
    },
    calculatedAt: new Date(),
  }
}

/**
 * Compares analytics between multiple indexes for a given period
 *
 * Useful for benchmarking index performance against each other
 * or against BTC/ETH.
 *
 * @param indexNames - Array of index names to compare
 * @param periodDays - Number of days to analyze
 * @param options - Optional configuration
 * @returns Promise resolving to map of index name to analytics
 *
 * @example
 * const comparison = await compareIndexAnalytics(
 *   ['N100-MCW', 'DEFI-MCW', 'BTC', 'ETH'],
 *   90
 * )
 * // Sort by Sharpe ratio
 * const ranked = Object.entries(comparison)
 *   .filter(([_, a]) => a !== null)
 *   .sort((a, b) => (b[1]?.sharpe.ratio || 0) - (a[1]?.sharpe.ratio || 0))
 */
export async function compareIndexAnalytics(
  indexNames: string[],
  periodDays: number,
  options: { riskFreeRate?: number } = {}
): Promise<Record<string, IndexAnalytics | null>> {
  const results = await Promise.all(
    indexNames.map((name) => calculateAnalytics(name, periodDays, options))
  )

  const comparison: Record<string, IndexAnalytics | null> = {}
  for (let i = 0; i < indexNames.length; i++) {
    const result = results[i]
    comparison[indexNames[i]] = result.success ? result.data : null
  }

  return comparison
}

/**
 * Formats analytics data for display
 *
 * @param analytics - Analytics data to format
 * @returns Formatted string representation
 */
export function formatAnalyticsSummary(analytics: IndexAnalytics): string {
  const lines = [
    `=== ${analytics.indexName} Analytics (${analytics.periodLabel}) ===`,
    `Period: ${analytics.startDate.toISOString().split('T')[0]} to ${analytics.endDate.toISOString().split('T')[0]}`,
    ``,
    `Performance:`,
    `  Total Return: ${(analytics.totalReturn * 100).toFixed(2)}%`,
    `  Annualized Return: ${(analytics.sharpe.annualizedReturn * 100).toFixed(2)}%`,
    ``,
    `Risk Metrics:`,
    `  Volatility (Annualized): ${(analytics.volatility.annualized * 100).toFixed(2)}%`,
    `  Max Drawdown: ${analytics.maxDrawdown.maxDrawdownPercent}`,
    ``,
    `Risk-Adjusted Returns:`,
    `  Sharpe Ratio: ${analytics.sharpe.ratio.toFixed(2)}`,
    `  Sortino Ratio: ${analytics.sortino.ratio === Infinity ? 'Inf' : analytics.sortino.ratio.toFixed(2)}`,
    ``,
  ]

  if (analytics.betaVsBTC) {
    lines.push(`Beta vs BTC: ${analytics.betaVsBTC.beta.toFixed(2)} (R-squared: ${(analytics.betaVsBTC.rSquared * 100).toFixed(1)}%)`)
  }

  if (analytics.betaVsETH) {
    lines.push(`Beta vs ETH: ${analytics.betaVsETH.beta.toFixed(2)} (R-squared: ${(analytics.betaVsETH.rSquared * 100).toFixed(1)}%)`)
  }

  return lines.join('\n')
}
