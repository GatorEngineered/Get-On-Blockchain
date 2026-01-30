// src/app/api/merchant/settings/special-rewards/route.ts
// Get and update birthday/member anniversary/relationship anniversary reward settings for merchants

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * GET /api/merchant/settings/special-rewards
 *
 * Fetch merchant's birthday and anniversary reward settings
 */
export async function GET() {
  try {
    // Get merchant session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch merchant special rewards settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        birthdayRewardEnabled: true,
        birthdayRewardPoints: true,
        birthdayRewardWindowDays: true,
        birthdayRewardId: true,
        memberAnniversaryRewardEnabled: true,
        memberAnniversaryRewardPoints: true,
        memberAnniversaryRewardWindowDays: true,
        memberAnniversaryRewardId: true,
        relationshipAnniversaryRewardEnabled: true,
        relationshipAnniversaryRewardPoints: true,
        relationshipAnniversaryRewardWindowDays: true,
        relationshipAnniversaryRewardId: true,
      },
    });

    // Fetch available rewards for selection
    const availableRewards = await prisma.reward.findMany({
      where: {
        merchantId,
        isActive: true,
        rewardType: 'TRADITIONAL', // Only traditional rewards (not USDC payouts)
      },
      select: {
        id: true,
        name: true,
        description: true,
        pointsCost: true,
      },
      orderBy: { name: 'asc' },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get claim statistics
    const currentYear = new Date().getFullYear();

    const [birthdayClaims, memberAnniversaryClaims, relationshipAnniversaryClaims] = await Promise.all([
      prisma.merchantMember.count({
        where: {
          merchantId,
          lastBirthdayClaimYear: currentYear,
        },
      }),
      prisma.merchantMember.count({
        where: {
          merchantId,
          lastMemberAnniversaryClaimYear: currentYear,
        },
      }),
      prisma.merchantMember.count({
        where: {
          merchantId,
          lastRelationshipAnniversaryClaimYear: currentYear,
        },
      }),
    ]);

    return NextResponse.json({
      birthday: {
        enabled: merchant.birthdayRewardEnabled,
        points: merchant.birthdayRewardPoints,
        windowDays: merchant.birthdayRewardWindowDays,
        rewardId: merchant.birthdayRewardId,
        claimsThisYear: birthdayClaims,
      },
      memberAnniversary: {
        enabled: merchant.memberAnniversaryRewardEnabled,
        points: merchant.memberAnniversaryRewardPoints,
        windowDays: merchant.memberAnniversaryRewardWindowDays,
        rewardId: merchant.memberAnniversaryRewardId,
        claimsThisYear: memberAnniversaryClaims,
      },
      relationshipAnniversary: {
        enabled: merchant.relationshipAnniversaryRewardEnabled,
        points: merchant.relationshipAnniversaryRewardPoints,
        windowDays: merchant.relationshipAnniversaryRewardWindowDays,
        rewardId: merchant.relationshipAnniversaryRewardId,
        claimsThisYear: relationshipAnniversaryClaims,
      },
      availableRewards, // List of rewards that can be selected for special occasions
    });
  } catch (error: any) {
    console.error('[Special Rewards Settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch special rewards settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/merchant/settings/special-rewards
 *
 * Update merchant's birthday and anniversary reward settings
 */
export async function PUT(req: NextRequest) {
  try {
    // Get merchant session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const {
      // Birthday
      birthdayRewardEnabled,
      birthdayRewardPoints,
      birthdayRewardWindowDays,
      birthdayRewardId,
      // Member Anniversary
      memberAnniversaryRewardEnabled,
      memberAnniversaryRewardPoints,
      memberAnniversaryRewardWindowDays,
      memberAnniversaryRewardId,
      // Relationship Anniversary
      relationshipAnniversaryRewardEnabled,
      relationshipAnniversaryRewardPoints,
      relationshipAnniversaryRewardWindowDays,
      relationshipAnniversaryRewardId,
    } = body;

    // Build update data (only include fields that are provided)
    const updateData: any = {};

    // Birthday settings
    if (typeof birthdayRewardEnabled === 'boolean') {
      updateData.birthdayRewardEnabled = birthdayRewardEnabled;
    }

    if (typeof birthdayRewardPoints === 'number') {
      if (birthdayRewardPoints < 1 || birthdayRewardPoints > 10000) {
        return NextResponse.json(
          { error: 'Birthday reward points must be between 1 and 10000' },
          { status: 400 }
        );
      }
      updateData.birthdayRewardPoints = birthdayRewardPoints;
    }

    if (typeof birthdayRewardWindowDays === 'number') {
      if (birthdayRewardWindowDays < 1 || birthdayRewardWindowDays > 30) {
        return NextResponse.json(
          { error: 'Birthday reward window must be between 1 and 30 days' },
          { status: 400 }
        );
      }
      updateData.birthdayRewardWindowDays = birthdayRewardWindowDays;
    }

    // Birthday reward selection (can be null to remove, or a valid reward ID)
    if (birthdayRewardId !== undefined) {
      if (birthdayRewardId === null || birthdayRewardId === '') {
        updateData.birthdayRewardId = null;
      } else {
        // Verify reward belongs to this merchant
        const reward = await prisma.reward.findFirst({
          where: { id: birthdayRewardId, merchantId },
        });
        if (!reward) {
          return NextResponse.json(
            { error: 'Invalid birthday reward selection' },
            { status: 400 }
          );
        }
        updateData.birthdayRewardId = birthdayRewardId;
      }
    }

    // Member Anniversary settings
    if (typeof memberAnniversaryRewardEnabled === 'boolean') {
      updateData.memberAnniversaryRewardEnabled = memberAnniversaryRewardEnabled;
    }

    if (typeof memberAnniversaryRewardPoints === 'number') {
      if (memberAnniversaryRewardPoints < 1 || memberAnniversaryRewardPoints > 10000) {
        return NextResponse.json(
          { error: 'Member anniversary reward points must be between 1 and 10000' },
          { status: 400 }
        );
      }
      updateData.memberAnniversaryRewardPoints = memberAnniversaryRewardPoints;
    }

    if (typeof memberAnniversaryRewardWindowDays === 'number') {
      if (memberAnniversaryRewardWindowDays < 1 || memberAnniversaryRewardWindowDays > 30) {
        return NextResponse.json(
          { error: 'Member anniversary reward window must be between 1 and 30 days' },
          { status: 400 }
        );
      }
      updateData.memberAnniversaryRewardWindowDays = memberAnniversaryRewardWindowDays;
    }

    // Member anniversary reward selection
    if (memberAnniversaryRewardId !== undefined) {
      if (memberAnniversaryRewardId === null || memberAnniversaryRewardId === '') {
        updateData.memberAnniversaryRewardId = null;
      } else {
        const reward = await prisma.reward.findFirst({
          where: { id: memberAnniversaryRewardId, merchantId },
        });
        if (!reward) {
          return NextResponse.json(
            { error: 'Invalid member anniversary reward selection' },
            { status: 400 }
          );
        }
        updateData.memberAnniversaryRewardId = memberAnniversaryRewardId;
      }
    }

    // Relationship Anniversary settings
    if (typeof relationshipAnniversaryRewardEnabled === 'boolean') {
      updateData.relationshipAnniversaryRewardEnabled = relationshipAnniversaryRewardEnabled;
    }

    if (typeof relationshipAnniversaryRewardPoints === 'number') {
      if (relationshipAnniversaryRewardPoints < 1 || relationshipAnniversaryRewardPoints > 10000) {
        return NextResponse.json(
          { error: 'Relationship anniversary reward points must be between 1 and 10000' },
          { status: 400 }
        );
      }
      updateData.relationshipAnniversaryRewardPoints = relationshipAnniversaryRewardPoints;
    }

    if (typeof relationshipAnniversaryRewardWindowDays === 'number') {
      if (relationshipAnniversaryRewardWindowDays < 1 || relationshipAnniversaryRewardWindowDays > 30) {
        return NextResponse.json(
          { error: 'Relationship anniversary reward window must be between 1 and 30 days' },
          { status: 400 }
        );
      }
      updateData.relationshipAnniversaryRewardWindowDays = relationshipAnniversaryRewardWindowDays;
    }

    // Relationship anniversary reward selection
    if (relationshipAnniversaryRewardId !== undefined) {
      if (relationshipAnniversaryRewardId === null || relationshipAnniversaryRewardId === '') {
        updateData.relationshipAnniversaryRewardId = null;
      } else {
        const reward = await prisma.reward.findFirst({
          where: { id: relationshipAnniversaryRewardId, merchantId },
        });
        if (!reward) {
          return NextResponse.json(
            { error: 'Invalid relationship anniversary reward selection' },
            { status: 400 }
          );
        }
        updateData.relationshipAnniversaryRewardId = relationshipAnniversaryRewardId;
      }
    }

    // Update merchant settings
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        birthdayRewardEnabled: true,
        birthdayRewardPoints: true,
        birthdayRewardWindowDays: true,
        birthdayRewardId: true,
        memberAnniversaryRewardEnabled: true,
        memberAnniversaryRewardPoints: true,
        memberAnniversaryRewardWindowDays: true,
        memberAnniversaryRewardId: true,
        relationshipAnniversaryRewardEnabled: true,
        relationshipAnniversaryRewardPoints: true,
        relationshipAnniversaryRewardWindowDays: true,
        relationshipAnniversaryRewardId: true,
      },
    });

    console.log(`[Special Rewards Settings] Updated settings for merchant ${merchantId}`);

    return NextResponse.json({
      success: true,
      birthday: {
        enabled: merchant.birthdayRewardEnabled,
        points: merchant.birthdayRewardPoints,
        windowDays: merchant.birthdayRewardWindowDays,
        rewardId: merchant.birthdayRewardId,
      },
      memberAnniversary: {
        enabled: merchant.memberAnniversaryRewardEnabled,
        points: merchant.memberAnniversaryRewardPoints,
        windowDays: merchant.memberAnniversaryRewardWindowDays,
        rewardId: merchant.memberAnniversaryRewardId,
      },
      relationshipAnniversary: {
        enabled: merchant.relationshipAnniversaryRewardEnabled,
        points: merchant.relationshipAnniversaryRewardPoints,
        windowDays: merchant.relationshipAnniversaryRewardWindowDays,
        rewardId: merchant.relationshipAnniversaryRewardId,
      },
    });
  } catch (error: any) {
    console.error('[Special Rewards Settings PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update special rewards settings', details: error.message },
      { status: 500 }
    );
  }
}
