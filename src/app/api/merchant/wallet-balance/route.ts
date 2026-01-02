import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { getUSDCBalance } from "@/app/lib/blockchain/usdc";
import { getMaticBalance } from "@/app/lib/blockchain/wallet";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

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

    // Get merchant with wallet info
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        payoutEnabled: true,
        payoutWalletAddress: true,
        payoutWalletEncrypted: true,
        payoutAmountUSD: true,
        payoutMilestonePoints: true,
        lowBalanceThreshold: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Check if merchant has wallet set up
    if (!merchant.payoutWalletAddress || !merchant.payoutWalletEncrypted) {
      return NextResponse.json({
        hasWallet: false,
        message: "No wallet configured. Please set up your payout wallet in Settings.",
      });
    }

    // Get USDC balance
    let usdcBalance = "0";
    let maticBalance = "0";
    let balanceError = null;

    try {
      usdcBalance = await getUSDCBalance(merchant.payoutWalletAddress);
    } catch (error: any) {
      console.error("Failed to get USDC balance:", error);
      balanceError = "Failed to fetch USDC balance";
    }

    // Get MATIC balance (for gas fees)
    try {
      maticBalance = await getMaticBalance(merchant.payoutWalletAddress);
    } catch (error: any) {
      console.error("Failed to get MATIC balance:", error);
      balanceError = balanceError || "Failed to fetch MATIC balance";
    }

    // Calculate how many payouts can be made with current balance
    const payoutAmount = parseFloat(merchant.payoutAmountUSD.toString());
    const currentUSDC = parseFloat(usdcBalance);
    const payoutsRemaining = Math.floor(currentUSDC / payoutAmount);

    // Check if balance is below threshold
    const lowBalanceThreshold = merchant.lowBalanceThreshold || 50; // Default $50
    const isLowBalance = currentUSDC < lowBalanceThreshold;

    // Check if MATIC is too low for gas (rough estimate: need at least 0.1 MATIC)
    const currentMATIC = parseFloat(maticBalance);
    const isLowGas = currentMATIC < 0.1;

    return NextResponse.json({
      hasWallet: true,
      walletAddress: merchant.payoutWalletAddress,
      balances: {
        usdc: usdcBalance,
        matic: maticBalance,
      },
      payout: {
        amountPerPayout: payoutAmount,
        payoutsRemaining,
        pointsRequired: merchant.payoutMilestonePoints,
      },
      alerts: {
        isLowBalance,
        isLowGas,
        lowBalanceThreshold,
      },
      error: balanceError,
    });
  } catch (error: any) {
    console.error("Wallet balance check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check wallet balance" },
      { status: 500 }
    );
  }
}
