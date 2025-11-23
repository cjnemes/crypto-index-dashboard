'use client'

import { useState, useEffect, useCallback } from 'react'
import { IndexCard } from '@/components/IndexCard'
import { PerformanceTable } from '@/components/PerformanceTable'
import { PriceChart } from '@/components/PriceChart'
import { TokenList } from '@/components/TokenList'
import { HistoryChart } from '@/components/HistoryChart'
import TopHoldingsSection from '@/components/TopHoldingsSection'
import { RefreshCw, TrendingUp, TrendingDown, Database } from 'lucide-react'

// Fallback static data (used if database is empty)
const fallbackData = {
  benchmarks: [
    { symbol: 'BTC', name: 'Bitcoin', returns: { '24H': 0, '1M': -21.6, '3M': -27.8, '6M': -24.5, '1Y': -14.8 }, color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', returns: { '24H': 0, '1M': -27.9, '3M': -43.2, '6M': 3.0, '1Y': -17.6 }, color: '#627EEA' },
  ],
  indexes: [
    { symbol: 'N100-MCW', name: 'Nemes 100 MCW', returns: { '24H': 0, '1M': -18.4, '3M': -32.6, '6M': -12.8, '1Y': 8.6 }, color: '#00D395', components: 100 },
    { symbol: 'N100-EW', name: 'Nemes 100 EW', returns: { '24H': 0, '1M': -28.4, '3M': -48.2, '6M': -32.6, '1Y': -28.6 }, color: '#00A67E', components: 100 },
    { symbol: 'DEFI-MCW', name: 'DeFi 25 MCW', returns: { '24H': 0, '1M': -26.4, '3M': -48.2, '6M': -32.4, '1Y': -18.4 }, color: '#9B59B6', components: 25 },
    { symbol: 'DEFI-EW', name: 'DeFi 25 EW', returns: { '24H': 0, '1M': -32.4, '3M': -52.6, '6M': -38.4, '1Y': -24.6 }, color: '#8E44AD', components: 25 },
    { symbol: 'INFRA-MCW', name: 'Infra 25 MCW', returns: { '24H': 0, '1M': -30.0, '3M': -55.0, '6M': -28.1, '1Y': -38.4 }, color: '#3498DB', components: 25 },
    { symbol: 'INFRA-EW', name: 'Infra 25 EW', returns: { '24H': 0, '1M': -38.4, '3M': -62.4, '6M': -42.6, '1Y': -48.6 }, color: '#2980B9', components: 25 },
  ]
}

const fallbackTokens = [
  { symbol: 'XRP', name: 'XRP', price: 1.93, change1Y: 31.3, sector: 'Layer 1' },
  { symbol: 'BNB', name: 'BNB', price: 828.52, change1Y: 30.8, sector: 'Exchange' },
  { symbol: 'AAVE', name: 'Aave', price: 159.52, change1Y: -7.7, sector: 'DeFi' },
  { symbol: 'LINK', name: 'Chainlink', price: 12.04, change1Y: -27.2, sector: 'Oracle' },
  { symbol: 'UNI', name: 'Uniswap', price: 5.92, change1Y: -39.9, sector: 'DEX' },
  { symbol: 'SOL', name: 'Solana', price: 126.35, change1Y: -50.8, sector: 'Layer 1' },
  { symbol: 'TAO', name: 'Bittensor', price: 267.63, change1Y: -47.7, sector: 'AI' },
  { symbol: 'FIL', name: 'Filecoin', price: 1.59, change1Y: -67.8, sector: 'Storage' },
  { symbol: 'RNDR', name: 'Render', price: 1.70, change1Y: -77.6, sector: 'GPU' },
  { symbol: 'GRT', name: 'The Graph', price: 0.048, change1Y: -79.6, sector: 'Indexing' },
]

interface IndexData {
  symbol: string
  name: string
  currentValue?: number
  returns: { '24H': number; '1M': number; '3M': number; '6M': number; '1Y': number }
  color: string
  components?: number
}

interface TokenData {
  symbol: string
  name: string
  price: number
  change1Y: number
  sector: string
}

export default function Home() {
  const [benchmarks, setBenchmarks] = useState<IndexData[]>(fallbackData.benchmarks)
  const [indexes, setIndexes] = useState<IndexData[]>(fallbackData.indexes)
  const [tokens, setTokens] = useState<TokenData[]>(fallbackTokens)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [dataSource, setDataSource] = useState<'fallback' | 'database'>('fallback')

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()

      if (data.benchmarks?.length > 0) {
        const transformedBenchmarks = data.benchmarks.map((b: any) => ({
          symbol: b.symbol,
          name: b.name,
          currentValue: b.currentValue,
          returns: b.returns,
          color: b.color
        }))
        setBenchmarks(transformedBenchmarks)
        setDataSource('database')
      }

      if (data.indexes?.length > 0) {
        const transformedIndexes = data.indexes.map((i: any) => ({
          symbol: i.symbol,
          name: i.name,
          currentValue: i.currentValue,
          returns: i.returns,
          color: i.color,
          components: i.tokenCount
        }))
        setIndexes(transformedIndexes)
      }

      if (data.topTokens?.length > 0) {
        setTokens(data.topTokens)
      }

      if (data.lastUpdated) {
        setLastUpdated(new Date(data.lastUpdated).toLocaleString())
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Keep using fallback data
    }
  }, [])

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString())
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleRefresh = async () => {
    setLoading(true)
    await fetchDashboardData()
    setLastUpdated(new Date().toLocaleString())
    setLoading(false)
  }

  const handleCollectPrices = async () => {
    setCollecting(true)
    try {
      const response = await fetch('/api/collect', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        // Refresh dashboard data after collection
        await fetchDashboardData()
      } else {
        console.error('Collection failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to collect prices:', error)
    }
    setCollecting(false)
  }

  // Find best and worst performers
  const allIndexes = [...benchmarks, ...indexes]
  const sortedByReturn = [...allIndexes].sort((a, b) => b.returns['1Y'] - a.returns['1Y'])
  const bestPerformer = sortedByReturn[0]
  const worstPerformer = sortedByReturn[sortedByReturn.length - 1]
  const btcReturn = benchmarks.find(b => b.symbol === 'BTC')?.returns['1Y'] || 0

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Crypto Index Dashboard
          </h1>
          <p className="text-gray-400">
            Track Nemes 100, DeFi 25, and Infrastructure 25 indexes vs BTC/ETH
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Database className="w-4 h-4" />
            <span>{dataSource === 'database' ? 'Live' : 'Static'} Data</span>
          </div>
          <span className="text-sm text-gray-500">
            Updated: {lastUpdated}
          </span>
          <button
            onClick={handleCollectPrices}
            disabled={collecting}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
            title="Fetch latest prices from CoinMarketCap"
          >
            <Database className={`w-4 h-4 ${collecting ? 'animate-pulse' : ''}`} />
            {collecting ? 'Collecting...' : 'Collect'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Benchmark Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Benchmarks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benchmarks.map((item) => (
            <IndexCard key={item.symbol} data={item} isBenchmark />
          ))}
        </div>
      </div>

      {/* Index Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Index Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indexes.map((item) => (
            <IndexCard key={item.symbol} data={item} />
          ))}
        </div>
      </div>

      {/* Top Holdings Preview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Top Holdings by Index</h2>
        <TopHoldingsSection />
      </div>

      {/* History Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Historical Performance</h2>
        <HistoryChart />
      </div>

      {/* Performance Comparison Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Performance Comparison</h2>
        <PerformanceTable
          benchmarks={benchmarks}
          indexes={indexes}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">1-Year Returns</h2>
          <PriceChart data={[...benchmarks, ...indexes]} period="1Y" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Top/Bottom Performers</h2>
          <TokenList tokens={tokens} />
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="font-medium text-green-400">Best Performer</span>
            </div>
            <p className="text-2xl font-bold text-white">{bestPerformer?.name}</p>
            <p className="text-gray-400">
              {bestPerformer?.returns['1Y'] >= 0 ? '+' : ''}{bestPerformer?.returns['1Y'].toFixed(1)}% (1Y)
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-blue-400">vs Bitcoin</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {bestPerformer && btcReturn
                ? `${(bestPerformer.returns['1Y'] - btcReturn) >= 0 ? '+' : ''}${(bestPerformer.returns['1Y'] - btcReturn).toFixed(1)}%`
                : 'N/A'}
            </p>
            <p className="text-gray-400">{bestPerformer?.name} outperformance</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="font-medium text-red-400">Worst Performer</span>
            </div>
            <p className="text-2xl font-bold text-white">{worstPerformer?.name}</p>
            <p className="text-gray-400">
              {worstPerformer?.returns['1Y'] >= 0 ? '+' : ''}{worstPerformer?.returns['1Y'].toFixed(1)}% (1Y)
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm">
        <p>Data from CoinMarketCap Pro API | {dataSource === 'database' ? 'Live database' : 'Static snapshot'}</p>
        <p className="mt-1">This dashboard is for informational purposes only. Not investment advice.</p>
      </footer>
    </main>
  )
}
