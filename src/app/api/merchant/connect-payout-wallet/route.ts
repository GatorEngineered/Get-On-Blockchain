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

    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Basic validation for wallet address format
    if (!walletAddress.startsWith("0x") || walletAddress.length < 32) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Check plan restrictions - Starter and Basic plans cannot configure wallet
    const existingMerchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { plan: true },
    });

    if (existingMerchant?.plan === "STARTER" || existingMerchant?.plan === "BASIC") {
      return NextResponse.json(
        {
          error: "Wallet configuration requires a Premium plan or higher. Please upgrade your plan to enable USDC payouts.",
          planRestricted: true,
          currentPlan: existingMerchant.plan,
        },
        { status: 403 }
      );
    }

    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        payoutWalletAddress: walletAddress,
      },
    });

    return NextResponse.json({ success: true, merchant });
  } catch (error) {
    console.error("Connect payout wallet error:", error);
    return NextResponse.json(
      { error: "Failed to connect payout wallet" },
      { status: 500 }
    );
  }
}
