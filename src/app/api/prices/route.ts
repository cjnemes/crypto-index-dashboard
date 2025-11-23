import { NextResponse } from 'next/server'

const CMC_API_KEY = process.env.CMC_API_KEY || ''
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v2'

// Token symbols for each index
const TOKEN_SYMBOLS = {
  benchmarks: ['BTC', 'ETH'],
  nemes100: ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC', 'UNI', 'ATOM', 'LTC', 'ICP'],
  defi25: ['UNI', 'AAVE', 'MKR', 'CRV', 'COMP', 'SNX', 'YFI', 'SUSHI', 'BAL', 'LDO'],
  infra25: ['LINK', 'FIL', 'GRT', 'RNDR', 'AR', 'THETA', 'HNT', 'OCEAN', 'LPT', 'ANKR']
}

interface QuoteData {
  symbol: string
  name: string
  quote: {
    USD: {
      price: number
      percent_change_24h: number
      percent_change_7d: number
      percent_change_30d: number
      percent_change_90d: number
      market_cap: number
    }
  }
}

export async function GET() {
  if (!CMC_API_KEY) {
    return NextResponse.json(
      { error: 'CMC_API_KEY not configured' },
      { status: 500 }
    )
  }

  try {
    // Get all unique symbols
    const allSymbols = [...new Set([
      ...TOKEN_SYMBOLS.benchmarks,
      ...TOKEN_SYMBOLS.nemes100,
      ...TOKEN_SYMBOLS.defi25,
      ...TOKEN_SYMBOLS.infra25
    ])]

    const response = await fetch(
      `${CMC_BASE_URL}/cryptocurrency/quotes/latest?symbol=${allSymbols.join(',')}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          'Accept': 'application/json'
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`CMC API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform the data
    const prices: Record<string, QuoteData> = {}

    if (data.data) {
      for (const symbol of Object.keys(data.data)) {
        const tokenData = data.data[symbol][0]
        if (tokenData) {
          prices[symbol] = {
            symbol: tokenData.symbol,
            name: tokenData.name,
            quote: tokenData.quote
          }
        }
      }
    }

    return NextResponse.json({
      prices,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
