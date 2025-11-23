'use client'

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
}

interface PerformanceTableProps {
  benchmarks: IndexData[]
  indexes: IndexData[]
}

export function PerformanceTable({ benchmarks, indexes }: PerformanceTableProps) {
  const allData = [...benchmarks, ...indexes]
  const periods = ['1M', '3M', '6M', '1Y'] as const

  const formatReturn = (value: number) => {
    const formatted = value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`
    return {
      text: formatted,
      className: value >= 0 ? 'text-green-400' : 'text-red-400'
    }
  }

  // Sort by 1Y return descending
  const sortedData = [...allData].sort((a, b) => b.returns['1Y'] - a.returns['1Y'])

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700">
              <th className="text-left p-4 text-gray-300 font-medium">Rank</th>
              <th className="text-left p-4 text-gray-300 font-medium">Index</th>
              {periods.map(period => (
                <th key={period} className="text-right p-4 text-gray-300 font-medium">
                  {period}
                </th>
              ))}
              <th className="text-right p-4 text-gray-300 font-medium">vs BTC (1Y)</th>
              <th className="text-right p-4 text-gray-300 font-medium">vs ETH (1Y)</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => {
              const btcReturn = benchmarks.find(b => b.symbol === 'BTC')?.returns['1Y'] || 0
              const ethReturn = benchmarks.find(b => b.symbol === 'ETH')?.returns['1Y'] || 0
              const vsBtc = item.returns['1Y'] - btcReturn
              const vsEth = item.returns['1Y'] - ethReturn

              return (
                <tr
                  key={item.symbol}
                  className={`border-t border-gray-700 hover:bg-gray-750 ${
                    benchmarks.includes(item) ? 'bg-gray-750' : ''
                  }`}
                >
                  <td className="p-4 text-gray-400">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.symbol}</p>
                      </div>
                    </div>
                  </td>
                  {periods.map(period => {
                    const ret = formatReturn(item.returns[period])
                    return (
                      <td key={period} className={`p-4 text-right font-mono ${ret.className}`}>
                        {ret.text}
                      </td>
                    )
                  })}
                  <td className={`p-4 text-right font-mono ${vsBtc >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.symbol === 'BTC' ? '-' : `${vsBtc >= 0 ? '+' : ''}${vsBtc.toFixed(1)}%`}
                  </td>
                  <td className={`p-4 text-right font-mono ${vsEth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.symbol === 'ETH' ? '-' : `${vsEth >= 0 ? '+' : ''}${vsEth.toFixed(1)}%`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
