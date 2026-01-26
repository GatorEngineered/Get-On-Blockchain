// src/app/api/member/claim-birthday/route.ts
// Claim birthday reward for a merchant

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

// Helper to check if a date is within a window of a target date (month/day)
function isWithinWindow(
  targetMonth: number,
  targetDay: number,
  windowDays: number,
  checkDate: Date = new Date()
): boolean {
  const currentYear = checkDate.getFullYear();

  // Create target date for current year
  let targetDate = new Date(currentYear, targetMonth - 1, targetDay);

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
        birthMonth: true,
        birthDay: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!member.birthMonth || !member.birthDay) {
      return NextResponse.json(
        { error: 'Please set your birthday first in your profile settings' },
        { status: 400 }
      );
    }

    // Get merchant settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        birthdayRewardEnabled: true,
        birthdayRewardPoints: true,
        birthdayRewardWindowDays: true,
        businesses: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.birthdayRewardEnabled) {
      return NextResponse.json(
        { error: 'Birthday rewards are not enabled for this merchant' },
        { status: 400 }
      );
    }

    // Check if within birthday window
    const inWindow = isWithinWindow(
      member.birthMonth,
      member.birthDay,
      merchant.birthdayRewardWindowDays
    );

    if (!inWindow) {
      return NextResponse.json(
        { error: `Birthday rewards can only be claimed within ${merchant.birthdayRewardWindowDays} days of your birthday` },
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
    if (merchantMember.lastBirthdayClaimYear === currentYear) {
      return NextResponse.json(
        { error: 'You have already claimed your birthday reward for this year' },
        { status: 400 }
      );
    }

    // Award points and mark as claimed
    const newPoints = merchantMember.points + merchant.birthdayRewardPoints;

    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: newPoints,
        lastBirthdayClaimYear: currentYear,
      },
    });

    // Create event log
    await prisma.event.create({
      data: {
        merchantId,
        memberId,
        type: 'BIRTHDAY_REWARD',
        metadata: {
          pointsAwarded: merchant.birthdayRewardPoints,
          year: currentYear,
          birthday: { month: member.birthMonth, day: member.birthDay },
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
          amount: merchant.birthdayRewardPoints,
          reason: `Birthday reward from ${merchant.name}`,
          status: 'SUCCESS',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Happy Birthday! You've earned ${merchant.birthdayRewardPoints} points from ${merchant.name}!`,
      pointsAwarded: merchant.birthdayRewardPoints,
      totalPoints: newPoints,
      merchantName: merchant.name,
    });
  } catch (error: any) {
    console.error('[Claim Birthday] Error:', error);
    return NextResponse.json(
      { error: 'Failed to claim birthday reward', details: error.message },
      { status: 500 }
    );
  }
}
