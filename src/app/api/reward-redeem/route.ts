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

    // Find business
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
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

    // Find BusinessMember relationship
    const businessMember = await prisma.businessMember.findUnique({
      where: {
        businessId_memberId: {
          businessId: business.id,
          memberId: member.id,
        },
      },
    });

    if (!businessMember) {
      return NextResponse.json(
        { error: "Member is not registered at this business" },
        { status: 404 }
      );
    }

    // Check if member has enough points
    if (businessMember.points < pointsToRedeem) {
      return NextResponse.json(
        {
          error: "Not enough points",
          currentPoints: businessMember.points,
          requiredPoints: pointsToRedeem,
        },
        { status: 400 }
      );
    }

    // Deduct points from BusinessMember
    const updatedBusinessMember = await prisma.businessMember.update({
      where: { id: businessMember.id },
      data: {
        points: {
          decrement: pointsToRedeem,
        },
      },
    });

    // Create RewardTransaction record
    const transaction = await prisma.rewardTransaction.create({
      data: {
        businessMemberId: businessMember.id,
        businessId: business.id,
        memberId: member.id,
        type: "REDEEM",
        amount: pointsToRedeem,
        currency: "POINTS",
        status: "SUCCESS",
        walletAddress: businessMember.walletAddress,
        walletNetwork: businessMember.walletNetwork,
      },
    });

    // Log redemption event
    await prisma.event.create({
      data: {
        merchantId: business.id, // Using business as merchant for now
        memberId: member.id,
        type: "REWARD_REDEEMED",
        source: "redemption",
        metadata: {
          amount: pointsToRedeem,
          reason: reason || "Reward redemption",
          rewardName: rewardName || "Unknown reward",
          transactionId: transaction.id,
          newBalance: updatedBusinessMember.points,
          ...extraMetadata,
        },
      },
    });

    console.log(
      `[Redeem] Member ${member.id} redeemed ${pointsToRedeem} points at ${business.name}. New balance: ${updatedBusinessMember.points}`
    );

    return NextResponse.json(
      {
        success: true,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          pointsRedeemed: pointsToRedeem,
          newBalance: updatedBusinessMember.points,
        },
        member: {
          id: member.id,
          points: updatedBusinessMember.points,
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
