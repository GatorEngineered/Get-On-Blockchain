// src/app/api/member/claim-anniversary/route.ts
// Claim relationship anniversary reward for a merchant

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

async function getMemberIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('gob_member_session');

  if (!session?.value) return null;

  try {
    const sessionData = JSON.parse(session.value);
    return sessionData.memberId || null;
  } catch {
    return null;
  }
}

// Helper to check if anniversary is within window
function isWithinWindow(
  anniversaryDate: Date,
  windowDays: number,
  checkDate: Date = new Date()
): boolean {
  const currentYear = checkDate.getFullYear();
  const month = anniversaryDate.getMonth();
  const day = anniversaryDate.getDate();

  // Create target date for current year
  let targetDate = new Date(currentYear, month, day);

  // Calculate difference in days
  const diffMs = targetDate.getTime() - checkDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // If more than windowDays in the past, it's outside the window
  if (diffDays < -windowDays) {
    return false;
  }

  // Check if within window
  return Math.abs(diffDays) <= windowDays;
}

export async function POST(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { merchantId } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Get member info
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        anniversaryDate: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if member has set their relationship anniversary
    if (!member.anniversaryDate) {
      return NextResponse.json(
        { error: 'Please set your relationship anniversary in your profile settings to claim this reward' },
        { status: 400 }
      );
    }

    // Get merchant settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        relationshipAnniversaryRewardEnabled: true,
        relationshipAnniversaryRewardPoints: true,
        relationshipAnniversaryRewardWindowDays: true,
        relationshipAnniversaryRewardId: true, // Optional reward from catalog
        businesses: {
          select: { id: true },
          take: 1,
        },
      },
    });

    // Fetch optional reward details if configured
    let anniversaryReward: { id: string; name: string; description: string | null } | null = null;
    if (merchant?.relationshipAnniversaryRewardId) {
      anniversaryReward = await prisma.reward.findUnique({
        where: { id: merchant.relationshipAnniversaryRewardId },
        select: { id: true, name: true, description: true },
      });
    }

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.relationshipAnniversaryRewardEnabled) {
      return NextResponse.json(
        { error: 'Relationship anniversary rewards are not enabled for this merchant' },
        { status: 400 }
      );
    }

    // Check if within anniversary window
    const inWindow = isWithinWindow(
      member.anniversaryDate,
      merchant.relationshipAnniversaryRewardWindowDays
    );

    if (!inWindow) {
      return NextResponse.json(
        { error: `Relationship anniversary rewards can only be claimed within ${merchant.relationshipAnniversaryRewardWindowDays} days of your anniversary` },
        { status: 400 }
      );
    }

    // Get or create merchant member relationship
    let merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: { merchantId, memberId },
      },
    });

    if (!merchantMember) {
      // Create merchant member relationship if it doesn't exist
      merchantMember = await prisma.merchantMember.create({
        data: {
          merchantId,
          memberId,
          points: 0,
          tier: 'BASE',
        },
      });
    }

    const currentYear = new Date().getFullYear();

    // Check if already claimed this year
    if (merchantMember.lastRelationshipAnniversaryClaimYear === currentYear) {
      return NextResponse.json(
        { error: 'You have already claimed your relationship anniversary reward for this year' },
        { status: 400 }
      );
    }

    // Award points and mark as claimed
    const newPoints = merchantMember.points + merchant.relationshipAnniversaryRewardPoints;

    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: newPoints,
        lastRelationshipAnniversaryClaimYear: currentYear,
      },
    });

    // Create event log
    await prisma.event.create({
      data: {
        merchantId,
        memberId,
        type: 'RELATIONSHIP_ANNIVERSARY_REWARD',
        metadata: {
          pointsAwarded: merchant.relationshipAnniversaryRewardPoints,
          year: currentYear,
          anniversaryDate: member.anniversaryDate.toISOString(),
          rewardId: anniversaryReward?.id || null,
          rewardName: anniversaryReward?.name || null,
        },
      },
    });

    // Create reward transaction if business exists
    if (merchant.businesses.length > 0) {
      await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          businessId: merchant.businesses[0].id,
          memberId,
          type: 'EARN',
          amount: merchant.relationshipAnniversaryRewardPoints,
          reason: anniversaryReward
            ? `Relationship anniversary reward from ${merchant.name}: ${merchant.relationshipAnniversaryRewardPoints} points + ${anniversaryReward.name}`
            : `Relationship anniversary reward from ${merchant.name}`,
          status: 'SUCCESS',
        },
      });
    }

    // If a free reward is configured, create a redemption record (auto-confirmed)
    let rewardGrant = null;
    if (anniversaryReward && merchant.businesses.length > 0) {
      const redemption = await prisma.redemptionRequest.create({
        data: {
          merchantId,
          memberId,
          businessId: merchant.businesses[0].id,
          rewardId: anniversaryReward.id,
          pointsCost: 0,
          qrCodeHash: crypto.randomUUID(),
          expiresAt: new Date(),
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });
      rewardGrant = {
        rewardId: anniversaryReward.id,
        rewardName: anniversaryReward.name,
        redemptionId: redemption.id,
      };
    }

    // Build response message
    let message = `Happy Anniversary! You've earned ${merchant.relationshipAnniversaryRewardPoints} points from ${merchant.name}!`;
    if (anniversaryReward) {
      message += ` Plus a free ${anniversaryReward.name}!`;
    }

    return NextResponse.json({
      success: true,
      message,
      pointsAwarded: merchant.relationshipAnniversaryRewardPoints,
      totalPoints: newPoints,
      merchantName: merchant.name,
      rewardGrant,
    });
  } catch (error: any) {
    console.error('[Claim Relationship Anniversary] Error:', error);
    return NextResponse.json(
      { error: 'Failed to claim relationship anniversary reward', details: error.message },
      { status: 500 }
    );
  }
}
