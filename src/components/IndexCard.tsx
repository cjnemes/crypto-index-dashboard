'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface IndexData {
  symbol: string
  name: string
  returns: {
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
}

export function IndexCard({ data, isBenchmark = false }: IndexCardProps) {
  const yearReturn = data.returns['1Y']
  const isPositive = yearReturn >= 0

  return (
    <div
      className={`bg-gray-800 rounded-xl p-5 border-l-4 hover:bg-gray-750 transition-colors`}
      style={{ borderLeftColor: data.color }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{data.name}</h3>
          <p className="text-sm text-gray-400">{data.symbol}</p>
        </div>
        {data.components && (
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
            {data.components} tokens
          </span>
        )}
        {isBenchmark && (
          <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded">
            Benchmark
          </span>
        )}
      </div>

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
          {isPositive ? '+' : ''}{yearReturn.toFixed(1)}%
        </span>
        <span className="text-gray-500 text-sm">1Y</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-gray-700 rounded p-2 text-center">
          <p className="text-gray-400 text-xs">1M</p>
          <p className={data.returns['1M'] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.returns['1M'] >= 0 ? '+' : ''}{data.returns['1M'].toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-700 rounded p-2 text-center">
          <p className="text-gray-400 text-xs">3M</p>
          <p className={data.returns['3M'] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.returns['3M'] >= 0 ? '+' : ''}{data.returns['3M'].toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-700 rounded p-2 text-center">
          <p className="text-gray-400 text-xs">6M</p>
          <p className={data.returns['6M'] >= 0 ? 'text-green-400' : 'text-red-400'}>
            {data.returns['6M'] >= 0 ? '+' : ''}{data.returns['6M'].toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}
