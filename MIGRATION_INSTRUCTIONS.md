# 🚀 SPRINT 1 - Migration Instructions

## Multi-Location Points Aggregation + PayPal Integration

### Overview
This migration adds:
1. **Merchant-level points** - Members earn points across ALL merchant locations (aggregated)
2. **PayPal subscription fields** - Enable payment processing
3. **Email verification** - GDPR-compliant email consent
4. **POS OAuth storage** - Secure credential storage for Square, Toast, Clover, Shopify
5. **Location filtering** - State/city/industry fields for merchant directory

---

## 📋 Pre-Migration Checklist

- [ ] Backup current database: `cp prisma/dev.db prisma/dev.db.backup`
- [ ] Commit all changes: `git add . && git commit -m "Pre-migration checkpoint"`
- [ ] Install dependencies: `npm install tsx -D`
- [ ] Review schema changes: `git diff prisma/schema.prisma`

---

## 🔧 Migration Steps

### Step 1: Generate Prisma Client
```bash
cd getonblockchain
npx prisma generate
```

### Step 2: Create Migration
```bash
npx prisma migrate dev --name sprint1_multi_location_and_paypal
```

⚠️ **Expected Issues:**
- Foreign key constraint errors on RewardTransaction
- Cannot drop BusinessMember.points with existing data

**If migration fails**, follow "Manual Migration" below.

---

## 🛠️ Manual Migration (If Auto-Migration Fails)

### Option 1: Reset Database (Development Only - DELETES ALL DATA)
```bash
npx prisma migrate reset
# Type 'y' to confirm
npx prisma migrate dev
```

### Option 2: Step-by-Step Migration (Preserves Data)

**Step 2a: Create migration without applying**
```bash
npx prisma migrate dev --create-only --name sprint1_part1
```

**Step 2b: Edit the generated SQL file**

The migration file will be at: `prisma/migrations/<timestamp>_sprint1_part1/migration.sql`

Add this at the top to handle constraints:
```sql
PRAGMA foreign_keys=off;

-- Add MerchantMember table
CREATE TABLE "MerchantMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'BASE',
    "walletAddress" TEXT,
    "walletNetwork" TEXT,
    "isCustodial" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MerchantMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MerchantMember_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MerchantMember_merchantId_memberId_key" ON "MerchantMember"("merchantId", "memberId");
CREATE INDEX "MerchantMember_merchantId_idx" ON "MerchantMember"("merchantId");
CREATE INDEX "MerchantMember_memberId_idx" ON "MerchantMember"("memberId");

-- Add new Merchant fields
ALTER TABLE "Merchant" ADD COLUMN "paypalSubscriptionId" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL';
ALTER TABLE "Merchant" ADD COLUMN "trialEndsAt" DATETIME;
ALTER TABLE "Merchant" ADD COLUMN "subscriptionEndsAt" DATETIME;
ALTER TABLE "Merchant" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT 0;

-- POS Integration fields
ALTER TABLE "Merchant" ADD COLUMN "squareAccessToken" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "squareRefreshToken" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "squareLocationId" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "toastAccessToken" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "toastRefreshToken" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "toastRestaurantGuid" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "cloverAccessToken" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "cloverMerchantId" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "shopifyAccessToken" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "shopifyShopDomain" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "posPointsPerDollar" REAL NOT NULL DEFAULT 1.0;

-- Add Member email fields
ALTER TABLE "Member" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "Member" ADD COLUMN "emailMarketingConsent" BOOLEAN NOT NULL DEFAULT 1;
ALTER TABLE "Member" ADD COLUMN "city" TEXT;
ALTER TABLE "Member" ADD COLUMN "state" TEXT;
ALTER TABLE "Member" ADD COLUMN "zipCode" TEXT;

-- Add Business location fields
ALTER TABLE "Business" ADD COLUMN "city" TEXT;
ALTER TABLE "Business" ADD COLUMN "state" TEXT;
ALTER TABLE "Business" ADD COLUMN "zipCode" TEXT;
ALTER TABLE "Business" ADD COLUMN "industry" TEXT;

CREATE INDEX "Business_state_idx" ON "Business"("state");
CREATE INDEX "Business_industry_idx" ON "Business"("industry");

PRAGMA foreign_keys=on;
```

