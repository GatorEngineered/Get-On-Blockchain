// src/app/api/member/claim-anniversary/route.ts
// Claim anniversary reward for a merchant

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
        createdAt: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Use custom anniversary or fall back to join date
    const effectiveAnniversary = member.anniversaryDate || member.createdAt;

    // Get merchant settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        anniversaryRewardEnabled: true,
        anniversaryRewardPoints: true,
        anniversaryRewardWindowDays: true,
        businesses: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.anniversaryRewardEnabled) {
      return NextResponse.json(
        { error: 'Anniversary rewards are not enabled for this merchant' },
        { status: 400 }
      );
    }

    // Check if within anniversary window
    const inWindow = isWithinWindow(
      effectiveAnniversary,
      merchant.anniversaryRewardWindowDays
    );

    if (!inWindow) {
      return NextResponse.json(
        { error: `Anniversary rewards can only be claimed within ${merchant.anniversaryRewardWindowDays} days of your anniversary` },
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
    if (merchantMember.lastAnniversaryClaimYear === currentYear) {
      return NextResponse.json(
        { error: 'You have already claimed your anniversary reward for this year' },
        { status: 400 }
      );
    }

    // Award points and mark as claimed
    const newPoints = merchantMember.points + merchant.anniversaryRewardPoints;

    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: newPoints,
        lastAnniversaryClaimYear: currentYear,
      },
    });

    // Create event log
    await prisma.event.create({
      data: {
        merchantId,
        memberId,
        type: 'ANNIVERSARY_REWARD',
        metadata: {
          pointsAwarded: merchant.anniversaryRewardPoints,
          year: currentYear,
          anniversaryDate: effectiveAnniversary.toISOString(),
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
          amount: merchant.anniversaryRewardPoints,
          reason: `Anniversary reward from ${merchant.name}`,
          status: 'SUCCESS',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Happy Anniversary! You've earned ${merchant.anniversaryRewardPoints} points from ${merchant.name}!`,
      pointsAwarded: merchant.anniversaryRewardPoints,
      totalPoints: newPoints,
      merchantName: merchant.name,
    });
  } catch (error: any) {
    console.error('[Claim Anniversary] Error:', error);
    return NextResponse.json(
      { error: 'Failed to claim anniversary reward', details: error.message },
      { status: 500 }
    );
  }
}
