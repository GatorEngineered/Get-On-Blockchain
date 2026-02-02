import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { tiersByPlan } from "@/app/lib/tier-display";

const DEFAULT_POINTS_PER_VISIT = 10;

/**
 * Calculate the appropriate tier for a member based on their points and merchant's plan
 * Tier thresholds are calculated dynamically based on vipThreshold and superThreshold
 */
function calculateTier(
  points: number,
  vipThreshold: number,
  superThreshold: number,
  plan: string
): string {
  const tierKeys = tiersByPlan[plan] || tiersByPlan.STARTER;

  // For 3-tier plans (STARTER): BASE < VIP < SUPER
  if (tierKeys.length === 3) {
    if (points >= superThreshold) return 'SUPER';
    if (points >= vipThreshold) return 'VIP';
    return 'BASE';
  }

  // For multi-tier plans, calculate intermediate thresholds
  // Intermediate tiers are evenly distributed between VIP and SUPER thresholds
  const intermediates = tierKeys.filter(k => k !== 'BASE' && k !== 'VIP' && k !== 'SUPER');
  const step = (superThreshold - vipThreshold) / (intermediates.length + 1);

  // Check from highest to lowest tier
  if (points >= superThreshold) return 'SUPER';

  // Check intermediate tiers (in reverse order - highest to lowest)
  for (let i = intermediates.length - 1; i >= 0; i--) {
    const threshold = Math.round(vipThreshold + step * (i + 1));
    if (points >= threshold) return intermediates[i];
  }

  if (points >= vipThreshold) return 'VIP';
  return 'BASE';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const merchantMemberId = body.merchantMemberId as string | undefined;
    const businessId = body.businessId as string | undefined;
    const amountFromBody = body.amount as number | undefined;

    if (!merchantMemberId) {
      return NextResponse.json(
        { error: "merchantMemberId is required" },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    const amount = amountFromBody ?? DEFAULT_POINTS_PER_VISIT;

    // Load the MerchantMember with related entities (merchant-level points)
    const merchantMember = await prisma.merchantMember.findUnique({
      where: { id: merchantMemberId },
      include: {
        merchant: true,
        member: true,
      },
    });

    if (!merchantMember || !merchantMember.merchant || !merchantMember.member) {
      return NextResponse.json(
        { error: "MerchantMember / Merchant / Member not found" },
        { status: 404 }
      );
    }

    // 1. Create reward transaction
    const tx = await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId,
        memberId: merchantMember.memberId,
        type: "EARN",
        amount,
        reason: "visit",
        status: "SUCCESS",
      },
    });

    // 2. Update the member's points at merchant level (aggregated across all locations)
    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: merchantMember.points + amount,
      },
    });

    // Check for tier upgrade based on plan's tier system
    const newTier = calculateTier(
      updatedMerchantMember.points,
      merchantMember.merchant.vipThreshold,
      merchantMember.merchant.superThreshold,
      merchantMember.merchant.plan
    );

    // Update tier if changed
    if (newTier !== updatedMerchantMember.tier) {
      await prisma.merchantMember.update({
        where: { id: merchantMember.id },
        data: { tier: newTier },
      });
    }

    return NextResponse.json({
      success: true,
      transactionId: tx.id,
      newBalance: updatedMerchantMember.points,
      tier: newTier,
      amount,
    });
  } catch (error) {
    console.error("Error in /api/rewards/earn:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
