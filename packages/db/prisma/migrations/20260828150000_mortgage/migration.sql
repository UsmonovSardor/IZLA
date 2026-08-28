
-- CreateEnum
CREATE TYPE "MortgageStatus" AS ENUM ('NEW', 'CONTACTED', 'APPROVED', 'FUNDED', 'REJECTED');

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "license" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_programs" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "annualRate" DECIMAL(5,2) NOT NULL,
    "maxTermMonths" INTEGER NOT NULL DEFAULT 240,
    "minDownPct" INTEGER NOT NULL DEFAULT 15,
    "maxAmount" DECIMAL(16,2),
    "propertyTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" JSONB NOT NULL DEFAULT '[]',
    "referralFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monthlyFrom" DECIMAL(14,2),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "subsidized" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mortgage_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_leads" (
    "id" TEXT NOT NULL,
    "programId" TEXT,
    "propertyId" TEXT,
    "complexId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "propertyPrice" DECIMAL(16,2) NOT NULL,
    "downPayment" DECIMAL(16,2) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyPayment" DECIMAL(14,2) NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "MortgageStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banks_slug_key" ON "banks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_programs_slug_key" ON "mortgage_programs"("slug");

-- CreateIndex
CREATE INDEX "mortgage_programs_active_idx" ON "mortgage_programs"("active");

-- CreateIndex
CREATE INDEX "mortgage_programs_bankId_idx" ON "mortgage_programs"("bankId");

-- CreateIndex
CREATE INDEX "mortgage_leads_userId_idx" ON "mortgage_leads"("userId");

-- CreateIndex
CREATE INDEX "mortgage_leads_status_idx" ON "mortgage_leads"("status");

-- AddForeignKey
ALTER TABLE "mortgage_programs" ADD CONSTRAINT "mortgage_programs_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_leads" ADD CONSTRAINT "mortgage_leads_programId_fkey" FOREIGN KEY ("programId") REFERENCES "mortgage_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_leads" ADD CONSTRAINT "mortgage_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

