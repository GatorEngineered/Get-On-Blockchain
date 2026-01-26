// src/app/api/member/claim-member-anniversary/route.ts
// Claim member anniversary reward (based on join date) for a merchant

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

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

// Helper to check if member anniversary is within window
function isWithinWindow(
  joinDate: Date,
  windowDays: number,
  checkDate: Date = new Date()
): boolean {
  const currentYear = checkDate.getFullYear();
  const month = joinDate.getMonth();
  const day = joinDate.getDate();

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

    // Get member info (join date from createdAt)
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        createdAt: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get merchant settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        memberAnniversaryRewardEnabled: true,
        memberAnniversaryRewardPoints: true,
        memberAnniversaryRewardWindowDays: true,
        businesses: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.memberAnniversaryRewardEnabled) {
      return NextResponse.json(
        { error: 'Member anniversary rewards are not enabled for this merchant' },
        { status: 400 }
      );
    }

    // Check if within member anniversary window
    const inWindow = isWithinWindow(
      member.createdAt,
      merchant.memberAnniversaryRewardWindowDays
    );

    if (!inWindow) {
      return NextResponse.json(
        { error: `Member anniversary rewards can only be claimed within ${merchant.memberAnniversaryRewardWindowDays} days of your membership anniversary` },
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
    if (merchantMember.lastMemberAnniversaryClaimYear === currentYear) {
      return NextResponse.json(
        { error: 'You have already claimed your member anniversary reward for this year' },
        { status: 400 }
      );
    }

    // Award points and mark as claimed
    const newPoints = merchantMember.points + merchant.memberAnniversaryRewardPoints;

    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: newPoints,
        lastMemberAnniversaryClaimYear: currentYear,
      },
    });

    // Create event log
    await prisma.event.create({
      data: {
        merchantId,
        memberId,
        type: 'MEMBER_ANNIVERSARY_REWARD',
        metadata: {
          pointsAwarded: merchant.memberAnniversaryRewardPoints,
          year: currentYear,
          joinDate: member.createdAt.toISOString(),
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
          amount: merchant.memberAnniversaryRewardPoints,
          reason: `Member anniversary reward from ${merchant.name}`,
          status: 'SUCCESS',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Happy Member Anniversary! You've earned ${merchant.memberAnniversaryRewardPoints} points from ${merchant.name}!`,
      pointsAwarded: merchant.memberAnniversaryRewardPoints,
      totalPoints: newPoints,
      merchantName: merchant.name,
    });
  } catch (error: any) {
    console.error('[Claim Member Anniversary] Error:', error);
    return NextResponse.json(
      { error: 'Failed to claim member anniversary reward', details: error.message },
      { status: 500 }
    );
  }
}
