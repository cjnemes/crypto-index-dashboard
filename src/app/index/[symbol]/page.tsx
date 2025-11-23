'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import IndexDetailHeader from '@/components/IndexDetailHeader'
import ConstituentTable from '@/components/ConstituentTable'

interface IndexData {
  index: {
    symbol: string
    name: string
    methodology: string
    tokenCount: number
    color: string
    currentValue: number
    change24h: number
    lastUpdated: string
  }
  constituents: {
    symbol: string
    name: string
    sector: string
    price: number
    marketCap: number
    volume24h: number
    change24h: number
    weight: number
    rank: number
  }[]
  sectorBreakdown: {
    sector: string
    weight: number
    count: number
  }[]
  history: {
    timestamp: string
    value: number
  }[]
}

interface PageProps {
  params: { symbol: string }
}

const TIME_PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '60D', days: 60 },
  { label: '90D', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
]

export default function IndexDetailPage({ params }: PageProps) {
  const { symbol } = params
  const [data, setData] = useState<IndexData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'constituents' | 'sectors'>('constituents')
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/index/${encodeURIComponent(symbol)}?days=${selectedPeriod}`)
        if (!response.ok) {
          throw new Error('Failed to fetch index data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
        setChartLoading(false)
      }
    }

    fetchData()
  }, [symbol, selectedPeriod])

  const handlePeriodChange = (days: number) => {
    if (days !== selectedPeriod) {
      setChartLoading(true)
      setSelectedPeriod(days)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading index data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error || 'No data available'}</p>
          <a href="/" className="text-blue-400 hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Format chart data
  const chartData = data.history.map(h => ({
    date: new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: h.value
  }))

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <IndexDetailHeader index={data.index} />

        {/* Chart Section */}
        <div className="mt-6 bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Performance</h2>
            <div className="flex gap-1">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period.days}
                  onClick={() => handlePeriodChange(period.days)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedPeriod === period.days
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 relative">
            {chartLoading && (
              <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => {
                    if (data.index.methodology === 'BENCHMARK') {
                      return `$${value.toLocaleString()}`
                    }
                    return value.toFixed(0)
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [
                    data.index.methodology === 'BENCHMARK'
                      ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : value.toFixed(2),
                    'Value'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={data.index.color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setActiveTab('constituents')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'constituents'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Constituents ({data.constituents.length})
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sectors'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Sector Breakdown
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'constituents' && (
            <ConstituentTable
              constituents={data.constituents}
              methodology={data.index.methodology}
            />
          )}

          {activeTab === 'sectors' && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Sector Allocation</h3>
              <div className="space-y-3">
                {data.sectorBreakdown.map((sector) => (
                  <div key={sector.sector} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-slate-300">{sector.sector}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(sector.weight * 100, 5)}%` }}
                        >
                          {sector.weight > 0.05 && (
                            <span className="text-xs font-medium text-white">
                              {(sector.weight * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-slate-400">
                      {sector.count} tokens
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
