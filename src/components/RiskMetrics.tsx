'use client'

/**
 * RiskMetrics Component
 *
 * Displays comprehensive risk analytics for crypto indexes including:
 * - Volatility (annualized)
 * - Sharpe Ratio
 * - Sortino Ratio
 * - Max Drawdown with date range
 * - Beta vs BTC and ETH
 *
 * Features collapsible sections, tooltips, period selection, and responsive design.
 */

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Info, AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Risk metrics data structure for a single index
 */
interface IndexRiskMetrics {
  /** Index symbol (e.g., 'N100-MCW', 'DEFI-MCW') */
  indexName: string
  /** Display name of the index */
  displayName: string
  /** Color used for visual identification */
  color: string
  /** Annualized volatility as a percentage */
  volatility: number
  /** Sharpe ratio (risk-adjusted return vs risk-free rate) */
  sharpeRatio: number
  /** Sortino ratio (downside risk-adjusted return) */
  sortinoRatio: number
  /** Maximum drawdown details */
  maxDrawdown: {
    /** Drawdown percentage (negative value) */
    value: number
    /** Start date of drawdown period */
    startDate: string
    /** End date (trough) of drawdown period */
    endDate: string
  }
  /** Beta coefficient vs Bitcoin */
  betaVsBTC: number
  /** Beta coefficient vs Ethereum */
  betaVsETH: number
}

/**
 * API response structure for analytics endpoint
 */
interface AnalyticsResponse {
  success: boolean
  period: string
  metrics: IndexRiskMetrics[]
  error?: string
}

/**
 * Component props interface
 */
