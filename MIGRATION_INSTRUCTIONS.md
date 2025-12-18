# Database Migration Instructions

 

## Schema Updates Added

 

I've updated the Prisma schema with email notification tracking:

 

### New EventType Enum Values:

- `EMAIL_SENT` - Email notification sent

- `LOW_BALANCE_ALERT` - Low wallet balance alert

- `PAYOUT_SUCCESS_NOTIFY` - Payout success notification

 

### New Merchant Fields:

- `lowBalanceThreshold` (Float, default: 50.0) - Alert when balance falls below this amount

- `notificationEmail` (String, optional) - Email for alerts (defaults to loginEmail if not set)

 

## How to Apply Migration

 

Run this command in your local environment:

 

```bash

npx prisma migrate dev --name add-email-notification-tracking

```

 

Or if that migration already exists (I created it manually), just run:

 

```bash

npx prisma generate

npx prisma db push

```

 

## Manual Migration (if needed)

 

If automatic migration fails, you can apply manually:

 

```bash

sqlite3 prisma/dev.db < prisma/migrations/20251213092400_add_email_notification_tracking/migration.sql

```

 

Or for production PostgreSQL:

 

```sql

ALTER TABLE "Merchant" ADD COLUMN "lowBalanceThreshold" REAL NOT NULL DEFAULT 50.0;

ALTER TABLE "Merchant" ADD COLUMN "notificationEmail" TEXT;

```

 

## Verify Migration

 

After running, verify with:

 

```bash

npx prisma studio

```

 

Check that the `Merchant` table has the new columns.

 