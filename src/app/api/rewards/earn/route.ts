import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma"; // adjust path if your prisma helper is elsewhere

const DEFAULT_POINTS_PER_VISIT = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const businessMemberId = body.businessMemberId as string | undefined;
    const amountFromBody = body.amount as number | undefined;

    if (!businessMemberId) {
      return NextResponse.json(
        { error: "businessMemberId is required" },
        { status: 400 }
      );
    }

    const amount = amountFromBody ?? DEFAULT_POINTS_PER_VISIT;

    // Load the BusinessMember with related entities
    const bm = await prisma.businessMember.findUnique({
      where: { id: businessMemberId },
      include: {
        business: true,
        member: true,
      },
    });

    if (!bm || !bm.business || !bm.member) {
      return NextResponse.json(
        { error: "BusinessMember / Business / Member not found" },
        { status: 404 }
      );
    }

    // 1. Create reward transaction
    const tx = await prisma.rewardTransaction.create({
      data: {
        businessMemberId: bm.id,
        businessId: bm.businessId,
        memberId: bm.memberId,
        type: "EARN",
        amount,
        currency: "POINTS",
        reason: "visit",
        walletNetwork: bm.walletNetwork ?? null,
      },
    });

    // 2. Update the member's points for this business
    const updatedBm = await prisma.businessMember.update({
      where: { id: bm.id },
      data: {
        points: bm.points + amount,
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: tx.id,
      newBalance: updatedBm.points,
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
