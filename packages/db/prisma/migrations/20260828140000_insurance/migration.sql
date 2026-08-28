-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('OSAGO', 'KASKO', 'TRAVEL', 'PROPERTY', 'ACCIDENT', 'HEALTH');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "policyId" TEXT;

-- CreateTable
CREATE TABLE "insurers" (
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

    CONSTRAINT "insurers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_products" (
    "id" TEXT NOT NULL,
    "insurerId" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "tariff" JSONB NOT NULL DEFAULT '{}',
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "priceFrom" DECIMAL(14,2),
    "coverageFrom" DECIMAL(16,2),
    "features" JSONB NOT NULL DEFAULT '[]',
    "termsMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'PENDING',
    "params" JSONB NOT NULL DEFAULT '{}',
    "premium" DECIMAL(14,2) NOT NULL,
    "insuredSum" DECIMAL(16,2) NOT NULL,
    "commissionAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "breakdown" JSONB NOT NULL DEFAULT '[]',
    "termMonths" INTEGER NOT NULL DEFAULT 12,
    "policyNumber" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurers_slug_key" ON "insurers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_products_slug_key" ON "insurance_products"("slug");

-- CreateIndex
CREATE INDEX "insurance_products_type_idx" ON "insurance_products"("type");

-- CreateIndex
CREATE INDEX "insurance_products_insurerId_idx" ON "insurance_products"("insurerId");

-- CreateIndex
CREATE INDEX "insurance_products_active_idx" ON "insurance_products"("active");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_policyNumber_key" ON "insurance_policies"("policyNumber");

-- CreateIndex
CREATE INDEX "insurance_policies_userId_idx" ON "insurance_policies"("userId");

-- CreateIndex
CREATE INDEX "insurance_policies_status_idx" ON "insurance_policies"("status");

-- CreateIndex
CREATE INDEX "insurance_policies_type_idx" ON "insurance_policies"("type");

-- CreateIndex
CREATE UNIQUE INDEX "payments_policyId_key" ON "payments"("policyId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "insurance_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_products" ADD CONSTRAINT "insurance_products_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "insurers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_productId_fkey" FOREIGN KEY ("productId") REFERENCES "insurance_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
