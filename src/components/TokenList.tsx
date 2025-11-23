'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface Token {
  symbol: string
  name: string
  price: number
  change1Y: number
  sector: string
}

interface TokenListProps {
  tokens: Token[]
}

export function TokenList({ tokens }: TokenListProps) {
  const sortedTokens = [...tokens].sort((a, b) => b.change1Y - a.change1Y)
  const topPerformers = sortedTokens.slice(0, 5)
  const bottomPerformers = sortedTokens.slice(-5).reverse()

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(2)}`
    return `$${price.toPrecision(3)}`
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 h-80 overflow-hidden">
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Top Performers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Top 5</span>
          </div>
          <div className="space-y-2">
            {topPerformers.map((token, index) => (
              <div
                key={token.symbol}
                className="flex items-center justify-between bg-gray-700 rounded-lg p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{token.symbol}</p>
                    <p className="text-xs text-gray-500">{token.sector}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono ${token.change1Y >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change1Y >= 0 ? '+' : ''}{token.change1Y.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">{formatPrice(token.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Performers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Bottom 5</span>
          </div>
          <div className="space-y-2">
            {bottomPerformers.map((token, index) => (
              <div
                key={token.symbol}
                className="flex items-center justify-between bg-gray-700 rounded-lg p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4">{tokens.length - index}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{token.symbol}</p>
                    <p className="text-xs text-gray-500">{token.sector}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono ${token.change1Y >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change1Y >= 0 ? '+' : ''}{token.change1Y.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">{formatPrice(token.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
