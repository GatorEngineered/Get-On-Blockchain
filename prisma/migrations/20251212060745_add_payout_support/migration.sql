-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RewardTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessMemberId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "pointsDeducted" INTEGER,
    "usdcAmount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'POINTS',
    "reason" TEXT,
    "txHash" TEXT,
    "walletAddress" TEXT,
    "walletNetwork" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardTransaction_businessMemberId_fkey" FOREIGN KEY ("businessMemberId") REFERENCES "BusinessMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RewardTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RewardTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RewardTransaction" ("amount", "businessId", "businessMemberId", "createdAt", "currency", "id", "memberId", "reason", "txHash", "type", "walletNetwork") SELECT "amount", "businessId", "businessMemberId", "createdAt", "currency", "id", "memberId", "reason", "txHash", "type", "walletNetwork" FROM "RewardTransaction";
DROP TABLE "RewardTransaction";
ALTER TABLE "new_RewardTransaction" RENAME TO "RewardTransaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
