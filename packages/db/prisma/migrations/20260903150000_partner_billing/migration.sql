-- CreateEnum
CREATE TYPE "PartnerBillingStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "invoiceId" TEXT;

-- AlterTable
ALTER TABLE "partner_accounts" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "billingStatus" "PartnerBillingStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "gracePeriodEnds" TIMESTAMP(3),
ADD COLUMN     "lastDunningStage" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "periodLabel" TEXT,
ADD COLUMN     "plan" "PartnerPlan";

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoiceId_key" ON "payments"("invoiceId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