**Step 2c: Apply the migration**
```bash
npx prisma migrate deploy
```

---

### Step 3: Run Data Migration Script
```bash
npx tsx scripts/migrate-to-merchant-members.ts
```

This will:
- ✅ Read all BusinessMember records
- ✅ Group by merchant + member
- ✅ Aggregate points from multiple locations
- ✅ Create MerchantMember records
- ✅ Preserve wallet info and tiers

**Expected Output:**
```
🚀 Starting migration: BusinessMember → MerchantMember
================================================

📊 Found 45 BusinessMember records to process

  ✨ New: user@example.com at merchant abc123 - 50 points
  ↪️  Aggregating: user@example.com at merchant abc123 - Added 30 points (Total: 80)

📦 Created 23 MerchantMember records (aggregated)

================================================
✅ Migration complete!
   Created: 23 MerchantMember records
   Skipped: 0 (already existed)
   Total BusinessMembers processed: 45
================================================
```

---

### Step 4: Update BusinessMember Table

Create second migration to update BusinessMember:

**4a: Update schema.prisma** (already done)
- BusinessMember now tracks visits, not points

**4b: Create migration for BusinessMember changes**
```bash
npx prisma migrate dev --create-only --name sprint1_part2_business_member
```

**4c: Edit the SQL to handle data carefully**

Add to migration SQL:
```sql
-- Rename existing table
ALTER TABLE "BusinessMember" RENAME TO "_BusinessMember_old";

-- Create new BusinessMember table without points
CREATE TABLE "BusinessMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" DATETIME,
    "firstVisitAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessMember_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table
INSERT INTO "BusinessMember" (id, businessId, memberId, visitCount, lastVisitAt, firstVisitAt, createdAt, updatedAt)
SELECT
    id,
    businessId,
    memberId,
    0 as visitCount,  -- Start fresh for visit counting
    NULL as lastVisitAt,
    createdAt as firstVisitAt,  -- First visit was when they joined
    createdAt,
    datetime('now') as updatedAt
FROM "_BusinessMember_old";

-- Drop old table
DROP TABLE "_BusinessMember_old";

-- Recreate indexes
CREATE UNIQUE INDEX "BusinessMember_businessId_memberId_key" ON "BusinessMember"("businessId", "memberId");
CREATE INDEX "BusinessMember_businessId_idx" ON "BusinessMember"("businessId");
CREATE INDEX "BusinessMember_memberId_idx" ON "BusinessMember"("memberId");
```

**4d: Apply migration**
```bash
npx prisma migrate deploy
```

---

### Step 5: Update RewardTransaction Table

**5a: Create migration**
```bash
npx prisma migrate dev --create-only --name sprint1_part3_reward_transactions
```

**5b: Edit SQL to update foreign keys**

⚠️ **This is complex - handle carefully!**

