-- CreateEnum
CREATE TYPE "PartnerPlan" AS ENUM ('FREE', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PartnerMemberRole" AS ENUM ('OWNER', 'MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "LedgerKind" AS ENUM ('CREDIT', 'DEBIT');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PARTNER';

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "insurers" ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "banks" ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "nasiya_providers" ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "partner_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "color" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "plan" "PartnerPlan" NOT NULL DEFAULT 'FREE',
    "planActivatedAt" TIMESTAMP(3),
    "planExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_members" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PartnerMemberRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_wallets" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "kind" "LedgerKind" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "balanceAfter" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "lines" JSONB NOT NULL DEFAULT '[]',
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_accounts_slug_key" ON "partner_accounts"("slug");

-- CreateIndex
CREATE INDEX "partner_accounts_status_idx" ON "partner_accounts"("status");

-- CreateIndex
CREATE INDEX "partner_accounts_plan_idx" ON "partner_accounts"("plan");

-- CreateIndex
CREATE INDEX "partner_members_userId_idx" ON "partner_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_members_partnerId_userId_key" ON "partner_members"("partnerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_wallets_partnerId_key" ON "partner_wallets"("partnerId");

-- CreateIndex
CREATE INDEX "ledger_entries_partnerId_idx" ON "ledger_entries"("partnerId");

-- CreateIndex
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_partnerId_idx" ON "invoices"("partnerId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "vendors_partnerId_idx" ON "vendors"("partnerId");

-- CreateIndex
CREATE INDEX "insurers_partnerId_idx" ON "insurers"("partnerId");

-- CreateIndex
CREATE INDEX "banks_partnerId_idx" ON "banks"("partnerId");

-- CreateIndex
CREATE INDEX "nasiya_providers_partnerId_idx" ON "nasiya_providers"("partnerId");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partner_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurers" ADD CONSTRAINT "insurers_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partner_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partner_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasiya_providers" ADD CONSTRAINT "nasiya_providers_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partner_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_members" ADD CONSTRAINT "partner_members_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partner_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_members" ADD CONSTRAINT "partner_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_wallets" ADD CONSTRAINT "partner_wallets_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partner_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partner_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partner_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

