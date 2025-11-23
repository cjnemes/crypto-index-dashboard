// Token definitions for each index
// Full list of tokens for accurate index calculations

export const INDEX_TOKENS = {
  // Nemes 100 - Top 100 cryptocurrencies by market cap
  // EXCLUDES: BTC, ETH, Bitcoin forks (BCH, LTC), and ETC (benchmarks only)
  N100: [
    // Top 25 (excluding benchmarks)
    { symbol: 'BNB', name: 'BNB', sector: 'Exchange' },
    { symbol: 'XRP', name: 'XRP', sector: 'Payments' },
    { symbol: 'SOL', name: 'Solana', sector: 'Layer 1' },
    { symbol: 'ADA', name: 'Cardano', sector: 'Layer 1' },
    { symbol: 'DOGE', name: 'Dogecoin', sector: 'Meme' },
    { symbol: 'TRX', name: 'TRON', sector: 'Layer 1' },
    { symbol: 'TON', name: 'Toncoin', sector: 'Layer 1' },
    { symbol: 'AVAX', name: 'Avalanche', sector: 'Layer 1' },
    { symbol: 'SHIB', name: 'Shiba Inu', sector: 'Meme' },
    { symbol: 'DOT', name: 'Polkadot', sector: 'Layer 0' },
    { symbol: 'LINK', name: 'Chainlink', sector: 'Oracle' },
    { symbol: 'XMR', name: 'Monero', sector: 'Privacy' },
    { symbol: 'NEAR', name: 'NEAR Protocol', sector: 'Layer 1' },
    { symbol: 'SUI', name: 'Sui', sector: 'Layer 1' },
    { symbol: 'APT', name: 'Aptos', sector: 'Layer 1' },
    { symbol: 'UNI', name: 'Uniswap', sector: 'DeFi' },
    { symbol: 'ICP', name: 'Internet Computer', sector: 'Layer 1' },
    { symbol: 'PEPE', name: 'Pepe', sector: 'Meme' },
    { symbol: 'FET', name: 'Fetch.ai', sector: 'AI' },
    { symbol: 'RENDER', name: 'Render', sector: 'GPU' },
    { symbol: 'ATOM', name: 'Cosmos', sector: 'Layer 0' },
    { symbol: 'XLM', name: 'Stellar', sector: 'Payments' },
    { symbol: 'OKB', name: 'OKB', sector: 'Exchange' },
    { symbol: 'WIF', name: 'dogwifhat', sector: 'Meme' },
    { symbol: 'ONDO', name: 'Ondo', sector: 'DeFi' },
    { symbol: 'HYPE', name: 'Hyperliquid', sector: 'DEX' },
    // 26-50
    { symbol: 'IMX', name: 'Immutable', sector: 'Gaming' },
    { symbol: 'STX', name: 'Stacks', sector: 'Layer 2' },
    { symbol: 'TAO', name: 'Bittensor', sector: 'AI' },
    { symbol: 'FIL', name: 'Filecoin', sector: 'Storage' },
    { symbol: 'ARB', name: 'Arbitrum', sector: 'Layer 2' },
    { symbol: 'CRO', name: 'Cronos', sector: 'Exchange' },
    { symbol: 'HBAR', name: 'Hedera', sector: 'Layer 1' },
    { symbol: 'MNT', name: 'Mantle', sector: 'Layer 2' },
    { symbol: 'OP', name: 'Optimism', sector: 'Layer 2' },
    { symbol: 'VET', name: 'VeChain', sector: 'Supply Chain' },
    { symbol: 'INJ', name: 'Injective', sector: 'DeFi' },
    { symbol: 'MKR', name: 'Maker', sector: 'DeFi' },
    { symbol: 'AAVE', name: 'Aave', sector: 'DeFi' },
    { symbol: 'GRT', name: 'The Graph', sector: 'Infrastructure' },
    { symbol: 'RUNE', name: 'THORChain', sector: 'DeFi' },
    { symbol: 'THETA', name: 'Theta Network', sector: 'Video' },
    { symbol: 'AR', name: 'Arweave', sector: 'Storage' },
    { symbol: 'ALGO', name: 'Algorand', sector: 'Layer 1' },
    { symbol: 'SEI', name: 'Sei', sector: 'Layer 1' },
    { symbol: 'AERO', name: 'Aerodrome', sector: 'DeFi' },
    { symbol: 'BONK', name: 'Bonk', sector: 'Meme' },
    { symbol: 'FLOW', name: 'Flow', sector: 'Layer 1' },
    { symbol: 'PYTH', name: 'Pyth Network', sector: 'Oracle' },
    { symbol: 'TIA', name: 'Celestia', sector: 'Layer 0' },
    { symbol: 'EGLD', name: 'MultiversX', sector: 'Layer 1' },
    // 51-75
    { symbol: 'AXS', name: 'Axie Infinity', sector: 'Gaming' },
    { symbol: 'SAND', name: 'The Sandbox', sector: 'Gaming' },
    { symbol: 'MANA', name: 'Decentraland', sector: 'Gaming' },
    { symbol: 'XTZ', name: 'Tezos', sector: 'Layer 1' },
    { symbol: 'EOS', name: 'EOS', sector: 'Layer 1' },
    { symbol: 'SNX', name: 'Synthetix', sector: 'DeFi' },
    { symbol: 'GALA', name: 'Gala', sector: 'Gaming' },
    { symbol: 'LDO', name: 'Lido DAO', sector: 'DeFi' },
    { symbol: 'NEO', name: 'Neo', sector: 'Layer 1' },
    { symbol: 'KAVA', name: 'Kava', sector: 'DeFi' },
    { symbol: 'QNT', name: 'Quant', sector: 'Infrastructure' },
    { symbol: 'CFX', name: 'Conflux', sector: 'Layer 1' },
    { symbol: 'WLD', name: 'Worldcoin', sector: 'Identity' },
    { symbol: 'ASTR', name: 'Astar', sector: 'Layer 1' },
    { symbol: 'BLUR', name: 'Blur', sector: 'NFT' },
    { symbol: 'APE', name: 'ApeCoin', sector: 'NFT' },
    { symbol: 'DYDX', name: 'dYdX', sector: 'DeFi' },
    { symbol: 'ROSE', name: 'Oasis Network', sector: 'Privacy' },
    { symbol: 'CHZ', name: 'Chiliz', sector: 'Sports' },
    { symbol: 'CRV', name: 'Curve', sector: 'DeFi' },
    { symbol: 'MINA', name: 'Mina', sector: 'Layer 1' },
    { symbol: 'ZIL', name: 'Zilliqa', sector: 'Layer 1' },
    { symbol: 'ENJ', name: 'Enjin Coin', sector: 'Gaming' },
    { symbol: 'CAKE', name: 'PancakeSwap', sector: 'DeFi' },
    { symbol: 'IOTA', name: 'IOTA', sector: 'IoT' },
    // 76-100
    { symbol: 'GMX', name: 'GMX', sector: 'DeFi' },
    { symbol: 'COMP', name: 'Compound', sector: 'DeFi' },
    { symbol: 'ZEC', name: 'Zcash', sector: 'Privacy' },
    { symbol: '1INCH', name: '1inch', sector: 'DeFi' },
    { symbol: 'ENS', name: 'Ethereum Name Service', sector: 'Infrastructure' },
    { symbol: 'RPL', name: 'Rocket Pool', sector: 'DeFi' },
    { symbol: 'OCEAN', name: 'Ocean Protocol', sector: 'Data' },
    { symbol: 'LPT', name: 'Livepeer', sector: 'Video' },
    { symbol: 'ANKR', name: 'Ankr', sector: 'Infrastructure' },
    { symbol: 'BAT', name: 'Basic Attention Token', sector: 'Advertising' },
    { symbol: 'SKL', name: 'SKALE', sector: 'Layer 2' },
    { symbol: 'STORJ', name: 'Storj', sector: 'Storage' },
    { symbol: 'CELO', name: 'Celo', sector: 'Layer 1' },
    { symbol: 'YFI', name: 'yearn.finance', sector: 'DeFi' },
    { symbol: 'BAL', name: 'Balancer', sector: 'DeFi' },
    { symbol: 'SUSHI', name: 'SushiSwap', sector: 'DeFi' },
    { symbol: 'HNT', name: 'Helium', sector: 'IoT' },
    { symbol: 'KSM', name: 'Kusama', sector: 'Layer 0' },
    { symbol: 'IOTX', name: 'IoTeX', sector: 'IoT' },
    { symbol: 'ONE', name: 'Harmony', sector: 'Layer 1' },
    { symbol: 'ZRX', name: '0x', sector: 'DeFi' },
    { symbol: 'ICX', name: 'ICON', sector: 'Layer 1' },
    { symbol: 'API3', name: 'API3', sector: 'Oracle' },
    { symbol: 'AKT', name: 'Akash Network', sector: 'Compute' },
  ],

  // DeFi 25 - Top 25 DeFi protocols
  DEFI: [
    { symbol: 'UNI', name: 'Uniswap', sector: 'DEX' },
    { symbol: 'AAVE', name: 'Aave', sector: 'Lending' },
    { symbol: 'MKR', name: 'Maker', sector: 'Stablecoin' },
    { symbol: 'LDO', name: 'Lido DAO', sector: 'Staking' },
    { symbol: 'INJ', name: 'Injective', sector: 'DeFi Chain' },
    { symbol: 'RUNE', name: 'THORChain', sector: 'Cross-chain' },
    { symbol: 'SNX', name: 'Synthetix', sector: 'Derivatives' },
    { symbol: 'CRV', name: 'Curve', sector: 'DEX' },
    { symbol: 'DYDX', name: 'dYdX', sector: 'Derivatives' },
    { symbol: 'GMX', name: 'GMX', sector: 'Derivatives' },
    { symbol: 'COMP', name: 'Compound', sector: 'Lending' },
    { symbol: '1INCH', name: '1inch', sector: 'Aggregator' },
    { symbol: 'CAKE', name: 'PancakeSwap', sector: 'DEX' },
    { symbol: 'YFI', name: 'yearn.finance', sector: 'Aggregator' },
    { symbol: 'BAL', name: 'Balancer', sector: 'DEX' },
    { symbol: 'SUSHI', name: 'SushiSwap', sector: 'DEX' },
    { symbol: 'ZRX', name: '0x', sector: 'DEX Protocol' },
    { symbol: 'KAVA', name: 'Kava', sector: 'Lending' },
    { symbol: 'PENDLE', name: 'Pendle', sector: 'Yield' },
    { symbol: 'JOE', name: 'Trader Joe', sector: 'DEX' },
    { symbol: 'AERO', name: 'Aerodrome', sector: 'DEX' },
    { symbol: 'LQTY', name: 'Liquity', sector: 'Stablecoin' },
    { symbol: 'PHAR', name: 'Pharaoh', sector: 'DEX' },
    { symbol: 'MORPHO', name: 'Morpho', sector: 'Lending' },
    { symbol: 'HYPE', name: 'Hyperliquid', sector: 'DEX' },
  ],

  // ============================================================================
  // SECTOR SUB-INDEXES (N100-aligned, minimum ~10 tokens each)
  // ============================================================================

  // Layer 1 - Base layer smart contract platforms (24 tokens from N100)
  L1: [
    { symbol: 'SOL', name: 'Solana', sector: 'Layer 1' },
    { symbol: 'ADA', name: 'Cardano', sector: 'Layer 1' },
    { symbol: 'TRX', name: 'TRON', sector: 'Layer 1' },
    { symbol: 'TON', name: 'Toncoin', sector: 'Layer 1' },
    { symbol: 'AVAX', name: 'Avalanche', sector: 'Layer 1' },
    { symbol: 'NEAR', name: 'NEAR Protocol', sector: 'Layer 1' },
    { symbol: 'SUI', name: 'Sui', sector: 'Layer 1' },
    { symbol: 'APT', name: 'Aptos', sector: 'Layer 1' },
    { symbol: 'ICP', name: 'Internet Computer', sector: 'Layer 1' },
    { symbol: 'HBAR', name: 'Hedera', sector: 'Layer 1' },
    { symbol: 'ALGO', name: 'Algorand', sector: 'Layer 1' },
    { symbol: 'SEI', name: 'Sei', sector: 'Layer 1' },
    { symbol: 'FLOW', name: 'Flow', sector: 'Layer 1' },
    { symbol: 'EGLD', name: 'MultiversX', sector: 'Layer 1' },
    { symbol: 'XTZ', name: 'Tezos', sector: 'Layer 1' },
    { symbol: 'EOS', name: 'EOS', sector: 'Layer 1' },
    { symbol: 'NEO', name: 'Neo', sector: 'Layer 1' },
    { symbol: 'CFX', name: 'Conflux', sector: 'Layer 1' },
    { symbol: 'ASTR', name: 'Astar', sector: 'Layer 1' },
    { symbol: 'MINA', name: 'Mina', sector: 'Layer 1' },
    { symbol: 'ZIL', name: 'Zilliqa', sector: 'Layer 1' },
    { symbol: 'CELO', name: 'Celo', sector: 'Layer 1' },
    { symbol: 'ONE', name: 'Harmony', sector: 'Layer 1' },
    { symbol: 'ICX', name: 'ICON', sector: 'Layer 1' },
  ],

  // Scaling - L2s + Layer 0 interoperability (9 tokens from N100)
  // Note: IMX moved to GAMING as it's gaming-focused
  SCALE: [
    // Layer 2s
    { symbol: 'ARB', name: 'Arbitrum', sector: 'Layer 2' },
    { symbol: 'OP', name: 'Optimism', sector: 'Layer 2' },
    { symbol: 'STX', name: 'Stacks', sector: 'Layer 2' },
    { symbol: 'MNT', name: 'Mantle', sector: 'Layer 2' },
    { symbol: 'SKL', name: 'SKALE', sector: 'Layer 2' },
    // Layer 0 / Interoperability
    { symbol: 'DOT', name: 'Polkadot', sector: 'Layer 0' },
    { symbol: 'ATOM', name: 'Cosmos', sector: 'Layer 0' },
    { symbol: 'TIA', name: 'Celestia', sector: 'Layer 0' },
    { symbol: 'KSM', name: 'Kusama', sector: 'Layer 0' },
  ],

  // AI & Compute - AI, GPU, Compute, IoT (10 tokens from N100/INFRA)
  AI: [
    { symbol: 'TAO', name: 'Bittensor', sector: 'AI' },
    { symbol: 'FET', name: 'Fetch.ai', sector: 'AI' },
    { symbol: 'RENDER', name: 'Render', sector: 'GPU' },
    { symbol: 'AKT', name: 'Akash Network', sector: 'Compute' },
    { symbol: 'THETA', name: 'Theta Network', sector: 'Video' },
    { symbol: 'LPT', name: 'Livepeer', sector: 'Video' },
    { symbol: 'IOTX', name: 'IoTeX', sector: 'IoT' },
    { symbol: 'HNT', name: 'Helium', sector: 'IoT' },
    { symbol: 'IOTA', name: 'IOTA', sector: 'IoT' },
    { symbol: 'ANKR', name: 'Ankr', sector: 'RPC' },
  ],

  // Gaming & NFT - Gaming, Metaverse, NFT (8 tokens from N100)
  GAMING: [
    { symbol: 'IMX', name: 'Immutable', sector: 'Gaming' },
    { symbol: 'AXS', name: 'Axie Infinity', sector: 'Gaming' },
    { symbol: 'SAND', name: 'The Sandbox', sector: 'Gaming' },
    { symbol: 'MANA', name: 'Decentraland', sector: 'Gaming' },
    { symbol: 'GALA', name: 'Gala', sector: 'Gaming' },
    { symbol: 'ENJ', name: 'Enjin Coin', sector: 'Gaming' },
    { symbol: 'APE', name: 'ApeCoin', sector: 'NFT' },
    { symbol: 'BLUR', name: 'Blur', sector: 'NFT' },
  ],

  // DEX - Decentralized Exchanges (11 tokens from DEFI index)
  DEX: [
    { symbol: 'UNI', name: 'Uniswap', sector: 'DEX' },
    { symbol: 'CRV', name: 'Curve', sector: 'DEX' },
    { symbol: 'CAKE', name: 'PancakeSwap', sector: 'DEX' },
    { symbol: 'SUSHI', name: 'SushiSwap', sector: 'DEX' },
    { symbol: 'BAL', name: 'Balancer', sector: 'DEX' },
    { symbol: 'ZRX', name: '0x', sector: 'DEX' },
    { symbol: 'JOE', name: 'Trader Joe', sector: 'DEX' },
    { symbol: 'AERO', name: 'Aerodrome', sector: 'DEX' },
    { symbol: 'PHAR', name: 'Pharaoh', sector: 'DEX' },
    { symbol: 'HYPE', name: 'Hyperliquid', sector: 'DEX' },
    { symbol: '1INCH', name: '1inch', sector: 'Aggregator' },
  ],

  // Yield - Lending, Derivatives, Staking (12 tokens from DEFI index)
  YIELD: [
    // Lending
    { symbol: 'AAVE', name: 'Aave', sector: 'Lending' },
    { symbol: 'COMP', name: 'Compound', sector: 'Lending' },
    { symbol: 'MKR', name: 'Maker', sector: 'Lending' },
    { symbol: 'KAVA', name: 'Kava', sector: 'Lending' },
    { symbol: 'MORPHO', name: 'Morpho', sector: 'Lending' },
    // Derivatives
    { symbol: 'SNX', name: 'Synthetix', sector: 'Derivatives' },
    { symbol: 'DYDX', name: 'dYdX', sector: 'Derivatives' },
    { symbol: 'GMX', name: 'GMX', sector: 'Derivatives' },
    // Staking & Yield
    { symbol: 'LDO', name: 'Lido DAO', sector: 'Staking' },
    { symbol: 'PENDLE', name: 'Pendle', sector: 'Yield' },
    { symbol: 'YFI', name: 'yearn.finance', sector: 'Yield' },
  ],

  // Data - Oracles, Storage, Indexing (10 tokens from INFRA index)
  DATA: [
    // Oracles
    { symbol: 'LINK', name: 'Chainlink', sector: 'Oracle' },
    { symbol: 'PYTH', name: 'Pyth Network', sector: 'Oracle' },
    { symbol: 'API3', name: 'API3', sector: 'Oracle' },
    { symbol: 'BAND', name: 'Band Protocol', sector: 'Oracle' },
    // Storage
    { symbol: 'FIL', name: 'Filecoin', sector: 'Storage' },
    { symbol: 'AR', name: 'Arweave', sector: 'Storage' },
    { symbol: 'STORJ', name: 'Storj', sector: 'Storage' },
    // Indexing & Data
    { symbol: 'GRT', name: 'The Graph', sector: 'Indexing' },
    { symbol: 'OCEAN', name: 'Ocean Protocol', sector: 'Data' },
    { symbol: 'ENS', name: 'Ethereum Name Service', sector: 'Identity' },
  ],

  // Infrastructure 25 - Blockchain infrastructure tokens
  INFRA: [
    { symbol: 'LINK', name: 'Chainlink', sector: 'Oracle' },
    { symbol: 'RENDER', name: 'Render', sector: 'GPU' },
    { symbol: 'GRT', name: 'The Graph', sector: 'Indexing' },
    { symbol: 'FIL', name: 'Filecoin', sector: 'Storage' },
    { symbol: 'AR', name: 'Arweave', sector: 'Storage' },
    { symbol: 'TAO', name: 'Bittensor', sector: 'AI' },
    { symbol: 'FET', name: 'Fetch.ai', sector: 'AI' },
    { symbol: 'THETA', name: 'Theta Network', sector: 'Video' },
    { symbol: 'PYTH', name: 'Pyth Network', sector: 'Oracle' },
    { symbol: 'QNT', name: 'Quant', sector: 'Interoperability' },
    { symbol: 'OCEAN', name: 'Ocean Protocol', sector: 'Data' },
    { symbol: 'LPT', name: 'Livepeer', sector: 'Video' },
    { symbol: 'ANKR', name: 'Ankr', sector: 'RPC' },
    { symbol: 'ENS', name: 'Ethereum Name Service', sector: 'Identity' },
    { symbol: 'STORJ', name: 'Storj', sector: 'Storage' },
    { symbol: 'HNT', name: 'Helium', sector: 'IoT' },
    { symbol: 'IOTX', name: 'IoTeX', sector: 'IoT' },
    { symbol: 'IOTA', name: 'IOTA', sector: 'IoT' },
    { symbol: 'API3', name: 'API3', sector: 'Oracle' },
    { symbol: 'BAND', name: 'Band Protocol', sector: 'Oracle' },
    { symbol: 'AKT', name: 'Akash Network', sector: 'Compute' },
    { symbol: 'NKN', name: 'NKN', sector: 'Network' },
    { symbol: 'SC', name: 'Siacoin', sector: 'Storage' },
    { symbol: 'GLM', name: 'Golem', sector: 'Compute' },
    { symbol: 'FLUX', name: 'Flux', sector: 'Compute' },
  ],
}