```sql
PRAGMA foreign_keys=off;

-- Create new RewardTransaction table
CREATE TABLE "_RewardTransaction_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantMemberId" TEXT NOT NULL,
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
    CONSTRAINT "RewardTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RewardTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RewardTransaction_merchantMemberId_fkey" FOREIGN KEY ("merchantMemberId") REFERENCES "MerchantMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate data: link transactions to new MerchantMember records
INSERT INTO "_RewardTransaction_new"
SELECT
    rt.id,
    mm.id as merchantMemberId,  -- Link to MerchantMember
    rt.businessId,
    rt.memberId,
    rt.type,
    rt.amount,
    rt.pointsDeducted,
    rt.usdcAmount,
    rt.currency,
    rt.reason,
    rt.txHash,
    rt.walletAddress,
    rt.walletNetwork,
    rt.status,
    rt.errorMessage,
    rt.createdAt
FROM "RewardTransaction" rt
INNER JOIN "BusinessMember" bm ON rt.businessMemberId = bm.id
INNER JOIN "Business" b ON bm.businessId = b.id
INNER JOIN "MerchantMember" mm ON mm.merchantId = b.merchantId AND mm.memberId = bm.memberId;

-- Drop old table
DROP TABLE "RewardTransaction";

-- Rename new table
ALTER TABLE "_RewardTransaction_new" RENAME TO "RewardTransaction";

-- Recreate indexes
CREATE INDEX "RewardTransaction_merchantMemberId_idx" ON "RewardTransaction"("merchantMemberId");
CREATE INDEX "RewardTransaction_businessId_idx" ON "RewardTransaction"("businessId");
CREATE INDEX "RewardTransaction_memberId_idx" ON "RewardTransaction"("memberId");

PRAGMA foreign_keys=on;
```

**5c: Apply migration**
```bash
npx prisma migrate deploy
```

---

## ✅ Verification

After all migrations complete:

```bash
# Open Prisma Studio
npx prisma studio
```

**Check:**
1. ✅ MerchantMember table exists with aggregated points
2. ✅ BusinessMember table has visitCount but NO points field
3. ✅ RewardTransaction has merchantMemberId field
4. ✅ Merchant has PayPal and POS fields
5. ✅ Member has email verification fields

**Test Multi-Location:**
1. Find a merchant with 2+ businesses in Studio
2. Find a member linked to both
3. Verify member has ONE MerchantMember record (not multiple)
4. Verify points are aggregated total

---

## 🔄 Rollback (If Needed)

If something goes wrong:

```bash
# Restore backup
rm prisma/dev.db
cp prisma/dev.db.backup prisma/dev.db

# Reset Prisma state
npx prisma migrate reset
```

---

## 📝 Post-Migration Tasks

### Update API Routes (CRITICAL - App will break without these!)

**Files that MUST be updated:**

1. **QR Scan** - [src/app/api/member/scan/route.ts](src/app/api/member/scan/route.ts)
   - Change to use MerchantMember.points
   - Add visitCount to BusinessMember

2. **Claim Payout** - [src/app/api/member/claim-payout/route.ts](src/app/api/member/claim-payout/route.ts)
   - Use MerchantMember for point checks
   - Deduct from MerchantMember.points

3. **Member Dashboard** - [src/app/api/member/dashboard/route.ts](src/app/api/member/dashboard/route.ts)
   - Return merchantMembers instead of businesses
   - Show aggregated points

4. **Adjust Points** - [src/app/api/merchant/members/[id]/adjust-points/route.ts](src/app/api/merchant/members/[id]/adjust-points/route.ts)
   - Update MerchantMember.points

**I'll create these updates in the next step!**

---

## 🎯 Success Criteria

Migration is successful when:
- [ ] All migrations applied without errors
- [ ] Data migration script completed
- [ ] Prisma Studio shows correct schema
- [ ] No points lost (total matches before/after)
- [ ] Multi-location points aggregate correctly
- [ ] API routes updated and tested
- [ ] Frontend dashboard shows aggregated points
- [ ] QR scanning adds to MerchantMember.points
- [ ] Payout claims work correctly

---

## ⏱️ Estimated Time

- Schema updates: 5 minutes
- Migration generation: 10 minutes
- Data migration: 5 minutes
- API updates: 30-45 minutes
- Testing: 15 minutes

**Total: ~1 hour**

---

## 🆘 Need Help?

Check status:
```bash
npx prisma migrate status
```

View schema:
```bash
npx prisma studio
```

Reset everything (dev only):
```bash
npx prisma migrate reset
```
