'use client'

import Link from 'next/link'
import { formatWeight, formatPrice } from '@/lib/weights'

interface Holding {
  symbol: string
  name: string
  weight: number
  price: number
  change24h: number
}

interface TopHoldingsProps {
  indexSymbol: string
  indexName: string
  holdings: Holding[]
  color: string
}

export default function TopHoldings({ indexSymbol, indexName, holdings, color }: TopHoldingsProps) {
  const topFive = holdings.slice(0, 5)
  const maxWeight = Math.max(...topFive.map(h => h.weight))

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-white">{indexName}</h3>
        </div>
        <Link
          href={`/index/${encodeURIComponent(indexSymbol)}`}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          View All
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {topFive.map((holding, index) => (
          <div key={holding.symbol} className="flex items-center gap-3">
            {/* Rank */}
            <span className="w-5 text-sm text-slate-500 font-medium">
              {index + 1}
            </span>

            {/* Token info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{holding.symbol}</span>
                <span className="text-xs text-slate-400 truncate">{holding.name}</span>
              </div>
            </div>

            {/* Weight bar */}
            <div className="w-24 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(holding.weight / maxWeight) * 100}%`,
                    backgroundColor: color
                  }}
                />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">
                {formatWeight(holding.weight)}
              </span>
            </div>
          </div>
        ))}

        {holdings.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            No holdings data available
          </p>
        )}
      </div>
    </div>
  )
}
