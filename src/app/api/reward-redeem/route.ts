// src/app/api/reward-redeem/route.ts

import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RewardRedeemBody = {
  businessSlug: string;  // Business slug (not merchant)
  memberId: string;
  points: number;
  reason?: string;
  rewardName?: string;
  metadata?: Record<string, unknown>;
};

/**
 * POST /api/reward-redeem
 *
 * Redeem points for rewards at a business
 * Points are aggregated at merchant level via MerchantMember
 *
 * Body:
 * - businessSlug: string (required) - The business slug
 * - memberId: string (required) - The member ID
 * - points: number (required) - Points to redeem
 * - reason: string (optional) - Reason for redemption
 * - rewardName: string (optional) - Name of the reward being redeemed
 * - metadata: object (optional) - Additional metadata
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RewardRedeemBody;

    const { businessSlug, memberId, points: pointsToRedeem, reason, rewardName, metadata: extraMetadata } = body;

    // Validation
    if (!businessSlug) {
      return NextResponse.json(
        { error: "Business slug is required" },
        { status: 400 }
      );
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return NextResponse.json(
        { error: "Valid points amount is required" },
        { status: 400 }
      );
    }

    // Find business with merchant
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
      include: {
        merchant: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (!business.merchant) {
      return NextResponse.json(
        { error: "Merchant not found for this business" },
        { status: 404 }
      );
    }

    // Find member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get MerchantMember for merchant-level points
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId: business.merchant.id,
          memberId: member.id,
        },
      },
    });

    if (!merchantMember) {
      return NextResponse.json(
        { error: "Member is not registered with this merchant" },
        { status: 404 }
      );
    }

    // Check if member has enough points
    if (merchantMember.points < pointsToRedeem) {
      return NextResponse.json(
        {
          error: "Not enough points",
          currentPoints: merchantMember.points,
          requiredPoints: pointsToRedeem,
        },
        { status: 400 }
      );
    }

    // Deduct points from MerchantMember (merchant-level aggregation)
    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: {
          decrement: pointsToRedeem,
        },
      },
    });

    // Create RewardTransaction record
    const transaction = await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId: business.id,
        memberId: member.id,
        type: "REDEEM",
        amount: pointsToRedeem,
        status: "SUCCESS",
        reason: reason || "Reward redemption",
      },
    });

    // Log redemption event
    await prisma.event.create({
      data: {
        merchantId: business.merchant.id,
        memberId: member.id,
        type: "REWARD_REDEEMED",
        source: "redemption",
        metadata: {
          amount: pointsToRedeem,
          reason: reason || "Reward redemption",
          rewardName: rewardName || "Unknown reward",
          transactionId: transaction.id,
          newBalance: updatedMerchantMember.points,
          businessSlug,
          ...extraMetadata,
        },
      },
    });

    console.log(
      `[Redeem] Member ${member.id} redeemed ${pointsToRedeem} points at ${business.name}. New balance: ${updatedMerchantMember.points}`
    );

    return NextResponse.json(
      {
        success: true,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          pointsRedeemed: pointsToRedeem,
          newBalance: updatedMerchantMember.points,
        },
        member: {
          id: member.id,
          points: updatedMerchantMember.points,
          tier: updatedMerchantMember.tier,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Redeem] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
