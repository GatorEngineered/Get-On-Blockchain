import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const DEFAULT_POINTS_PER_VISIT = 10;

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

    // Check for tier upgrade
    let newTier = updatedMerchantMember.tier;
    if (
      updatedMerchantMember.points >= merchantMember.merchant.superThreshold &&
      newTier !== "SUPER"
    ) {
      newTier = "SUPER";
    } else if (
      updatedMerchantMember.points >= merchantMember.merchant.vipThreshold &&
      updatedMerchantMember.points < merchantMember.merchant.superThreshold &&
      newTier !== "VIP"
    ) {
      newTier = "VIP";
    }

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
