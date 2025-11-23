'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useChartColors } from '@/lib/useChartColors'

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
  const chartColors = useChartColors()

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

  // Transform data for recharts - show percentage change from period start
  // This allows comparing assets on different scales (BTC at 85k vs indexes at 700)
  const chartData = (() => {
    if (data.length === 0) return []

    // Get starting values for each index (first data point in period)
    const startingValues: Record<string, number> = {}
    data.forEach(index => {
      if (index.history.length > 0) {
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

    // Create data points with percentage change from period start
    return Array.from(timestamps).sort().map(ts => {
      const point: Record<string, any> = {
        timestamp: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
      data.forEach(index => {
        const historyPoint = index.history.find(h => h.timestamp === ts)
        if (historyPoint && startingValues[index.indexName]) {
          // Calculate percentage change from period start
          const percentChange = ((historyPoint.value - startingValues[index.indexName]) / startingValues[index.indexName]) * 100
          point[index.indexName] = percentChange
        }
      })
      return point
    })
  })()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="theme-card border theme-border rounded-lg p-3 shadow-lg">
          <p className="theme-text-secondary text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isPositive = entry.value >= 0
            return (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.name}: {isPositive ? '+' : ''}{entry.value.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  // Check if we have meaningful data (multiple unique timestamps)
  const uniqueTimestamps = new Set(chartData.map(d => d.timestamp)).size

  return (
    <div className={`theme-card rounded-xl p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold theme-text">Index Performance History</h3>
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
                  : 'theme-btn'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <span className="theme-text-secondary">Loading...</span>
        </div>
      ) : uniqueTimestamps <= 1 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center px-4">
          <span className="theme-text-secondary mb-2">
            {uniqueTimestamps === 0
              ? "No historical data available yet."
              : "Only 1 data point collected so far."}
          </span>
          <span className="theme-text-muted text-sm">
            Click "Collect" daily to build price history. After a few days, you'll see performance trends here.
          </span>
          <div className="mt-4 text-xs theme-text-muted">
            Collections: {uniqueTimestamps} | Need 2+ for chart
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="timestamp"
              tick={{ fill: chartColors.axis, fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: chartColors.axis, fontSize: 12 }}
              tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`}
              domain={['auto', 'auto']}
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
