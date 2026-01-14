// src/app/api/member/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

/**
 * GET /api/member/me
 *
 * Get current logged-in member's data including points and payout eligibility
 * Points are aggregated at merchant level via MerchantMember
 */
export async function GET(req: NextRequest) {
  try {
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Please log in to continue.' },
        { status: 401 }
      );
    }

    // Parse session data
    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    // Get member with merchant memberships (merchant-level points aggregation)
    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
      include: {
        merchantMembers: {
          include: {
            merchant: {
              select: {
                id: true,
                name: true,
                slug: true,
                payoutEnabled: true,
                payoutMilestonePoints: true,
                payoutAmountUSD: true,
                payoutNetwork: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    // Map merchant memberships to payout info (merchant-level, not per-business)
    const merchantsWithPayoutInfo = member.merchantMembers.map((mm) => {
      const milestonePoints = mm.merchant.payoutMilestonePoints || 100;
      const payoutAmount = mm.merchant.payoutAmountUSD || 5.0;
      const payoutEnabled = mm.merchant.payoutEnabled || false;

      return {
        merchantId: mm.merchant.id,
        merchantName: mm.merchant.name,
        merchantSlug: mm.merchant.slug,
        points: mm.points,
        tier: mm.tier,
        walletAddress: mm.walletAddress,
        milestonePoints,
        payoutAmount,
        payoutEligible:
          payoutEnabled &&
          mm.walletAddress !== null &&
          mm.points >= milestonePoints,
      };
    });

    return NextResponse.json({
      id: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      merchants: merchantsWithPayoutInfo,
    });

  } catch (error: any) {
    console.error('[API] Error getting member data:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
