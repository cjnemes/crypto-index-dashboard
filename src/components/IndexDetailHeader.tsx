'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { formatChange } from '@/lib/weights'

interface IndexInfo {
  symbol: string
  name: string
  methodology: string
  tokenCount: number
  color: string
  currentValue: number
  change24h: number
  lastUpdated: string
}

interface IndexDetailHeaderProps {
  index: IndexInfo
}

export default function IndexDetailHeader({ index }: IndexDetailHeaderProps) {
  const isPositive = index.change24h >= 0
  const lastUpdatedDate = new Date(index.lastUpdated)
  const timeAgo = getTimeAgo(lastUpdatedDate)

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Index name and value */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: index.color }}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {index.name}
            </h1>
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-700 text-slate-300">
              {index.methodology}
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl md:text-5xl font-bold text-white">
              {formatIndexValue(index.currentValue, index.methodology)}
            </span>
            <div className={`flex items-center gap-1 text-xl font-semibold ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {formatChange(index.change24h)}
              <span className="text-sm text-slate-400 ml-1">24h</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 md:gap-8">
          <div className="bg-slate-700/50 rounded-lg px-4 py-3">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Tokens
            </div>
            <div className="text-xl font-bold text-white">
              {index.tokenCount}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg px-4 py-3">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Methodology
            </div>
            <div className="text-xl font-bold text-white">
              {getMethodologyLabel(index.methodology)}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg px-4 py-3">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated
            </div>
            <div className="text-sm font-medium text-white">
              {timeAgo}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatIndexValue(value: number, methodology: string): string {
  if (methodology === 'BENCHMARK') {
    // Benchmarks show as currency
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  // Indexes show as points
  return value.toFixed(2)
}

function getMethodologyLabel(methodology: string): string {
  switch (methodology) {
    case 'MCW':
      return 'Market Cap Weighted'
    case 'EW':
      return 'Equal Weighted'
    case 'BENCHMARK':
      return 'Price Benchmark'
    default:
      return methodology
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
