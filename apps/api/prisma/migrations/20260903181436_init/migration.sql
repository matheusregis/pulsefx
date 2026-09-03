-- CreateEnum
CREATE TYPE "Source" AS ENUM ('BCB', 'FRED');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Indicator" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "sourceSeriesId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "variationWindow" INTEGER NOT NULL,
    "variationLabel" TEXT NOT NULL,
    "historyWindow" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "limitations" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Indicator_code_key" ON "Indicator"("code");

-- CreateIndex
CREATE INDEX "Observation_indicatorId_date_idx" ON "Observation"("indicatorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_indicatorId_date_key" ON "Observation"("indicatorId", "date");

-- CreateIndex
CREATE INDEX "Favorite_clientId_idx" ON "Favorite"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_clientId_indicatorId_key" ON "Favorite"("clientId", "indicatorId");

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
