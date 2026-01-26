// src/app/api/member/special-rewards/route.ts
// Get available special rewards (birthday/member anniversary/relationship anniversary) for each merchant

import { NextResponse } from 'next/server';
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
): { inWindow: boolean; daysUntil: number } {
  const currentYear = checkDate.getFullYear();

  // Create target date for current year
  let targetDate = new Date(currentYear, targetMonth - 1, targetDay);

  // If target date has passed this year, check if we're still in the window
  // or if we should consider next year
  const diffMs = targetDate.getTime() - checkDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // If more than windowDays in the past, consider next year
  if (diffDays < -windowDays) {
    targetDate = new Date(currentYear + 1, targetMonth - 1, targetDay);
    const newDiffMs = targetDate.getTime() - checkDate.getTime();
    const daysUntil = Math.ceil(newDiffMs / (1000 * 60 * 60 * 24));
    return { inWindow: false, daysUntil };
  }

  // Check if within window
  const inWindow = Math.abs(diffDays) <= windowDays;
  return { inWindow, daysUntil: diffDays };
}

// Helper to check if a full date anniversary is within window
function isDateAnniversaryInWindow(
  anniversaryDate: Date,
  windowDays: number,
  checkDate: Date = new Date()
): { inWindow: boolean; daysUntil: number } {
  const month = anniversaryDate.getMonth() + 1;
  const day = anniversaryDate.getDate();
  return isWithinWindow(month, day, windowDays, checkDate);
}

export async function GET() {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get member with birthday/anniversary info
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        birthMonth: true,
        birthDay: true,
        birthdayLocked: true,
        anniversaryDate: true,
        createdAt: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get all merchant memberships with reward settings
    const merchantMembers = await prisma.merchantMember.findMany({
      where: { memberId },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            birthdayRewardEnabled: true,
            birthdayRewardPoints: true,
            birthdayRewardWindowDays: true,
            memberAnniversaryRewardEnabled: true,
            memberAnniversaryRewardPoints: true,
            memberAnniversaryRewardWindowDays: true,
            relationshipAnniversaryRewardEnabled: true,
            relationshipAnniversaryRewardPoints: true,
            relationshipAnniversaryRewardWindowDays: true,
          },
        },
      },
    });

    const currentYear = new Date().getFullYear();

    // Build special rewards status for each merchant
    const specialRewards = merchantMembers.map((mm) => {
      const merchant = mm.merchant;

      // Birthday reward status
      let birthdayReward = null;
      if (merchant.birthdayRewardEnabled && member.birthMonth && member.birthDay) {
        const { inWindow, daysUntil } = isWithinWindow(
          member.birthMonth,
          member.birthDay,
          merchant.birthdayRewardWindowDays
        );

        const alreadyClaimed = mm.lastBirthdayClaimYear === currentYear;

        birthdayReward = {
          enabled: true,
          points: merchant.birthdayRewardPoints,
          windowDays: merchant.birthdayRewardWindowDays,
          inWindow,
          daysUntil,
          canClaim: inWindow && !alreadyClaimed,
          alreadyClaimed,
          birthday: {
            month: member.birthMonth,
            day: member.birthDay,
          },
        };
      } else if (merchant.birthdayRewardEnabled) {
        // Birthday reward is enabled but member hasn't set birthday
        birthdayReward = {
          enabled: true,
          points: merchant.birthdayRewardPoints,
          windowDays: merchant.birthdayRewardWindowDays,
          inWindow: false,
          daysUntil: null,
          canClaim: false,
          alreadyClaimed: false,
          birthday: null,
          needsBirthdaySet: true,
        };
      }

      // Member Anniversary reward status (based on join date)
      let memberAnniversaryReward = null;
      if (merchant.memberAnniversaryRewardEnabled) {
        const { inWindow, daysUntil } = isDateAnniversaryInWindow(
          member.createdAt,
          merchant.memberAnniversaryRewardWindowDays
        );

        const alreadyClaimed = mm.lastMemberAnniversaryClaimYear === currentYear;

        memberAnniversaryReward = {
          enabled: true,
          points: merchant.memberAnniversaryRewardPoints,
          windowDays: merchant.memberAnniversaryRewardWindowDays,
          inWindow,
          daysUntil,
          canClaim: inWindow && !alreadyClaimed,
          alreadyClaimed,
          joinDate: member.createdAt.toISOString(),
        };
      }

      // Relationship Anniversary reward status (based on member-set date)
      let relationshipAnniversaryReward = null;
      if (merchant.relationshipAnniversaryRewardEnabled && member.anniversaryDate) {
        const { inWindow, daysUntil } = isDateAnniversaryInWindow(
          member.anniversaryDate,
          merchant.relationshipAnniversaryRewardWindowDays
        );

        const alreadyClaimed = mm.lastRelationshipAnniversaryClaimYear === currentYear;

        relationshipAnniversaryReward = {
          enabled: true,
          points: merchant.relationshipAnniversaryRewardPoints,
          windowDays: merchant.relationshipAnniversaryRewardWindowDays,
          inWindow,
          daysUntil,
          canClaim: inWindow && !alreadyClaimed,
          alreadyClaimed,
          anniversaryDate: member.anniversaryDate.toISOString(),
        };
      } else if (merchant.relationshipAnniversaryRewardEnabled) {
        // Relationship anniversary reward is enabled but member hasn't set date
        relationshipAnniversaryReward = {
          enabled: true,
          points: merchant.relationshipAnniversaryRewardPoints,
          windowDays: merchant.relationshipAnniversaryRewardWindowDays,
          inWindow: false,
          daysUntil: null,
          canClaim: false,
          alreadyClaimed: false,
          anniversaryDate: null,
          needsAnniversarySet: true,
        };
      }

      return {
        merchantId: merchant.id,
        merchantName: merchant.name,
        merchantSlug: merchant.slug,
        memberPoints: mm.points,
        birthdayReward,
        memberAnniversaryReward,
        relationshipAnniversaryReward,
      };
    });

    // Filter to only include merchants with at least one special reward enabled
    const activeSpecialRewards = specialRewards.filter(
      (sr) => sr.birthdayReward || sr.memberAnniversaryReward || sr.relationshipAnniversaryReward
    );

    return NextResponse.json({
      specialRewards: activeSpecialRewards,
      memberInfo: {
        hasBirthday: !!(member.birthMonth && member.birthDay),
        birthdayLocked: member.birthdayLocked,
        birthday: member.birthMonth && member.birthDay
          ? { month: member.birthMonth, day: member.birthDay }
          : null,
        joinDate: member.createdAt.toISOString(),
        hasRelationshipAnniversary: !!member.anniversaryDate,
        relationshipAnniversaryDate: member.anniversaryDate?.toISOString() || null,
      },
    });
  } catch (error: any) {
    console.error('[Special Rewards GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch special rewards', details: error.message },
      { status: 500 }
    );
  }
}
