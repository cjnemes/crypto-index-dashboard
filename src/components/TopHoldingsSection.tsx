'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatWeight } from '@/lib/weights'

interface Holding {
  symbol: string
  name: string
  weight: number
  price: number
  change24h: number
}

interface IndexHoldings {
  symbol: string
  name: string
  color: string
  holdings: Holding[]
}

const MCW_INDEXES = ['N100-MCW', 'DEFI-MCW', 'INFRA-MCW']

export default function TopHoldingsSection() {
  const [indexData, setIndexData] = useState<IndexHoldings[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTopHoldings() {
      try {
        const results = await Promise.all(
          MCW_INDEXES.map(async (symbol) => {
            const response = await fetch(`/api/index/${symbol}?days=1`)
            if (!response.ok) return null
            const data = await response.json()
            return {
              symbol: data.index.symbol,
              name: data.index.name,
              color: data.index.color,
              holdings: data.constituents.slice(0, 5).map((c: any) => ({
                symbol: c.symbol,
                name: c.name,
                weight: c.weight,
                price: c.price,
                change24h: c.change24h
              }))
            }
          })
        )
        setIndexData(results.filter(Boolean) as IndexHoldings[])
      } catch (error) {
        console.error('Failed to fetch top holdings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopHoldings()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-8 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (indexData.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {indexData.map((index) => (
        <div key={index.symbol} className="bg-gray-800 rounded-xl overflow-hidden">
          <div
            className="px-4 py-3 border-b border-gray-700 flex items-center justify-between"
            style={{ borderLeftWidth: '4px', borderLeftColor: index.color }}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{index.name}</span>
            </div>
            <Link
              href={`/index/${encodeURIComponent(index.symbol)}`}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All
            </Link>
          </div>

          <div className="p-4 space-y-2">
            {index.holdings.map((holding, idx) => {
              const maxWeight = index.holdings[0]?.weight || 1
              return (
                <div key={holding.symbol} className="flex items-center gap-3">
                  <span className="w-5 text-sm text-gray-500 font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-sm">{holding.symbol}</span>
                      <span className={`text-xs font-medium ${
                        holding.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(holding.weight / maxWeight) * 100}%`,
                            backgroundColor: index.color
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">
                        {formatWeight(holding.weight)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
