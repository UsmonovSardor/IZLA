-- CreateEnum
CREATE TYPE "LeadDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'BLOCKED');

-- AlterTable
ALTER TABLE "insurance_policies" ADD COLUMN     "billedAmount" DECIMAL(14,2),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "delivery" "LeadDeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "mortgage_leads" ADD COLUMN     "billedAmount" DECIMAL(14,2),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "delivery" "LeadDeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "nasiya_leads" ADD COLUMN     "billedAmount" DECIMAL(14,2),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "delivery" "LeadDeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "partnerId" TEXT;

-- CreateIndex
CREATE INDEX "insurance_policies_partnerId_idx" ON "insurance_policies"("partnerId");

-- CreateIndex
CREATE INDEX "mortgage_leads_partnerId_idx" ON "mortgage_leads"("partnerId");

-- CreateIndex
CREATE INDEX "nasiya_leads_partnerId_idx" ON "nasiya_leads"("partnerId");