interface RiskMetricsProps {
  /** Optional CSS class name for additional styling */
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

/** Available time periods for analysis */
const PERIODS = [
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
] as const

/** Index categories for filtering */
const BENCHMARKS = ['BTC', 'ETH']
const CORE_INDEXES = ['N100-MCW', 'DEFI-MCW', 'INFRA-MCW']
const SECTOR_INDEXES = ['L1-MCW', 'SCALE-MCW', 'AI-MCW', 'GAMING-MCW', 'DEX-MCW', 'YIELD-MCW', 'DATA-MCW']

/** Tooltip explanations for each metric */
const METRIC_TOOLTIPS: Record<string, string> = {
  volatility: 'Annualized standard deviation of returns. Higher values indicate more price fluctuation and risk.',
  sharpeRatio: 'Risk-adjusted return measure. Values >1 are good, >2 are very good, <0 means returns below risk-free rate.',
  sortinoRatio: 'Like Sharpe, but only penalizes downside volatility. Higher is better as it ignores upside volatility.',
  maxDrawdown: 'Largest peak-to-trough decline during the period. Shows worst-case scenario for investors.',
  betaVsBTC: 'Measures correlation with Bitcoin. >1 means more volatile than BTC, <1 means less volatile.',
  betaVsETH: 'Measures correlation with Ethereum. >1 means more volatile than ETH, <1 means less volatile.',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determines the volatility level classification
 */
function getVolatilityLevel(volatility: number): { level: 'low' | 'medium' | 'high', color: string } {
  if (volatility < 30) return { level: 'low', color: 'text-green-400' }
  if (volatility < 60) return { level: 'medium', color: 'text-yellow-400' }
  return { level: 'high', color: 'text-red-400' }
}

/**
 * Gets color class for Sharpe/Sortino ratio values
 */
function getRatioColor(ratio: number): string {
  if (ratio > 1) return 'text-green-400'
  if (ratio >= 0) return 'text-yellow-400'
  return 'text-red-400'
}

/**
 * Gets color and interpretation for Beta values
 */
function getBetaInfo(beta: number): { color: string, interpretation: string } {
  if (beta > 1.2) return { color: 'text-red-400', interpretation: 'More volatile' }
  if (beta > 0.8) return { color: 'text-yellow-400', interpretation: 'Similar' }
  return { color: 'text-green-400', interpretation: 'Less volatile' }
}

/**
 * Formats a date string for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Tooltip component that displays metric explanations on hover
 */
function MetricTooltip({ content }: { content: string }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="ml-1 theme-text-muted hover:theme-text transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="More information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 theme-card border theme-border rounded-lg shadow-lg text-sm theme-text-secondary">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-700 dark:border-t-gray-600" />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual metric display row
 */
function MetricRow({
  label,
  value,
  tooltip,
  valueColor = 'theme-text',
  subValue
}: {
  label: string
  value: string | number
  tooltip: string
  valueColor?: string
  subValue?: string
}) {
  return (
    <div className="flex justify-between items-start py-2 border-b theme-border last:border-b-0">
      <div className="flex items-center">
        <span className="theme-text-secondary text-sm">{label}</span>
        <MetricTooltip content={tooltip} />
      </div>
      <div className="text-right">
        <span className={`font-semibold ${valueColor}`}>{value}</span>
        {subValue && (
          <p className="text-xs theme-text-muted">{subValue}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Collapsible section for each index's metrics
 */
function IndexMetricsSection({
  metrics,
  isExpanded,
  onToggle
}: {
  metrics: IndexRiskMetrics
  isExpanded: boolean
  onToggle: () => void
}) {
  const volatilityInfo = getVolatilityLevel(metrics.volatility)
  const sharpeColor = getRatioColor(metrics.sharpeRatio)
  const sortinoColor = getRatioColor(metrics.sortinoRatio)
  const btcBetaInfo = getBetaInfo(metrics.betaVsBTC)
  const ethBetaInfo = getBetaInfo(metrics.betaVsETH)

  return (
    <div className="theme-card rounded-lg border theme-border">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: metrics.color }}
          />
          <span className="font-semibold theme-text">{metrics.displayName}</span>
          <span className="text-sm theme-text-muted">({metrics.indexName})</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Quick summary badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded ${volatilityInfo.color} bg-opacity-20 ${volatilityInfo.color.replace('text-', 'bg-')}/10`}>
              Vol: {metrics.volatility.toFixed(1)}%
            </span>
            <span className={`px-2 py-1 rounded ${sharpeColor} bg-opacity-20 ${sharpeColor.replace('text-', 'bg-')}/10`}>
              Sharpe: {metrics.sharpeRatio.toFixed(2)}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 theme-text-secondary" />
          ) : (
            <ChevronRight className="w-5 h-5 theme-text-secondary" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t theme-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Performance Metrics */}
            <div>
              <h4 className="text-sm font-medium theme-text-secondary mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Performance Metrics
              </h4>

              <MetricRow
                label="Volatility"
                value={`${metrics.volatility.toFixed(2)}%`}
                tooltip={METRIC_TOOLTIPS.volatility}
                valueColor={volatilityInfo.color}
                subValue={`${volatilityInfo.level.charAt(0).toUpperCase() + volatilityInfo.level.slice(1)} risk`}
              />

              <MetricRow
                label="Sharpe Ratio"
                value={metrics.sharpeRatio.toFixed(3)}
                tooltip={METRIC_TOOLTIPS.sharpeRatio}
                valueColor={sharpeColor}
                subValue={metrics.sharpeRatio > 1 ? 'Good risk-adjusted return' : metrics.sharpeRatio > 0 ? 'Moderate' : 'Below risk-free rate'}
              />

              <MetricRow
                label="Sortino Ratio"
                value={metrics.sortinoRatio.toFixed(3)}
                tooltip={METRIC_TOOLTIPS.sortinoRatio}
                valueColor={sortinoColor}
              />
            </div>

            {/* Right Column: Risk & Correlation Metrics */}
            <div>
              <h4 className="text-sm font-medium theme-text-secondary mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Risk & Correlation
              </h4>

              <MetricRow
                label="Max Drawdown"
                value={`${metrics.maxDrawdown.value.toFixed(2)}%`}
                tooltip={METRIC_TOOLTIPS.maxDrawdown}
                valueColor="text-red-400"
                subValue={`${formatDate(metrics.maxDrawdown.startDate)} - ${formatDate(metrics.maxDrawdown.endDate)}`}
              />

              <MetricRow
                label="Beta vs BTC"
                value={metrics.betaVsBTC.toFixed(3)}
                tooltip={METRIC_TOOLTIPS.betaVsBTC}
                valueColor={btcBetaInfo.color}
                subValue={btcBetaInfo.interpretation}
              />

              <MetricRow
                label="Beta vs ETH"
                value={metrics.betaVsETH.toFixed(3)}
                tooltip={METRIC_TOOLTIPS.betaVsETH}
                valueColor={ethBetaInfo.color}
                subValue={ethBetaInfo.interpretation}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RiskMetrics({ className = '' }: RiskMetricsProps) {
  // State management
  const [period, setPeriod] = useState<string>('30d')
  const [metrics, setMetrics] = useState<IndexRiskMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter toggles for index selection
  const [showBenchmarks, setShowBenchmarks] = useState(true)
  const [showCore, setShowCore] = useState(true)
  const [showSectors, setShowSectors] = useState(false)

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  /**
   * Fetch risk analytics data from API
   */
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/analytics?period=${period}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Unknown error fetching analytics')
        }

        // Transform API response format to component format
        // API returns: { data: { "INDEX-NAME": { indexName, displayName, periods: { "30d": {...} } } } }
        // Component expects: [{ indexName, displayName, volatility, sharpeRatio, ... }]
        const transformedMetrics: IndexRiskMetrics[] = Object.entries(data.data || {}).map(([key, value]: [string, any]) => {
          const periodData = value.periods?.[period] || {}

          // Default colors for indexes
          const colorMap: Record<string, string> = {
            'BTC': '#F7931A',
            'ETH': '#627EEA',
            'N100-MCW': '#10B981',
            'DEFI-MCW': '#9B59B6',
            'INFRA-MCW': '#3498DB',
            'L1-MCW': '#E74C3C',
            'SCALE-MCW': '#F39C12',
            'AI-MCW': '#1ABC9C',
            'GAMING-MCW': '#E91E63',
            'DEX-MCW': '#00BCD4',
            'YIELD-MCW': '#8BC34A',
            'DATA-MCW': '#FF5722',
          }

          return {
            indexName: value.indexName || key,
            displayName: value.displayName || key,
            color: colorMap[key] || '#8884d8',
            volatility: (periodData.volatility?.annualized || 0) * 100, // Convert to percentage
            sharpeRatio: periodData.sharpeRatio?.value || 0,
            sortinoRatio: periodData.sortinoRatio?.value || 0,
            maxDrawdown: {
              value: periodData.maxDrawdown?.percentage || 0,
              startDate: periodData.maxDrawdown?.peakDate || '',
              endDate: periodData.maxDrawdown?.troughDate || '',
            },
            betaVsBTC: periodData.betaVsBTC?.beta || 0,
            betaVsETH: periodData.betaVsETH?.beta || 0,
          }
        })

        setMetrics(transformedMetrics)

        // Auto-expand first metric if none are expanded
        if (transformedMetrics.length > 0 && expandedSections.size === 0) {
          setExpandedSections(new Set([transformedMetrics[0].indexName]))
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load risk metrics')

        // Set mock data for development/demo purposes when API is unavailable
        setMetrics(generateMockMetrics())
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [period])

  /**
   * Filter metrics based on selected categories
   */
  const filteredMetrics = metrics.filter(metric => {
    if (BENCHMARKS.includes(metric.indexName)) return showBenchmarks
    if (CORE_INDEXES.includes(metric.indexName)) return showCore
    if (SECTOR_INDEXES.includes(metric.indexName)) return showSectors
    return true
  })

  /**
   * Toggle section expansion state
   */
  const toggleSection = (indexName: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(indexName)) {
        next.delete(indexName)
      } else {
        next.add(indexName)
      }
      return next
    })
  }

  /**
   * Expand or collapse all sections
   */
  const toggleAllSections = (expand: boolean) => {
    if (expand) {
      setExpandedSections(new Set(filteredMetrics.map(m => m.indexName)))
    } else {
      setExpandedSections(new Set())
    }
  }

  return (
    <div className={`theme-card rounded-xl p-4 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Title and Period Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-lg font-semibold theme-text flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Risk Analytics
          </h3>

          {/* Period selector buttons */}
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'theme-btn'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t theme-border">
          {/* Index category checkboxes */}
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBenchmarks}
                onChange={(e) => setShowBenchmarks(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="theme-text-secondary">Benchmarks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCore}
                onChange={(e) => setShowCore(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="theme-text-secondary">Core Indexes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSectors}
                onChange={(e) => setShowSectors(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="theme-text-secondary">Sector Indexes</span>
            </label>
          </div>

          {/* Expand/Collapse All buttons */}
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => toggleAllSections(true)}
              className="theme-text-secondary hover:theme-text transition-colors"
            >
              Expand All
            </button>
            <span className="theme-text-muted">|</span>
            <button
              onClick={() => toggleAllSections(false)}
              className="theme-text-secondary hover:theme-text transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        // Loading State
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
          <span className="theme-text-secondary">Loading risk metrics...</span>
        </div>
      ) : error ? (
        // Error State
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
          <p className="theme-text mb-2">Unable to load live data</p>
          <p className="theme-text-secondary text-sm mb-4">{error}</p>
          <p className="theme-text-muted text-xs">Showing sample data below</p>
        </div>
      ) : filteredMetrics.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="w-12 h-12 theme-text-muted mb-3" />
          <p className="theme-text-secondary mb-2">No metrics available</p>
          <p className="theme-text-muted text-sm">
            Select at least one index category above to view risk metrics.
          </p>
        </div>
      ) : (
        // Metrics Display
        <div className="space-y-3">
          {filteredMetrics.map((metric) => (
            <IndexMetricsSection
              key={metric.indexName}
              metrics={metric}
              isExpanded={expandedSections.has(metric.indexName)}
              onToggle={() => toggleSection(metric.indexName)}
            />
          ))}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t theme-border">
        <p className="text-xs theme-text-muted text-center">
          Risk metrics calculated based on {period.toUpperCase()} historical data.
          Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// Mock Data Generator (for development/demo when API is unavailable)
// ============================================================================

/**
 * Generates mock risk metrics for demonstration purposes
 * Used when the analytics API is unavailable
 */
function generateMockMetrics(): IndexRiskMetrics[] {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  return [
    {
      indexName: 'BTC',
      displayName: 'Bitcoin',
      color: '#F7931A',
      volatility: 45.2,
      sharpeRatio: 0.85,
      sortinoRatio: 1.12,
      maxDrawdown: {
        value: -18.5,
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      betaVsBTC: 1.0,
      betaVsETH: 0.72,
    },
    {
      indexName: 'ETH',
      displayName: 'Ethereum',
      color: '#627EEA',
      volatility: 58.7,
      sharpeRatio: 0.62,
      sortinoRatio: 0.89,
      maxDrawdown: {
        value: -24.3,
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
      betaVsBTC: 1.35,
      betaVsETH: 1.0,
    },
    {
      indexName: 'N100-MCW',
      displayName: 'Nemes 100',
      color: '#00D395',
      volatility: 52.4,
      sharpeRatio: 1.15,
      sortinoRatio: 1.45,
      maxDrawdown: {
        value: -21.8,
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      betaVsBTC: 1.12,
      betaVsETH: 0.95,
    },
    {
      indexName: 'DEFI-MCW',
      displayName: 'DeFi 25',
      color: '#9B59B6',
      volatility: 72.3,
      sharpeRatio: 0.45,
      sortinoRatio: 0.68,
      maxDrawdown: {
        value: -35.2,
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      betaVsBTC: 1.48,
      betaVsETH: 1.25,
    },
    {
      indexName: 'INFRA-MCW',
      displayName: 'Infra 25',
      color: '#3498DB',
      volatility: 65.8,
      sharpeRatio: 0.38,
      sortinoRatio: 0.52,
      maxDrawdown: {
        value: -42.1,
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      betaVsBTC: 1.55,
      betaVsETH: 1.32,
    },
  ]
}

export default RiskMetrics
