// CoinGecko coin ID mappings for historical data fetching
// CoinGecko uses slugs (lowercase hyphenated names) as IDs

export const COINGECKO_IDS: Record<string, string> = {
  // Top 25 (from N100)
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'TRX': 'tron',
  'AVAX': 'avalanche-2',
  'SHIB': 'shiba-inu',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'SUI': 'sui',
  'LTC': 'litecoin',
  'APT': 'aptos',
  'UNI': 'uniswap',
  'ICP': 'internet-computer',
  'PEPE': 'pepe',
  'FET': 'fetch-ai',
  'ETC': 'ethereum-classic',
  'RENDER': 'render-token',
  'ATOM': 'cosmos',
  'XLM': 'stellar',

  // 26-50
  'IMX': 'immutable-x',
  'STX': 'blockstack',
  'TAO': 'bittensor',
  'FIL': 'filecoin',
  'ARB': 'arbitrum',
  'CRO': 'crypto-com-chain',
  'HBAR': 'hedera-hashgraph',
  'MNT': 'mantle',
  'OP': 'optimism',
  'VET': 'vechain',
  'INJ': 'injective-protocol',
  'MKR': 'maker',
  'AAVE': 'aave',
  'GRT': 'the-graph',
  'RUNE': 'thorchain',
  'THETA': 'theta-token',
  'AR': 'arweave',
  'ALGO': 'algorand',
  'SEI': 'sei-network',
  'FTM': 'fantom',
  'BONK': 'bonk',
  'FLOW': 'flow',
  'PYTH': 'pyth-network',
  'TIA': 'celestia',
  'EGLD': 'elrond-erd-2',

  // 51-75
  'AXS': 'axie-infinity',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'XTZ': 'tezos',
  'EOS': 'eos',
  'SNX': 'havven',
  'GALA': 'gala',
  'LDO': 'lido-dao',
  'NEO': 'neo',
  'KAVA': 'kava',
  'QNT': 'quant-network',
  'CFX': 'conflux-token',
  'WLD': 'worldcoin-wld',
  'ASTR': 'astar',
  'BLUR': 'blur',
  'APE': 'apecoin',
  'DYDX': 'dydx',
  'ROSE': 'oasis-network',
  'CHZ': 'chiliz',
  'CRV': 'curve-dao-token',
  'MINA': 'mina-protocol',
  'ZIL': 'zilliqa',
  'ENJ': 'enjincoin',
  'CAKE': 'pancakeswap-token',
  'IOTA': 'iota',

  // 76-100
  'GMX': 'gmx',
  'COMP': 'compound-governance-token',
  'ZEC': 'zcash',
  '1INCH': '1inch',
  'ENS': 'ethereum-name-service',
  'RPL': 'rocket-pool',
  'OCEAN': 'ocean-protocol',
  'LPT': 'livepeer',
  'ANKR': 'ankr',
  'BAT': 'basic-attention-token',
  'SKL': 'skale',
  'STORJ': 'storj',
  'CELO': 'celo',
  'YFI': 'yearn-finance',
  'BAL': 'balancer',
  'SUSHI': 'sushi',
  'HNT': 'helium',
  'KSM': 'kusama',
  'IOTX': 'iotex',
  'ONE': 'harmony',
  'ZRX': '0x',
  'ICX': 'icon',
  'AUDIO': 'audius',
  'API3': 'api3',
  'AKT': 'akash-network',

  // Additional DeFi tokens
  'PENDLE': 'pendle',
  'JOE': 'joe',
  'PERP': 'perpetual-protocol',
  'LQTY': 'liquity',
  'INST': 'instadapp',
  'SPELL': 'spell-token',

  // Additional Infra tokens
  'BAND': 'band-protocol',
  'NKN': 'nkn',
  'SC': 'siacoin',
  'GLM': 'golem',
  'FLUX': 'zelcash',
}

// Get CoinGecko ID for a symbol
export function getCoinGeckoId(symbol: string): string | undefined {
  return COINGECKO_IDS[symbol.toUpperCase()]
}

// Get all CoinGecko IDs
export function getAllCoinGeckoIds(): string[] {
  return Object.values(COINGECKO_IDS)
}

// Get symbol from CoinGecko ID
export function getSymbolFromCoinGeckoId(id: string): string | undefined {
  return Object.entries(COINGECKO_IDS).find(([_, cgId]) => cgId === id)?.[0]
}
