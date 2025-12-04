/*
  Warnings:

  - Added the required column `loginEmail` to the `Merchant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Merchant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "RewardTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessMemberId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'POINTS',
    "reason" TEXT,
    "txHash" TEXT,
    "walletNetwork" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardTransaction_businessMemberId_fkey" FOREIGN KEY ("businessMemberId") REFERENCES "BusinessMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RewardTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RewardTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Merchant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "loginEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "welcomePoints" INTEGER NOT NULL DEFAULT 10,
    "earnPerVisit" INTEGER NOT NULL DEFAULT 10,
    "vipThreshold" INTEGER NOT NULL DEFAULT 100,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Merchant" ("accentColor", "createdAt", "earnPerVisit", "id", "name", "plan", "primaryColor", "slug", "tagline", "updatedAt", "vipThreshold", "welcomePoints") SELECT "accentColor", "createdAt", "earnPerVisit", "id", "name", "plan", "primaryColor", "slug", "tagline", "updatedAt", "vipThreshold", "welcomePoints" FROM "Merchant";
DROP TABLE "Merchant";
ALTER TABLE "new_Merchant" RENAME TO "Merchant";
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");
CREATE UNIQUE INDEX "Merchant_loginEmail_key" ON "Merchant"("loginEmail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
