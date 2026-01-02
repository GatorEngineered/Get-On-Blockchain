// scripts/migrate-to-merchant-members.ts
/**
 * Data Migration Script: BusinessMember points → MerchantMember points
 *
 * This script migrates existing BusinessMember points to the new MerchantMember model
 * for proper multi-location points aggregation.
 *
 * Run AFTER: npx prisma migrate dev
 * Run with: npx tsx scripts/migrate-to-merchant-members.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToMerchantMembers() {
  console.log('🚀 Starting migration: BusinessMember → MerchantMember');
  console.log('================================================\n');

  try {
    // Step 1: Get all BusinessMembers with their associated merchant
    const businessMembers = await prisma.businessMember.findMany({
      include: {
        business: {
          select: {
            merchantId: true,
          },
        },
        member: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(`📊 Found ${businessMembers.length} BusinessMember records to process\n`);

    // Step 2: Group by merchant + member to aggregate points
    const merchantMemberMap = new Map<
      string,
      {
        merchantId: string;
        memberId: string;
        totalPoints: number;
        walletAddress?: string;
        walletNetwork?: string;
        isCustodial?: boolean;
        tier: string;
        businessIds: string[];
      }
    >();

    for (const bm of businessMembers) {
      if (!bm.business.merchantId) {
        console.log(`⚠️  Skipping BusinessMember ${bm.id} - no merchantId`);
        continue;
      }

      const key = `${bm.business.merchantId}-${bm.memberId}`;

      if (merchantMemberMap.has(key)) {
        // Aggregate points from multiple locations
        const existing = merchantMemberMap.get(key)!;
        existing.totalPoints += bm.points || 0;
        existing.businessIds.push(bm.businessId);

        // Use highest tier
        if (bm.tier === 'SUPER' || (bm.tier === 'VIP' && existing.tier === 'BASE')) {
          existing.tier = bm.tier;
        }

        console.log(
          `  ↪️  Aggregating: ${bm.member.email} at merchant ${bm.business.merchantId} - Added ${bm.points} points (Total: ${existing.totalPoints})`
        );
      } else {
        // First location for this merchant-member combo
        merchantMemberMap.set(key, {
          merchantId: bm.business.merchantId,
          memberId: bm.memberId,
          totalPoints: bm.points || 0,
          walletAddress: bm.walletAddress || undefined,
          walletNetwork: bm.walletNetwork || undefined,
          isCustodial: bm.isCustodial || undefined,
          tier: bm.tier || 'BASE',
          businessIds: [bm.businessId],
        });

        console.log(
          `  ✨ New: ${bm.member.email} at merchant ${bm.business.merchantId} - ${bm.points} points`
        );
      }
    }

    console.log(`\n📦 Created ${merchantMemberMap.size} MerchantMember records (aggregated)\n`);

    // Step 3: Create MerchantMember records
    let created = 0;
    let skipped = 0;

    for (const [key, data] of merchantMemberMap.entries()) {
      try {
        // Check if MerchantMember already exists
        const existing = await prisma.merchantMember.findUnique({
          where: {
            merchantId_memberId: {
              merchantId: data.merchantId,
              memberId: data.memberId,
            },
          },
        });

        if (existing) {
          console.log(`  ⏭️  Skipping: MerchantMember already exists for ${key}`);
          skipped++;
          continue;
        }

        await prisma.merchantMember.create({
          data: {
            merchantId: data.merchantId,
            memberId: data.memberId,
            points: data.totalPoints,
            tier: data.tier,
            walletAddress: data.walletAddress,
            walletNetwork: data.walletNetwork,
            isCustodial: data.isCustodial,
          },
        });

        created++;
        console.log(
          `  ✅ Created: MerchantMember ${key} with ${data.totalPoints} points (from ${data.businessIds.length} locations)`
        );
      } catch (error: any) {
        console.error(`  ❌ Error creating MerchantMember for ${key}:`, error.message);
      }
    }

    console.log('\n================================================');
    console.log(`✅ Migration complete!`);
    console.log(`   Created: ${created} MerchantMember records`);
    console.log(`   Skipped: ${skipped} (already existed)`);
    console.log(`   Total BusinessMembers processed: ${businessMembers.length}`);
    console.log('================================================\n');

    console.log('⚠️  IMPORTANT: Update your APIs to use MerchantMember.points');
    console.log('   Files to update:');
    console.log('   - src/app/api/member/scan/route.ts');
    console.log('   - src/app/api/member/claim-payout/route.ts');
    console.log('   - src/app/api/member/dashboard/route.ts');
    console.log('   - src/app/api/merchant/members/[id]/adjust-points/route.ts\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToMerchantMembers()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
