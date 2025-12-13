-- CreateTable
CREATE TABLE "MemberLoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "returnTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberLoginToken_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "walletAddress" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'STARTER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Member" ("address", "createdAt", "email", "firstName", "id", "lastName", "phone", "updatedAt", "walletAddress") SELECT "address", "createdAt", "email", "firstName", "id", "lastName", "phone", "updatedAt", "walletAddress" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
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
    "payoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutWalletAddress" TEXT,
    "payoutWalletEncrypted" TEXT,
    "payoutMilestonePoints" INTEGER NOT NULL DEFAULT 100,
    "payoutAmountUSD" REAL NOT NULL DEFAULT 5.0,
    "payoutNetwork" TEXT NOT NULL DEFAULT 'polygon',
    "lastBalanceCheck" DATETIME,
    "usdcBalance" REAL,
    "lowBalanceAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Merchant" ("accentColor", "createdAt", "earnPerVisit", "id", "loginEmail", "name", "passwordHash", "plan", "primaryColor", "slug", "tagline", "updatedAt", "vipThreshold", "welcomePoints") SELECT "accentColor", "createdAt", "earnPerVisit", "id", "loginEmail", "name", "passwordHash", "plan", "primaryColor", "slug", "tagline", "updatedAt", "vipThreshold", "welcomePoints" FROM "Merchant";
DROP TABLE "Merchant";
ALTER TABLE "new_Merchant" RENAME TO "Merchant";
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");
CREATE UNIQUE INDEX "Merchant_loginEmail_key" ON "Merchant"("loginEmail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MemberLoginToken_token_key" ON "MemberLoginToken"("token");
