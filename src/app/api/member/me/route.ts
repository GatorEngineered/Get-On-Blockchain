// src/app/api/member/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

/**
 * GET /api/member/me
 *
 * Get current logged-in member's data including points and payout eligibility
 */
export async function GET(req: NextRequest) {
  try {
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse session data
    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get member with all business memberships
    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
      include: {
        businesses: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get merchant/payout settings for each business
    const businessesWithPayoutInfo = await Promise.all(
      member.businesses.map(async (bm) => {
        // Find merchant for this business
        const merchant = await prisma.merchant.findUnique({
          where: { slug: bm.business.slug },
          select: {
            payoutEnabled: true,
            payoutMilestonePoints: true,
            payoutAmountUSD: true,
            payoutNetwork: true,
          },
        });

        const milestonePoints = merchant?.payoutMilestonePoints || 100;
        const payoutAmount = merchant?.payoutAmountUSD || 5.0;
        const payoutEnabled = merchant?.payoutEnabled || false;

        return {
          businessId: bm.business.id,
          businessName: bm.business.name,
          points: bm.points,
          walletAddress: bm.walletAddress,
          milestonePoints,
          payoutAmount,
          payoutEligible:
            payoutEnabled &&
            bm.walletAddress !== null &&
            bm.points >= milestonePoints,
        };
      })
    );

    return NextResponse.json({
      id: member.id,
      email: member.email,
      tier: member.tier,
      businesses: businessesWithPayoutInfo,
    });

  } catch (error: any) {
    console.error('[API] Error getting member data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
