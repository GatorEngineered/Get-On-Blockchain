-- Add email notification tracking fields to Merchant table
PRAGMA foreign_keys=OFF;

-- Add new columns to Merchant table
ALTER TABLE "Merchant" ADD COLUMN "lowBalanceThreshold" REAL NOT NULL DEFAULT 50.0;
ALTER TABLE "Merchant" ADD COLUMN "notificationEmail" TEXT;

PRAGMA foreign_keys=ON;

-- Note: EventType enum values (EMAIL_SENT, LOW_BALANCE_ALERT, PAYOUT_SUCCESS_NOTIFY)
-- are enforced at the application level in Prisma, not at the database level in SQLite
