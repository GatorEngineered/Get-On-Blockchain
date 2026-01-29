// src/app/api/member/social-engagement/route.ts
// Social engagement points for members (PREMIUM+ merchants)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { hasSocialEngagement } from '@/app/lib/plan-limits';

// Default points for social engagements
const SOCIAL_ENGAGEMENT_POINTS = {
  instagram_follow: 25,
  facebook_follow: 25,
  twitter_follow: 25,
  tiktok_follow: 25,
  google_review: 50,
  share: 15,
  photo_upload: 30,
} as const;

type EngagementType = keyof typeof SOCIAL_ENGAGEMENT_POINTS;

/**
 * GET /api/member/social-engagement
 * Get member's social engagement status for a merchant
 *
 * Query: merchantSlug
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberId = sessionCookie.value;
    const url = new URL(req.url);
    const merchantSlug = url.searchParams.get('merchantSlug');

    if (!merchantSlug) {
      return NextResponse.json({ error: 'merchantSlug is required' }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
      select: {
        id: true,
        plan: true,
        instagramUrl: true,
        facebookUrl: true,
        twitterUrl: true,
        tiktokUrl: true,
      }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check if merchant has social engagement feature
    if (!hasSocialEngagement(merchant.plan)) {
      return NextResponse.json({
        error: 'Social engagement requires Premium plan or higher',
        available: false
      }, { status: 403 });
    }

    // Get member's existing engagements
    const engagements = await prisma.socialEngagement.findMany({
      where: {
        merchantId: merchant.id,
        memberId,
      },
      select: {
        engagementType: true,
        status: true,
        pointsAwarded: true,
        createdAt: true,
      }
    });

    // Build available actions with status
    const availableActions = [];

    if (merchant.instagramUrl) {
      const existing = engagements.find(e => e.engagementType === 'instagram_follow');
      availableActions.push({
        type: 'instagram_follow',
        label: 'Follow on Instagram',
        points: SOCIAL_ENGAGEMENT_POINTS.instagram_follow,
        url: merchant.instagramUrl,
        status: existing?.status || 'available',
        pointsAwarded: existing?.pointsAwarded || null,
      });
    }

    if (merchant.facebookUrl) {
      const existing = engagements.find(e => e.engagementType === 'facebook_follow');
      availableActions.push({
        type: 'facebook_follow',
        label: 'Follow on Facebook',
        points: SOCIAL_ENGAGEMENT_POINTS.facebook_follow,
        url: merchant.facebookUrl,
        status: existing?.status || 'available',
        pointsAwarded: existing?.pointsAwarded || null,
      });
    }

    if (merchant.twitterUrl) {
      const existing = engagements.find(e => e.engagementType === 'twitter_follow');
      availableActions.push({
        type: 'twitter_follow',
        label: 'Follow on X (Twitter)',
        points: SOCIAL_ENGAGEMENT_POINTS.twitter_follow,
        url: merchant.twitterUrl,
        status: existing?.status || 'available',
        pointsAwarded: existing?.pointsAwarded || null,
      });
    }

    if (merchant.tiktokUrl) {
      const existing = engagements.find(e => e.engagementType === 'tiktok_follow');
      availableActions.push({
        type: 'tiktok_follow',
        label: 'Follow on TikTok',
        points: SOCIAL_ENGAGEMENT_POINTS.tiktok_follow,
        url: merchant.tiktokUrl,
        status: existing?.status || 'available',
        pointsAwarded: existing?.pointsAwarded || null,
      });
    }

    // Always available actions
    const googleReview = engagements.find(e => e.engagementType === 'google_review');
    availableActions.push({
      type: 'google_review',
      label: 'Leave a Google Review',
      points: SOCIAL_ENGAGEMENT_POINTS.google_review,
      status: googleReview?.status || 'available',
      pointsAwarded: googleReview?.pointsAwarded || null,
    });

    return NextResponse.json({
      available: true,
      actions: availableActions,
      totalEarned: engagements
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + (e.pointsAwarded || 0), 0)
    });

  } catch (error: any) {
    console.error('[Social Engagement] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/member/social-engagement
 * Claim points for a social engagement
 *
 * Body: {
 *   merchantSlug: string;
 *   engagementType: string;
 *   proofUrl?: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberId = sessionCookie.value;
    const body = await req.json();
    const { merchantSlug, engagementType, proofUrl } = body;

    if (!merchantSlug) {
      return NextResponse.json({ error: 'merchantSlug is required' }, { status: 400 });
    }

    if (!engagementType || !(engagementType in SOCIAL_ENGAGEMENT_POINTS)) {
      return NextResponse.json({
        error: 'Invalid engagementType',
        validTypes: Object.keys(SOCIAL_ENGAGEMENT_POINTS)
      }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
      select: {
        id: true,
        plan: true,
        name: true,
        businesses: { select: { id: true }, take: 1 }
      }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!hasSocialEngagement(merchant.plan)) {
      return NextResponse.json({
        error: 'Social engagement requires Premium plan or higher'
      }, { status: 403 });
    }

    // Check if member is enrolled with merchant
    const merchantMember = await prisma.merchantMember.findFirst({
      where: { merchantId: merchant.id, memberId }
    });

    if (!merchantMember) {
      return NextResponse.json({
        error: 'You must be a member of this loyalty program first'
      }, { status: 400 });
    }

    // Check for existing claim
    const existing = await prisma.socialEngagement.findFirst({
      where: {
        merchantId: merchant.id,
        memberId,
        engagementType,
      }
    });

    if (existing) {
      return NextResponse.json({
        error: 'You have already claimed points for this action',
        status: existing.status
      }, { status: 400 });
    }

    const pointsToAward = SOCIAL_ENGAGEMENT_POINTS[engagementType as EngagementType];

    // For self-reported engagements, auto-approve and award points
    // (In a more robust system, you might require verification)
    const engagement = await prisma.socialEngagement.create({
      data: {
        merchantId: merchant.id,
        memberId,
        engagementType,
        proofUrl,
        verificationMethod: 'self_reported',
        isVerified: true, // Auto-verify for now
        verifiedAt: new Date(),
        status: 'approved',
        pointsAwarded: pointsToAward,
        pointsAwardedAt: new Date(),
      }
    });

    // Award points
    await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: { points: { increment: pointsToAward } }
    });

    // Create transaction record if business exists
    if (merchant.businesses.length > 0) {
      await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          businessId: merchant.businesses[0].id,
          memberId,
          type: 'EARN',
          amount: pointsToAward,
          reason: `Social engagement: ${engagementType.replace('_', ' ')} (${merchant.name})`,
          status: 'SUCCESS',
        }
      });
    }

    return NextResponse.json({
      success: true,
      engagement: {
        type: engagementType,
        pointsAwarded: pointsToAward,
        status: 'approved',
      },
      newBalance: merchantMember.points + pointsToAward,
      message: `You earned ${pointsToAward} points!`
    });

  } catch (error: any) {
    console.error('[Social Engagement] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
