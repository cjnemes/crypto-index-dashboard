'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface HistoryData {
  timestamp: string
  value: number
  returns30d: number | null
}

interface IndexHistory {
  indexName: string
  config: {
    name: string
    color: string
  } | null
  history: HistoryData[]
}

interface HistoryChartProps {
  className?: string
}

export function HistoryChart({ className = '' }: HistoryChartProps) {
  const [data, setData] = useState<IndexHistory[]>([])
  const [period, setPeriod] = useState<string>('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      try {
        const response = await fetch(`/api/history?period=${period}`)
        const result = await response.json()
        setData(result.indexes || [])
      } catch (error) {
        console.error('Failed to fetch history:', error)
      }
      setLoading(false)
    }
    fetchHistory()
  }, [period])

  // Transform data for recharts - normalize to percentage change (rebased to 100)
  const chartData = (() => {
    if (data.length === 0) return []

    // Get starting values for each index (first data point)
    const startingValues: Record<string, number> = {}
    data.forEach(index => {
      if (index.history.length > 0) {
        // Sort by timestamp and get first value
        const sorted = [...index.history].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        startingValues[index.indexName] = sorted[0].value
      }
    })

    // Get all timestamps
    const timestamps = new Set<string>()
    data.forEach(index => {
      index.history.forEach(h => timestamps.add(h.timestamp))
    })

    // Create normalized data points (rebased to 100)
    return Array.from(timestamps).sort().map(ts => {
      const point: Record<string, any> = {
        timestamp: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
      data.forEach(index => {
        const historyPoint = index.history.find(h => h.timestamp === ts)
        if (historyPoint && startingValues[index.indexName]) {
          // Normalize: (current / starting) * 100 = rebased value
          // So starting point = 100, and changes show relative performance
          const normalizedValue = (historyPoint.value / startingValues[index.indexName]) * 100
          point[index.indexName] = normalizedValue
        }
      })
      return point
    })
  })()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-white text-sm">
                {entry.name}: {typeof entry.value === 'number'
                  ? `${(entry.value - 100).toFixed(2)}%`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Check if we have meaningful data (multiple unique timestamps)
  const uniqueTimestamps = new Set(chartData.map(d => d.timestamp)).size

  return (
    <div className={`bg-gray-800 rounded-xl p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Index Performance History</h3>
        <div className="flex gap-1 flex-wrap">
          {[
            { value: '7d', label: '7D' },
            { value: '30d', label: '30D' },
            { value: '60d', label: '60D' },
            { value: '90d', label: '90D' },
            { value: '6m', label: '6M' },
            { value: '1y', label: '1Y' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                period === p.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <span className="text-gray-400">Loading...</span>
        </div>
      ) : uniqueTimestamps <= 1 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center px-4">
          <span className="text-gray-400 mb-2">
            {uniqueTimestamps === 0
              ? "No historical data available yet."
              : "Only 1 data point collected so far."}
          </span>
          <span className="text-gray-500 text-sm">
            Click "Collect" daily to build price history. After a few days, you'll see performance trends here.
          </span>
          <div className="mt-4 text-xs text-gray-600">
            Collections: {uniqueTimestamps} | Need 2+ for chart
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value) => `${(value - 100).toFixed(0)}%`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {data.map((index) => (
              <Line
                key={index.indexName}
                type="monotone"
                dataKey={index.indexName}
                name={index.config?.name || index.indexName}
                stroke={index.config?.color || '#8884d8'}
                strokeWidth={2}
                dot={chartData.length < 10}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
