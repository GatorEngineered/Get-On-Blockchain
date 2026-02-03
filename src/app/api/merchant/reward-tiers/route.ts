// src/app/api/merchant/reward-tiers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * PUT /api/merchant/reward-tiers
 *
 * Update merchant's reward tier configuration
 */
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    const {
      welcomePoints,
      earnPerVisit,
      vipThreshold,
      superThreshold,
      payoutMilestonePoints,
      payoutAmountUSD,
      payoutEnabled,
      customTierThresholds,
    } = await req.json();

    // Validation
    if (
      welcomePoints === undefined ||
      earnPerVisit === undefined ||
      vipThreshold === undefined ||
      superThreshold === undefined ||
      payoutMilestonePoints === undefined ||
      payoutAmountUSD === undefined
    ) {
      return NextResponse.json(
        { error: 'All tier fields are required' },
        { status: 400 }
      );
    }

    // Ensure values are positive
    if (
      welcomePoints < 0 ||
      earnPerVisit < 0 ||
      vipThreshold < 0 ||
      superThreshold < 0 ||
      payoutMilestonePoints < 0 ||
      payoutAmountUSD < 0
    ) {
      return NextResponse.json(
        { error: 'All values must be positive numbers' },
        { status: 400 }
      );
    }

    // Ensure tier thresholds are in ascending order
    if (vipThreshold >= superThreshold) {
      return NextResponse.json(
        { error: 'VIP threshold must be less than Super threshold' },
        { status: 400 }
      );
    }

    // Update merchant
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        welcomePoints,
        earnPerVisit,
        vipThreshold,
        superThreshold,
        payoutMilestonePoints,
        payoutAmountUSD,
        ...(payoutEnabled !== undefined && { payoutEnabled }),
        ...(customTierThresholds !== undefined && { customTierThresholds }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Reward tiers updated successfully',
      tiers: {
        welcomePoints: updatedMerchant.welcomePoints,
        earnPerVisit: updatedMerchant.earnPerVisit,
        vipThreshold: updatedMerchant.vipThreshold,
        superThreshold: updatedMerchant.superThreshold,
        payoutMilestonePoints: updatedMerchant.payoutMilestonePoints,
        payoutAmountUSD: updatedMerchant.payoutAmountUSD,
        payoutEnabled: updatedMerchant.payoutEnabled,
        customTierThresholds: updatedMerchant.customTierThresholds,
      },
    });
  } catch (error: any) {
    console.error('[Update Reward Tiers] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update reward tiers', details: error.message },
      { status: 500 }
    );
  }
}
