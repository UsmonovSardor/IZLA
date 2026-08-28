
-- CreateEnum
CREATE TYPE "VendorPlan" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "plan" "VendorPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planActivatedAt" TIMESTAMP(3),
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "commissionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "netAmount" DECIMAL(12,2);

