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
