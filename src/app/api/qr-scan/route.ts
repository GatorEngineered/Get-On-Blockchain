// src/app/api/qr-scan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * POST /api/qr-scan
 *
 * Award points to a member when they scan a QR code
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const memberId = session.memberId;

    const { businessSlug } = await req.json();

    if (!businessSlug) {
      return NextResponse.json({ error: 'Business slug is required' }, { status: 400 });
    }

    // Find the business
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
      include: {
        merchant: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (!business.merchantId || !business.merchant) {
      return NextResponse.json({ error: 'Business has no associated merchant' }, { status: 400 });
    }

    // Find or create MerchantMember relationship
    let merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId: business.merchantId,
          memberId,
        },
      },
    });

    if (!merchantMember) {
      // Create new merchant-member relationship with welcome points
      merchantMember = await prisma.merchantMember.create({
        data: {
          merchantId: business.merchantId,
          memberId,
          pointsBalance: business.merchant.welcomePoints,
          currentTier: 'BASE',
          visitCount: 1,
          totalPointsEarned: business.merchant.welcomePoints,
        },
      });

      // Award welcome points transaction
      await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          memberId,
          businessId: business.id,
          type: 'EARN',
          points: business.merchant.welcomePoints,
          reason: 'Welcome bonus',
          status: 'SUCCESS',
        },
      });
    }

    // Check for duplicate scan (prevent scanning multiple times in short period)
    const lastScan = await prisma.rewardTransaction.findFirst({
      where: {
        merchantMemberId: merchantMember.id,
        businessId: business.id,
        type: 'EARN',
        reason: 'QR code scan',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last 1 hour
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastScan) {
      // Already scanned recently
      return NextResponse.json(
        {
          error: 'You already scanned at this location recently. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Award points for this scan
    const pointsToAward = business.merchant.earnPerVisit;
    const newPointsBalance = merchantMember.pointsBalance + pointsToAward;
    const newTotalPointsEarned = merchantMember.totalPointsEarned + pointsToAward;
    const newVisitCount = merchantMember.visitCount + 1;

    // Determine tier based on total points earned
    let newTier = 'BASE';
    if (newTotalPointsEarned >= business.merchant.superThreshold) {
      newTier = 'SUPER';
    } else if (newTotalPointsEarned >= business.merchant.vipThreshold) {
      newTier = 'VIP';
    }

    // Update merchant member
    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        pointsBalance: newPointsBalance,
        totalPointsEarned: newTotalPointsEarned,
        visitCount: newVisitCount,
        currentTier: newTier,
        lastVisitAt: new Date(),
      },
    });

    // Create transaction
    await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        memberId,
        businessId: business.id,
        type: 'EARN',
        points: pointsToAward,
        reason: 'QR code scan',
        status: 'SUCCESS',
      },
    });

    // Track the scan event
    await prisma.event.create({
      data: {
        merchantId: business.merchantId,
        type: 'SCAN',
        source: 'qr',
        metadata: {
          businessId: business.id,
          memberId,
          pointsAwarded: pointsToAward,
        },
      },
    });

    // Calculate next tier info
    let nextTier = null;
    if (newTier === 'BASE') {
      nextTier = {
        name: 'VIP',
        pointsNeeded: business.merchant.vipThreshold - newTotalPointsEarned,
      };
    } else if (newTier === 'VIP') {
      nextTier = {
        name: 'SUPER',
        pointsNeeded: business.merchant.superThreshold - newTotalPointsEarned,
      };
    }

    // Check if can claim payout
    const canClaimPayout = newPointsBalance >= business.merchant.payoutMilestonePoints;

    return NextResponse.json({
      success: true,
      businessName: business.name,
      pointsAwarded: pointsToAward,
      totalPoints: newPointsBalance,
      totalPointsEarned: newTotalPointsEarned,
      tier: newTier,
      visitCount: newVisitCount,
      nextTier,
      canClaimPayout,
      payoutAmount: business.merchant.payoutAmountUSD,
    });
  } catch (error: any) {
    console.error('[QR Scan] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process scan', details: error.message },
      { status: 500 }
    );
  }
}
