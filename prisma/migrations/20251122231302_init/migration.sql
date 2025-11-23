-- CreateTable
CREATE TABLE "Price" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "marketCap" REAL NOT NULL,
    "volume24h" REAL,
    "change24h" REAL,
    "change7d" REAL,
    "change30d" REAL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IndexSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "indexName" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "returns1d" REAL,
    "returns7d" REAL,
    "returns30d" REAL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TokenConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "indexes" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IndexConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "methodology" TEXT NOT NULL,
    "baseIndex" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CollectionLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL,
    "tokensCount" INTEGER,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Price_symbol_timestamp_idx" ON "Price"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "Price_timestamp_idx" ON "Price"("timestamp");

-- CreateIndex
CREATE INDEX "IndexSnapshot_indexName_timestamp_idx" ON "IndexSnapshot"("indexName", "timestamp");

-- CreateIndex
CREATE INDEX "IndexSnapshot_timestamp_idx" ON "IndexSnapshot"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TokenConfig_symbol_key" ON "TokenConfig"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "IndexConfig_symbol_key" ON "IndexConfig"("symbol");