// ============================================================================
// INDEX CONFIGURATION
// ============================================================================

// Index inception date - all indexes start from this date
// Divisors are calculated based on market data from this date
export const INDEX_INCEPTION_DATE = '2024-11-25'

// Starting index value - all indexes begin at this value
// Similar to: S&P 500 started at 10, Nasdaq at 100, Russell 2000 at 135
export const INDEX_BASE_VALUE = 1000

// Index configurations
// Note: Equal-weighted (EW) indexes deprecated Nov 2024 in favor of MCW-only strategy
export const INDEX_CONFIGS = [
  // Benchmarks
  { symbol: 'BTC', name: 'Bitcoin', methodology: 'BENCHMARK', baseIndex: 'BTC', tokenCount: 1, color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', methodology: 'BENCHMARK', baseIndex: 'ETH', tokenCount: 1, color: '#627EEA' },

  // Core Indexes
  { symbol: 'N100-MCW', name: 'Nemes 100', methodology: 'MCW', baseIndex: 'N100', tokenCount: 100, color: '#00D395' },
  { symbol: 'DEFI-MCW', name: 'DeFi 25', methodology: 'MCW', baseIndex: 'DEFI', tokenCount: 25, color: '#9B59B6' },
  { symbol: 'INFRA-MCW', name: 'Infra 25', methodology: 'MCW', baseIndex: 'INFRA', tokenCount: 25, color: '#3498DB' },

  // Sector Sub-Indexes (added Nov 2024)
  { symbol: 'L1-MCW', name: 'Layer 1', methodology: 'MCW', baseIndex: 'L1', tokenCount: 24, color: '#E74C3C', parent: 'N100' },
  { symbol: 'SCALE-MCW', name: 'Scaling', methodology: 'MCW', baseIndex: 'SCALE', tokenCount: 9, color: '#E67E22', parent: 'N100' },
  { symbol: 'AI-MCW', name: 'AI & Compute', methodology: 'MCW', baseIndex: 'AI', tokenCount: 10, color: '#1ABC9C', parent: 'INFRA' },
  { symbol: 'GAMING-MCW', name: 'Gaming', methodology: 'MCW', baseIndex: 'GAMING', tokenCount: 8, color: '#9B59B6', parent: 'N100' },
  { symbol: 'DEX-MCW', name: 'DEX', methodology: 'MCW', baseIndex: 'DEX', tokenCount: 11, color: '#FF6B9D', parent: 'DEFI' },
  { symbol: 'YIELD-MCW', name: 'Yield', methodology: 'MCW', baseIndex: 'YIELD', tokenCount: 11, color: '#3498DB', parent: 'DEFI' },
  { symbol: 'DATA-MCW', name: 'Data', methodology: 'MCW', baseIndex: 'DATA', tokenCount: 10, color: '#27AE60', parent: 'INFRA' },
]

/**
 * INDEX METHODOLOGY (following S&P/Dow Jones standards)
 * =====================================================
 *
 * MCW (Market Cap Weighted) - like S&P 500:
 *   Index = Total_Market_Cap / Divisor
 *   Divisor = Baseline_Total_Market_Cap / INDEX_BASE_VALUE
 *
 *   Example: If baseline total mcap = $677B and base value = 1000
 *   Divisor = $677B / 1000 = $677M
 *   If today's total mcap = $650B, Index = $650B / $677M = 960.1
 *
 * EW (Equal Weighted) - like S&P 500 Equal Weight:
 *   At inception, each token gets equal dollar allocation
 *   "Shares" per token = (Notional_Investment / N) / Price_at_baseline
 *   Index = Sum(Price_today × Shares) / Divisor
 *
 *   This ensures each token's % move contributes equally to index returns
 *
 * BENCHMARK:
 *   Raw price of the asset (BTC, ETH) - no divisor needed
 */

// Get all unique token symbols for API calls
export function getAllTokenSymbols(): string[] {
  const allTokens = [
    ...INDEX_TOKENS.N100,
    ...INDEX_TOKENS.DEFI,
    ...INDEX_TOKENS.INFRA,
    // Sector sub-indexes (most overlap with above, but includes any extras)
    ...INDEX_TOKENS.L1,
    ...INDEX_TOKENS.SCALE,
    ...INDEX_TOKENS.AI,
    ...INDEX_TOKENS.GAMING,
    ...INDEX_TOKENS.DEX,
    ...INDEX_TOKENS.YIELD,
    ...INDEX_TOKENS.DATA,
  ]
  return [...new Set(allTokens.map(t => t.symbol))]
}

// Get token count summary
export function getTokenCounts() {
  return {
    // Core indexes
    n100: INDEX_TOKENS.N100.length,
    defi: INDEX_TOKENS.DEFI.length,
    infra: INDEX_TOKENS.INFRA.length,
    // Sector sub-indexes
    l1: INDEX_TOKENS.L1.length,
    scale: INDEX_TOKENS.SCALE.length,
    ai: INDEX_TOKENS.AI.length,
    gaming: INDEX_TOKENS.GAMING.length,
    dex: INDEX_TOKENS.DEX.length,
    yield: INDEX_TOKENS.YIELD.length,
    data: INDEX_TOKENS.DATA.length,
    // Total unique
    unique: getAllTokenSymbols().length,
  }
}

// Get tokens for a specific index
export function getIndexTokens(baseIndex: string) {
  const indexMap: Record<string, typeof INDEX_TOKENS.N100> = {
    N100: INDEX_TOKENS.N100,
    DEFI: INDEX_TOKENS.DEFI,
    INFRA: INDEX_TOKENS.INFRA,
    L1: INDEX_TOKENS.L1,
    SCALE: INDEX_TOKENS.SCALE,
    AI: INDEX_TOKENS.AI,
    GAMING: INDEX_TOKENS.GAMING,
    DEX: INDEX_TOKENS.DEX,
    YIELD: INDEX_TOKENS.YIELD,
    DATA: INDEX_TOKENS.DATA,
  }
  return indexMap[baseIndex] || []
}
