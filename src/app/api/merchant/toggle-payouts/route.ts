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

    const { enabled } = await req.json();

    if (enabled === undefined) {
      return NextResponse.json(
        { error: "Enabled status is required" },
        { status: 400 }
      );
    }

    // Get merchant to check plan and wallet
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Check if merchant has premium plan or higher
    const allowedPlans = ["PREMIUM", "GROWTH", "PRO"];
    if (enabled && !allowedPlans.includes(merchant.plan)) {
      return NextResponse.json(
        { error: "USDC payouts require a Premium plan or higher" },
        { status: 403 }
      );
    }

    // Check if merchant has connected payout wallet
    if (enabled && !merchant.payoutWalletAddress) {
      return NextResponse.json(
        { error: "Please connect a payout wallet before enabling payouts" },
        { status: 400 }
      );
    }

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        payoutEnabled: enabled,
      },
    });

    return NextResponse.json({ success: true, merchant: updatedMerchant });
  } catch (error) {
    console.error("Toggle payouts error:", error);
    return NextResponse.json(
      { error: "Failed to toggle payouts" },
      { status: 500 }
    );
  }
}
