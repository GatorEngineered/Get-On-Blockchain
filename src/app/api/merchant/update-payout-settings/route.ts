import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse session data from JSON
    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { payoutMilestonePoints, payoutAmountUSD, payoutNetwork, lowBalanceThreshold } = await req.json();

    // Validation
    if (payoutMilestonePoints !== undefined && payoutMilestonePoints < 1) {
      return NextResponse.json(
        { error: "Milestone points must be at least 1" },
        { status: 400 }
      );
    }

    if (payoutAmountUSD !== undefined && payoutAmountUSD < 0.01) {
      return NextResponse.json(
        { error: "Payout amount must be at least $0.01" },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        payoutMilestonePoints: payoutMilestonePoints !== undefined ? payoutMilestonePoints : undefined,
        payoutAmountUSD: payoutAmountUSD !== undefined ? payoutAmountUSD : undefined,
        payoutNetwork: payoutNetwork || undefined,
        lowBalanceThreshold: lowBalanceThreshold !== undefined ? lowBalanceThreshold : undefined,
      },
    });

    return NextResponse.json({ success: true, merchant });
  } catch (error) {
    console.error("Update payout settings error:", error);
    return NextResponse.json(
      { error: "Failed to update payout settings" },
      { status: 500 }
    );
  }
}
