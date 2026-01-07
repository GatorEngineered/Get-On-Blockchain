// src/app/api/merchant/[slug]/rewards/route.ts
// Public API to fetch active rewards for a merchant by slug
// Shows all rewards but marks over-limit rewards as greyed/unavailable

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getRewardVisibility } from '@/app/lib/plan-limits';

export const dynamic = 'force-dynamic';

// GET - Fetch active rewards for a merchant (public endpoint)
// Returns rewards with visibility status (greyed out if over plan limit)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find merchant by slug
    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      select: { id: true, name: true, plan: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Fetch active rewards for this merchant
    const rewards = await prisma.reward.findMany({
      where: {
        merchantId: merchant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        pointsCost: true,
        rewardType: true,
        usdcAmount: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { pointsCost: 'asc' }],
    });

    // Get reward visibility (which rewards are within plan limits)
    const visibility = await getRewardVisibility(merchant.id);

    // Mark each reward with its availability status
    // Rewards over the plan limit are greyed out and not earnable by new members
    const rewardsWithVisibility = rewards.map(reward => ({
      ...reward,
      isAvailable: visibility.activeRewardIds.includes(reward.id),
      isGreyedOut: visibility.greyedRewardIds.includes(reward.id),
      // Only show greyed message if this reward is over limit
      greyedReason: visibility.greyedRewardIds.includes(reward.id)
        ? 'This reward is currently unavailable due to plan limits'
        : null,
    }));

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
      },
      rewards: rewardsWithVisibility,
      // Separate available vs greyed rewards for easy frontend filtering
      availableRewards: rewardsWithVisibility.filter(r => r.isAvailable),
      greyedRewards: rewardsWithVisibility.filter(r => r.isGreyedOut),
    });
  } catch (error: any) {
    console.error('[Public Rewards GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards', details: error.message },
      { status: 500 }
    );
  }
}
