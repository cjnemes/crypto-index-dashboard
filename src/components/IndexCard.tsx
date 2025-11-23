'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

interface IndexData {
  symbol: string
  name: string
  currentValue?: number
  returns: {
    '24H': number
    '1M': number
    '3M': number
    '6M': number
    '1Y': number
  }
  color: string
  components?: number
}

interface IndexCardProps {
  data: IndexData
  isBenchmark?: boolean
  compact?: boolean
}

export function IndexCard({ data, isBenchmark = false, compact = false }: IndexCardProps) {
  const change24h = data.returns['24H']
  const isPositive = change24h >= 0

  // Format value: benchmarks show as currency, indexes show as index value
  const formatValue = (value: number | undefined) => {
    if (value === undefined) return null
    if (isBenchmark) {
      return value >= 1000
        ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return value.toFixed(2)
  }

  // Compact mode for sector sub-indexes
  if (compact) {
    return (
      <Link href={`/index/${encodeURIComponent(data.symbol)}`}>
        <div
          className="theme-card theme-card-hover rounded-lg p-3 border-l-3 transition-colors cursor-pointer group"
          style={{ borderLeftColor: data.color }}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm font-semibold theme-text">{data.name}</h3>
            <span className="text-xs theme-text-muted">{data.components}</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{change24h.toFixed(1)}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="theme-item rounded px-1.5 py-0.5 text-center">
              <span className="theme-text-muted">1M </span>
              <span className={data.returns['1M'] >= 0 ? 'text-green-400' : 'text-red-400'}>
                {data.returns['1M'] >= 0 ? '+' : ''}{data.returns['1M'].toFixed(1)}%
              </span>
            </div>
            <div className="theme-item rounded px-1.5 py-0.5 text-center">
              <span className="theme-text-muted">1Y </span>
              <span className={data.returns['1Y'] >= 0 ? 'text-green-400' : 'text-red-400'}>
                {data.returns['1Y'] >= 0 ? '+' : ''}{data.returns['1Y'].toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/index/${encodeURIComponent(data.symbol)}`}>
      <div
        className={`theme-card theme-card-hover rounded-xl p-5 border-l-4 transition-colors cursor-pointer group`}
        style={{ borderLeftColor: data.color }}
      >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold theme-text">{data.name}</h3>
          <p className="text-sm theme-text-secondary">{data.symbol}</p>
        </div>
        {data.components && (
          <span className="text-xs theme-item theme-text-secondary px-2 py-1 rounded">
            {data.components} tokens
          </span>
        )}
        {isBenchmark && (
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
            Benchmark
          </span>
        )}
      </div>

      {/* Current Value */}
      {data.currentValue !== undefined && (
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold theme-text">
              {formatValue(data.currentValue)}
            </span>
            {!isBenchmark && (
              <span className="text-xs theme-text-muted">Index Value</span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        {isPositive ? (
          <TrendingUp className="w-6 h-6 text-green-400" />
        ) : (
          <TrendingDown className="w-6 h-6 text-red-400" />
        )}
        <span
          className={`text-3xl font-bold ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}{change24h.toFixed(1)}%
        </span>
        <span className="theme-text-muted text-sm">24h</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-sm">
        <div className="theme-item rounded p-2 text-center">
          <p className="theme-text-secondary text-xs">1M</p>
          <p className={data.returns['1M'] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.returns['1M'] >= 0 ? '+' : ''}{data.returns['1M'].toFixed(1)}%
          </p>
        </div>
        <div className="theme-item rounded p-2 text-center">
          <p className="theme-text-secondary text-xs">3M</p>
          <p className={data.returns['3M'] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.returns['3M'] >= 0 ? '+' : ''}{data.returns['3M'].toFixed(1)}%
          </p>
        </div>
        <div className="theme-item rounded p-2 text-center">
          <p className="theme-text-secondary text-xs">6M</p>
          <p className={data.returns['6M'] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.returns['6M'] >= 0 ? '+' : ''}{data.returns['6M'].toFixed(1)}%
          </p>
        </div>
        <div className="theme-item rounded p-2 text-center">
          <p className="theme-text-secondary text-xs">1Y</p>
          <p className={data.returns['1Y'] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.returns['1Y'] >= 0 ? '+' : ''}{data.returns['1Y'].toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Click indicator */}
      <div className="mt-3 pt-3 border-t theme-border flex items-center justify-between text-sm theme-text-secondary group-hover:theme-text">
        <span>View Details</span>
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
      </div>
    </Link>
  )
}
