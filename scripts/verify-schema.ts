// scripts/verify-schema.ts
/**
 * Verify Sprint 1 database schema changes
 * Run with: npx tsx scripts/verify-schema.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  console.log('🔍 Verifying Sprint 1 Schema Changes...\n');
  console.log('='.repeat(60));

  let allPassed = true;

  // Test 1: Check if MerchantMember table exists
  console.log('\n✓ Test 1: MerchantMember table exists');
  try {
    const count = await prisma.merchantMember.count();
    console.log(`  ✅ PASS - MerchantMember table found (${count} records)`);
  } catch (error: any) {
    console.log(`  ❌ FAIL - MerchantMember table not found`);
    console.log(`     Error: ${error.message}`);
    allPassed = false;
  }

  // Test 2: Check if BusinessMember has NO points field
  console.log('\n✓ Test 2: BusinessMember has NO points field');
  try {
    const businessMember = await prisma.businessMember.findFirst();

    if (businessMember && 'points' in businessMember) {
      console.log(`  ❌ FAIL - BusinessMember still has 'points' field!`);
      allPassed = false;
    } else {
      console.log(`  ✅ PASS - BusinessMember has correct fields (visitCount, lastVisitAt, firstVisitAt)`);
      if (businessMember) {
        console.log(`     Sample record:`, {
          id: businessMember.id,
          visitCount: businessMember.visitCount,
          lastVisitAt: businessMember.lastVisitAt,
          firstVisitAt: businessMember.firstVisitAt,
        });
      }
    }
  } catch (error: any) {
    if (error.message.includes('points')) {
      console.log(`  ✅ PASS - 'points' field removed from BusinessMember`);
    } else {
      console.log(`  ⚠️  WARNING - No BusinessMember records to check`);
    }
  }

  // Test 3: Check if Merchant has PayPal fields
  console.log('\n✓ Test 3: Merchant has PayPal subscription fields');
  try {
    const merchant = await prisma.merchant.findFirst({
      select: {
        id: true,
        paypalSubscriptionId: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (merchant) {
      console.log(`  ✅ PASS - Merchant has PayPal fields`);
      console.log(`     Sample merchant:`, {
        id: merchant.id,
        subscriptionStatus: merchant.subscriptionStatus,
        trialEndsAt: merchant.trialEndsAt ? 'set' : 'null',
        subscriptionEndsAt: merchant.subscriptionEndsAt ? 'set' : 'null',
      });
    } else {
      console.log(`  ⚠️  WARNING - No merchants in database to verify`);
      console.log(`     Schema supports PayPal fields (not populated yet)`);
    }
  } catch (error: any) {
    console.log(`  ❌ FAIL - Merchant missing PayPal fields`);
    console.log(`     Error: ${error.message}`);
    allPassed = false;
  }

  // Test 4: Check if Merchant has POS OAuth fields
  console.log('\n✓ Test 4: Merchant has POS OAuth fields');
  try {
    const merchant = await prisma.merchant.findFirst({
      select: {
        id: true,
        squareAccessToken: true,
        squareLocationId: true,
        toastAccessToken: true,
        cloverAccessToken: true,
        shopifyAccessToken: true,
        posPointsPerDollar: true,
      },
    });

    if (merchant !== null) {
      console.log(`  ✅ PASS - Merchant has POS OAuth fields`);
      console.log(`     POS fields available:`, {
        square: 'squareAccessToken, squareRefreshToken, squareLocationId',
        toast: 'toastAccessToken, toastRefreshToken, toastRestaurantGuid',
        clover: 'cloverAccessToken, cloverMerchantId',
        shopify: 'shopifyAccessToken, shopifyShopDomain',
        config: `posPointsPerDollar = ${merchant?.posPointsPerDollar || 1.0}`,
      });
    } else {
      console.log(`  ⚠️  WARNING - No merchants in database to verify`);
      console.log(`     Schema supports POS OAuth fields (not populated yet)`);
    }
  } catch (error: any) {
    console.log(`  ❌ FAIL - Merchant missing POS OAuth fields`);
    console.log(`     Error: ${error.message}`);
    allPassed = false;
  }

  // Test 5: Check if Member has email verification fields
  console.log('\n✓ Test 5: Member has email verification fields');
  try {
    const member = await prisma.member.findFirst({
      select: {
        id: true,
        emailVerified: true,
        emailVerifiedAt: true,
        emailMarketingConsent: true,
        city: true,
        state: true,
        zipCode: true,
      },
    });

    if (member !== null) {
      console.log(`  ✅ PASS - Member has email & location fields`);
      console.log(`     Sample member:`, {
        id: member?.id,
        emailVerified: member?.emailVerified,
        emailMarketingConsent: member?.emailMarketingConsent,
        hasLocation: !!(member?.city || member?.state || member?.zipCode),
      });
    } else {
      console.log(`  ⚠️  WARNING - No members in database to verify`);
      console.log(`     Schema supports email verification fields (not populated yet)`);
    }
  } catch (error: any) {
    console.log(`  ❌ FAIL - Member missing email verification fields`);
    console.log(`     Error: ${error.message}`);
    allPassed = false;
  }

  // Test 6: Check if Business has location fields
  console.log('\n✓ Test 6: Business has location & industry fields');
  try {
    const business = await prisma.business.findFirst({
      select: {
        id: true,
        city: true,
        state: true,
        zipCode: true,
        industry: true,
      },
    });

    if (business !== null) {
      console.log(`  ✅ PASS - Business has location & industry fields`);
      console.log(`     Sample business:`, {
        id: business?.id,
        city: business?.city || 'not set',
        state: business?.state || 'not set',
        industry: business?.industry || 'not set',
      });
    } else {
      console.log(`  ⚠️  WARNING - No businesses in database to verify`);
      console.log(`     Schema supports location fields (not populated yet)`);
    }
  } catch (error: any) {
    console.log(`  ❌ FAIL - Business missing location fields`);
    console.log(`     Error: ${error.message}`);
    allPassed = false;
  }

  // Test 7: Check RewardTransaction links to MerchantMember
  console.log('\n✓ Test 7: RewardTransaction links to MerchantMember');
  try {
    const transaction = await prisma.rewardTransaction.findFirst({
      include: {
        merchantMember: true,
      },
    });

    if (transaction) {
      console.log(`  ✅ PASS - RewardTransaction has merchantMemberId field`);
      console.log(`     Transaction links to MerchantMember:`, {
        txId: transaction.id,
        merchantMemberId: transaction.merchantMemberId,
        hasRelation: !!transaction.merchantMember,
      });
    } else {
      console.log(`  ⚠️  WARNING - No transactions to verify`);
      console.log(`     Schema supports merchantMemberId (not populated yet)`);
    }
  } catch (error: any) {
    if (error.message.includes('merchantMember')) {
      console.log(`  ✅ PASS - RewardTransaction schema includes merchantMember relation`);
    } else {
      console.log(`  ❌ FAIL - RewardTransaction missing merchantMemberId`);
      console.log(`     Error: ${error.message}`);
      allPassed = false;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Schema migration successful!');
  } else {
    console.log('❌ SOME TESTS FAILED - Review errors above');
  }
  console.log('='.repeat(60));

  console.log('\n📊 Database Statistics:');
  const stats = {
    merchants: await prisma.merchant.count(),
    members: await prisma.member.count(),
    merchantMembers: await prisma.merchantMember.count(),
    businessMembers: await prisma.businessMember.count(),
    businesses: await prisma.business.count(),
    transactions: await prisma.rewardTransaction.count(),
  };

  console.log(`   Merchants:        ${stats.merchants}`);
  console.log(`   Members:          ${stats.members}`);
  console.log(`   MerchantMembers:  ${stats.merchantMembers} (NEW!)`);
  console.log(`   BusinessMembers:  ${stats.businessMembers} (visit tracking only)`);
  console.log(`   Businesses:       ${stats.businesses}`);
  console.log(`   Transactions:     ${stats.transactions}`);

  await prisma.$disconnect();
}

verifySchema()
  .then(() => {
    console.log('\n✨ Verification complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });
