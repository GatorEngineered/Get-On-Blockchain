-- AlterTable
ALTER TABLE "Business" ADD COLUMN "locationNickname" TEXT;
ALTER TABLE "Business" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "merchantId" TEXT;

-- CreateIndex
CREATE INDEX "Business_merchantId_idx" ON "Business"("merchantId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
