'use client'

import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatPrice, formatWeight, formatLargeNumber, formatChange } from '@/lib/weights'

interface Constituent {
  symbol: string
  name: string
  sector: string
  price: number
  marketCap: number
  volume24h: number
  change24h: number
  weight: number
  rank: number
}

interface ConstituentTableProps {
  constituents: Constituent[]
  methodology: string
}

type SortKey = 'rank' | 'symbol' | 'price' | 'change24h' | 'weight' | 'marketCap'
type SortOrder = 'asc' | 'desc'

export default function ConstituentTable({ constituents, methodology }: ConstituentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  // Handle sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder(key === 'rank' ? 'asc' : 'desc')
    }
  }

  // Filter and sort constituents
  const filteredConstituents = constituents
    .filter(c =>
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal as string).toLowerCase()
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />
    return sortOrder === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />
  }

  const showWeightColumn = methodology === 'MCW'

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Constituents ({filteredConstituents.length})
          </h3>
          <input
            type="text"
            placeholder="Search tokens..."
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center">
                  #<SortIcon column="rank" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center">
                  Token<SortIcon column="symbol" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end">
                  Price<SortIcon column="price" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('change24h')}
              >
                <div className="flex items-center justify-end">
                  24h %<SortIcon column="change24h" />
                </div>
              </th>
              {showWeightColumn && (
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('weight')}
                >
                  <div className="flex items-center justify-end">
                    Weight<SortIcon column="weight" />
                  </div>
                </th>
              )}
              <th
                className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('marketCap')}
              >
                <div className="flex items-center justify-end">
                  Market Cap<SortIcon column="marketCap" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Sector
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredConstituents.map((constituent) => (
              <tr
                key={constituent.symbol}
                className="hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-slate-400">
                  {constituent.rank}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {constituent.symbol}
                      </div>
                      <div className="text-xs text-slate-400">
                        {constituent.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right text-white">
                  {formatPrice(constituent.price)}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  constituent.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatChange(constituent.change24h)}
                </td>
                {showWeightColumn && (
                  <td className="px-4 py-3 text-sm text-right text-white">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(constituent.weight * 100 * 5, 100)}%` }}
                        />
                      </div>
                      <span className="w-14 text-right">{formatWeight(constituent.weight)}</span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-right text-slate-300">
                  {formatLargeNumber(constituent.marketCap)}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
                    {constituent.sector}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredConstituents.length === 0 && (
        <div className="p-8 text-center text-slate-400">
          No tokens found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  )
}
