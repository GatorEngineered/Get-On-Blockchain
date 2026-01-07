// src/app/api/merchant/plan-change/route.ts
// Handle plan upgrades and downgrades with grace period logic

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import {
  handlePlanDowngrade,
  clearGracePeriod,
  getPlanMemberLimit,
  getMemberLimitStatus,
  GRACE_PERIOD_DAYS,
} from '@/app/lib/plan-limits';

/**
 * POST /api/merchant/plan-change
 *
 * Handle plan upgrades and downgrades
 * - Upgrades: Immediate, clears grace period
 * - Downgrades: Sets 15-day grace period before restrictions apply
 *
 * Request body:
 * { newPlan: 'STARTER' | 'BASIC' | 'PREMIUM' | 'GROWTH' | 'PRO' }
 *
 * Note: This is typically called after PayPal subscription change is complete
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('gob_merchant_session');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let merchantId: string;
    try {
      const sessionData = JSON.parse(session.value);
      merchantId = sessionData.merchantId;
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { newPlan } = await req.json();

    if (!newPlan || !['STARTER', 'BASIC', 'PREMIUM', 'GROWTH', 'PRO'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be STARTER, BASIC, PREMIUM, GROWTH, or PRO' },
        { status: 400 }
      );
    }

    // Get current merchant state
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        plan: true,
        additionalMemberSlots: true,
        previousPlan: true,
        downgradeGracePeriodEndsAt: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const oldPlan = merchant.plan;
    const oldLimit = getPlanMemberLimit(oldPlan);
    const newLimit = getPlanMemberLimit(newPlan);

    // Check if this is an upgrade or downgrade
    const isUpgrade = newLimit > oldLimit;
    const isDowngrade = newLimit < oldLimit;

    // Get current member count for validation
    const memberStatus = await getMemberLimitStatus(merchantId);

    let gracePeriodEndsAt: Date | null = null;

    if (isDowngrade) {
      // Set grace period for downgrade
      gracePeriodEndsAt = new Date();
      gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS);

      await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          plan: newPlan,
          previousPlan: oldPlan,
          downgradeGracePeriodEndsAt: gracePeriodEndsAt,
        },
      });
    } else if (isUpgrade) {
      // Clear any grace period on upgrade
      await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          plan: newPlan,
          previousPlan: null,
          downgradeGracePeriodEndsAt: null,
        },
      });
    } else {
      // Same plan, just update
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { plan: newPlan },
      });
    }

    // Log the plan change event
    await prisma.event.create({
      data: {
        merchantId,
        type: 'REWARD_EARNED', // Repurpose event type
        source: 'plan-change',
        metadata: {
          action: isUpgrade ? 'UPGRADE' : isDowngrade ? 'DOWNGRADE' : 'SAME',
          oldPlan,
          newPlan,
          oldLimit,
          newLimit,
          gracePeriodEndsAt: gracePeriodEndsAt?.toISOString(),
          currentMembers: memberStatus?.currentCount,
        },
      },
    });

    // Get updated status
    const updatedStatus = await getMemberLimitStatus(merchantId);

    return NextResponse.json({
      success: true,
      message: isDowngrade
        ? `Plan changed to ${newPlan}. You have ${GRACE_PERIOD_DAYS} days to adjust to your new member limit.`
        : `Plan changed to ${newPlan} successfully!`,
      planChange: {
        oldPlan,
        newPlan,
        isUpgrade,
        isDowngrade,
        oldLimit,
        newLimit,
        gracePeriodEndsAt,
        gracePeriodDays: isDowngrade ? GRACE_PERIOD_DAYS : 0,
      },
      memberStatus: updatedStatus,
    });
  } catch (error: any) {
    console.error('[Plan Change] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change plan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/merchant/plan-change
 * Get current plan info and what would happen on plan change
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('gob_merchant_session');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let merchantId: string;
    try {
      const sessionData = JSON.parse(session.value);
      merchantId = sessionData.merchantId;
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        plan: true,
        additionalMemberSlots: true,
        previousPlan: true,
        downgradeGracePeriodEndsAt: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const memberStatus = await getMemberLimitStatus(merchantId);

    // Calculate what each plan change would mean
    const plans = ['STARTER', 'BASIC', 'PREMIUM', 'GROWTH', 'PRO'];
    const planOptions = plans.map(plan => {
      const limit = getPlanMemberLimit(plan);
      const currentLimit = getPlanMemberLimit(merchant.plan);
      const isUpgrade = limit > currentLimit;
      const isDowngrade = limit < currentLimit;
      const wouldExceedLimit = memberStatus && memberStatus.currentCount > limit;

      return {
        plan,
        memberLimit: limit,
        isUpgrade,
        isDowngrade,
        isCurrent: plan === merchant.plan,
        wouldExceedLimit,
        gracePeriodRequired: isDowngrade && wouldExceedLimit,
        gracePeriodDays: isDowngrade ? GRACE_PERIOD_DAYS : 0,
      };
    });

    return NextResponse.json({
      success: true,
      currentPlan: merchant.plan,
      memberStatus,
      planOptions,
      gracePeriod: {
        active: !!merchant.downgradeGracePeriodEndsAt && new Date() < new Date(merchant.downgradeGracePeriodEndsAt),
        endsAt: merchant.downgradeGracePeriodEndsAt,
        previousPlan: merchant.previousPlan,
      },
    });
  } catch (error: any) {
    console.error('[Plan Change] GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get plan info' },
      { status: 500 }
    );
  }
}
