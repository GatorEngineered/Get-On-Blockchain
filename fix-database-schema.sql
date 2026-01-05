-- Fix database schema for MerchantMember model
-- Run this in Supabase SQL Editor

-- 1. Add suite column to Business table
ALTER TABLE "Business"
ADD COLUMN IF NOT EXISTS "suite" TEXT;

-- 2. Check current MerchantMember structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'MerchantMember'
ORDER BY ordinal_position;

-- 3. Update MerchantMember table structure
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'MerchantMember' AND column_name = 'points') THEN
        ALTER TABLE "MerchantMember" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'MerchantMember' AND column_name = 'tier') THEN
        ALTER TABLE "MerchantMember" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'BASE';
    END IF;

    -- Migrate data from old columns to new ones if old columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'MerchantMember' AND column_name = 'pointsBalance') THEN
        UPDATE "MerchantMember" SET "points" = "pointsBalance";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'MerchantMember' AND column_name = 'currentTier') THEN
        UPDATE "MerchantMember" SET "tier" = "currentTier";
    END IF;

    -- Drop old columns
    ALTER TABLE "MerchantMember" DROP COLUMN IF EXISTS "pointsBalance";
    ALTER TABLE "MerchantMember" DROP COLUMN IF EXISTS "currentTier";
    ALTER TABLE "MerchantMember" DROP COLUMN IF EXISTS "visitCount";
    ALTER TABLE "MerchantMember" DROP COLUMN IF EXISTS "totalPointsEarned";
    ALTER TABLE "MerchantMember" DROP COLUMN IF EXISTS "lastVisitAt";
END $$;

-- 4. Verify final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'MerchantMember'
ORDER BY ordinal_position;

-- 5. Check data
SELECT id, "merchantId", "memberId", points, tier, "createdAt", "updatedAt"
FROM "MerchantMember"
LIMIT 5;
