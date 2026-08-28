
-- CreateEnum
CREATE TYPE "NasiyaStatus" AS ENUM ('NEW', 'CONTACTED', 'APPROVED', 'ISSUED', 'REJECTED');

-- CreateTable
CREATE TABLE "nasiya_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "color" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "terms" JSONB NOT NULL DEFAULT '{}',
    "merchantFee" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "minAmount" DECIMAL(14,2),
    "maxAmount" DECIMAL(14,2),
    "features" JSONB NOT NULL DEFAULT '[]',
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nasiya_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasiya_leads" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendorId" TEXT,
    "serviceId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "months" INTEGER NOT NULL,
    "monthlyPayment" DECIMAL(14,2) NOT NULL,
    "totalPayment" DECIMAL(14,2) NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "NasiyaStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nasiya_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nasiya_providers_slug_key" ON "nasiya_providers"("slug");

-- CreateIndex
CREATE INDEX "nasiya_leads_userId_idx" ON "nasiya_leads"("userId");

-- CreateIndex
CREATE INDEX "nasiya_leads_status_idx" ON "nasiya_leads"("status");

-- AddForeignKey
ALTER TABLE "nasiya_leads" ADD CONSTRAINT "nasiya_leads_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "nasiya_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasiya_leads" ADD CONSTRAINT "nasiya_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

