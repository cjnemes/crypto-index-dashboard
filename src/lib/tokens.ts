// Token definitions for each index
export const INDEX_TOKENS = {
  // Nemes 100 - Top 100 by market cap (sample of key tokens)
  N100: [
    { symbol: 'BTC', name: 'Bitcoin', sector: 'Layer 1' },
    { symbol: 'ETH', name: 'Ethereum', sector: 'Layer 1' },
    { symbol: 'BNB', name: 'BNB', sector: 'Exchange' },
    { symbol: 'XRP', name: 'XRP', sector: 'Payments' },
    { symbol: 'SOL', name: 'Solana', sector: 'Layer 1' },
    { symbol: 'ADA', name: 'Cardano', sector: 'Layer 1' },
    { symbol: 'DOGE', name: 'Dogecoin', sector: 'Meme' },
    { symbol: 'AVAX', name: 'Avalanche', sector: 'Layer 1' },
    { symbol: 'DOT', name: 'Polkadot', sector: 'Layer 0' },
    { symbol: 'LINK', name: 'Chainlink', sector: 'Oracle' },
    { symbol: 'MATIC', name: 'Polygon', sector: 'Layer 2' },
    { symbol: 'UNI', name: 'Uniswap', sector: 'DeFi' },
    { symbol: 'ATOM', name: 'Cosmos', sector: 'Layer 0' },
    { symbol: 'LTC', name: 'Litecoin', sector: 'Payments' },
    { symbol: 'ICP', name: 'Internet Computer', sector: 'Layer 1' },
    { symbol: 'FIL', name: 'Filecoin', sector: 'Storage' },
    { symbol: 'ARB', name: 'Arbitrum', sector: 'Layer 2' },
    { symbol: 'OP', name: 'Optimism', sector: 'Layer 2' },
    { symbol: 'NEAR', name: 'NEAR Protocol', sector: 'Layer 1' },
    { symbol: 'INJ', name: 'Injective', sector: 'DeFi' },
    { symbol: 'AAVE', name: 'Aave', sector: 'DeFi' },
    { symbol: 'MKR', name: 'Maker', sector: 'DeFi' },
    { symbol: 'GRT', name: 'The Graph', sector: 'Infrastructure' },
    { symbol: 'RNDR', name: 'Render', sector: 'GPU' },
    { symbol: 'TAO', name: 'Bittensor', sector: 'AI' },
  ],

  // DeFi 25 - Top DeFi protocols
  DEFI: [
    { symbol: 'UNI', name: 'Uniswap', sector: 'DEX' },
    { symbol: 'AAVE', name: 'Aave', sector: 'Lending' },
    { symbol: 'MKR', name: 'Maker', sector: 'Stablecoin' },
    { symbol: 'LDO', name: 'Lido DAO', sector: 'Staking' },
    { symbol: 'SNX', name: 'Synthetix', sector: 'Derivatives' },
    { symbol: 'CRV', name: 'Curve', sector: 'DEX' },
    { symbol: 'COMP', name: 'Compound', sector: 'Lending' },
    { symbol: 'SUSHI', name: 'SushiSwap', sector: 'DEX' },
    { symbol: 'YFI', name: 'yearn.finance', sector: 'Aggregator' },
    { symbol: 'BAL', name: 'Balancer', sector: 'DEX' },
    { symbol: '1INCH', name: '1inch', sector: 'Aggregator' },
    { symbol: 'DYDX', name: 'dYdX', sector: 'Derivatives' },
    { symbol: 'GMX', name: 'GMX', sector: 'Derivatives' },
    { symbol: 'PENDLE', name: 'Pendle', sector: 'Yield' },
    { symbol: 'INJ', name: 'Injective', sector: 'DeFi Chain' },
  ],

  // Infrastructure 25 - Blockchain infrastructure tokens
  INFRA: [
    { symbol: 'LINK', name: 'Chainlink', sector: 'Oracle' },
    { symbol: 'FIL', name: 'Filecoin', sector: 'Storage' },
    { symbol: 'GRT', name: 'The Graph', sector: 'Indexing' },
    { symbol: 'RNDR', name: 'Render', sector: 'GPU' },
    { symbol: 'AR', name: 'Arweave', sector: 'Storage' },
    { symbol: 'THETA', name: 'Theta Network', sector: 'Video' },
    { symbol: 'HNT', name: 'Helium', sector: 'IoT' },
    { symbol: 'OCEAN', name: 'Ocean Protocol', sector: 'Data' },
    { symbol: 'LPT', name: 'Livepeer', sector: 'Video' },
    { symbol: 'ANKR', name: 'Ankr', sector: 'RPC' },
    { symbol: 'API3', name: 'API3', sector: 'Oracle' },
    { symbol: 'BAND', name: 'Band Protocol', sector: 'Oracle' },
    { symbol: 'STORJ', name: 'Storj', sector: 'Storage' },
    { symbol: 'AKT', name: 'Akash Network', sector: 'Compute' },
    { symbol: 'TAO', name: 'Bittensor', sector: 'AI' },
  ],
}

// Index configurations
export const INDEX_CONFIGS = [
  { symbol: 'BTC', name: 'Bitcoin', methodology: 'BENCHMARK', baseIndex: 'BTC', tokenCount: 1, color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', methodology: 'BENCHMARK', baseIndex: 'ETH', tokenCount: 1, color: '#627EEA' },
  { symbol: 'N100-MCW', name: 'Nemes 100 MCW', methodology: 'MCW', baseIndex: 'N100', tokenCount: 100, color: '#00D395' },
  { symbol: 'N100-EW', name: 'Nemes 100 EW', methodology: 'EW', baseIndex: 'N100', tokenCount: 100, color: '#00A67E' },
  { symbol: 'DEFI-MCW', name: 'DeFi 25 MCW', methodology: 'MCW', baseIndex: 'DEFI', tokenCount: 25, color: '#9B59B6' },
  { symbol: 'DEFI-EW', name: 'DeFi 25 EW', methodology: 'EW', baseIndex: 'DEFI', tokenCount: 25, color: '#8E44AD' },
  { symbol: 'INFRA-MCW', name: 'Infra 25 MCW', methodology: 'MCW', baseIndex: 'INFRA', tokenCount: 25, color: '#3498DB' },
  { symbol: 'INFRA-EW', name: 'Infra 25 EW', methodology: 'EW', baseIndex: 'INFRA', tokenCount: 25, color: '#2980B9' },
]

// Get all unique token symbols for API calls
export function getAllTokenSymbols(): string[] {
  const allTokens = [
    ...INDEX_TOKENS.N100,
    ...INDEX_TOKENS.DEFI,
    ...INDEX_TOKENS.INFRA,
  ]
  return [...new Set(allTokens.map(t => t.symbol))]
}
