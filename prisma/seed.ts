import { PrismaClient } from '@prisma/client'
import { INDEX_TOKENS, INDEX_CONFIGS } from '../src/lib/tokens'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed token configurations
  const allTokens = [
    ...INDEX_TOKENS.N100.map(t => ({ ...t, indexes: 'N100' })),
    ...INDEX_TOKENS.DEFI.map(t => ({ ...t, indexes: 'DEFI' })),
    ...INDEX_TOKENS.INFRA.map(t => ({ ...t, indexes: 'INFRA' })),
  ]

  // Deduplicate and merge indexes
  const tokenMap = new Map<string, typeof allTokens[0]>()
  for (const token of allTokens) {
    const existing = tokenMap.get(token.symbol)
    if (existing) {
      existing.indexes = [...new Set([...existing.indexes.split(','), token.indexes])].join(',')
    } else {
      tokenMap.set(token.symbol, { ...token })
    }
  }

  for (const token of tokenMap.values()) {
    await prisma.tokenConfig.upsert({
      where: { symbol: token.symbol },
      update: { name: token.name, sector: token.sector, indexes: token.indexes },
      create: { symbol: token.symbol, name: token.name, sector: token.sector, indexes: token.indexes },
    })
  }
  console.log(`Seeded ${tokenMap.size} tokens`)

  // Seed index configurations
  for (const index of INDEX_CONFIGS) {
    await prisma.indexConfig.upsert({
      where: { symbol: index.symbol },
      update: {
        name: index.name,
        methodology: index.methodology,
        baseIndex: index.baseIndex,
        tokenCount: index.tokenCount,
        color: index.color,
      },
      create: {
        symbol: index.symbol,
        name: index.name,
        methodology: index.methodology,
        baseIndex: index.baseIndex,
        tokenCount: index.tokenCount,
        color: index.color,
      },
    })
  }
  console.log(`Seeded ${INDEX_CONFIGS.length} index configurations`)

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
