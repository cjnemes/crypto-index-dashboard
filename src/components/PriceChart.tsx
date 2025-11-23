'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

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

interface PriceChartProps {
  data: IndexData[]
  period: '1M' | '3M' | '6M' | '1Y'
}

export function PriceChart({ data, period }: PriceChartProps) {
  const chartData = data
    .map(item => ({
      name: item.symbol,
      value: item.returns[period],
      color: item.color,
      fullName: item.name
    }))
    .sort((a, b) => b.value - a.value)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-white">{data.fullName}</p>
          <p className={`text-lg font-bold ${data.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.value >= 0 ? '+' : ''}{data.value.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(55, 65, 81, 0.5)' }} />
          <ReferenceLine x={0} stroke="#6B7280" strokeWidth={2} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value >= 0 ? '#10B981' : '#EF4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
