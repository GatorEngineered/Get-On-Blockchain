import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { transferUSDC, getUSDCBalance } from "@/app/lib/blockchain/usdc";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_member_session");

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

    const memberId = sessionData.memberId;
    if (!memberId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { merchantId } = await req.json();

    if (!merchantId) {
      return NextResponse.json(
        { error: "Merchant ID is required" },
        { status: 400 }
      );
    }

    // Get Merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: {
          take: 1, // Get one business for transaction record
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    if (merchant.businesses.length === 0) {
      return NextResponse.json(
        { error: "Merchant has no businesses" },
        { status: 404 }
      );
    }

    const businessId = merchant.businesses[0].id;

    // Get MerchantMember relationship (merchant-level points)
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId,
        },
      },
    });

    if (!merchantMember) {
      return NextResponse.json(
        { error: "You are not a member of this merchant" },
        { status: 404 }
      );
    }

    // Check if payouts are enabled for this merchant
    if (!merchant.payoutEnabled) {
      return NextResponse.json(
        { error: "Payouts are not enabled for this business yet" },
        { status: 400 }
      );
    }

    // Check if merchant has verified payment
    if (!merchant.paymentVerified) {
      return NextResponse.json(
        { error: "This business has not verified their payment method yet" },
        { status: 400 }
      );
    }

    // Check if member has enough points (from merchant-level aggregation)
    const pointsRequired = merchant.payoutMilestonePoints;
    const currentPoints = merchantMember.points;

    if (currentPoints < pointsRequired) {
      return NextResponse.json(
        {
          error: `Not enough points. You have ${currentPoints}, need ${pointsRequired}`,
          currentPoints,
          pointsRequired,
          pointsNeeded: pointsRequired - currentPoints,
        },
        { status: 400 }
      );
    }

    // Get member wallet
    const memberWallet = await prisma.memberWallet.findUnique({
      where: { memberId },
    });

    if (!memberWallet) {
      return NextResponse.json(
        { error: "Wallet not found. Please scan a QR code first to generate your wallet." },
        { status: 404 }
      );
    }

    // Check if merchant has wallet set up
    if (!merchant.payoutWalletEncrypted) {
      return NextResponse.json(
        { error: "Business wallet not configured. Please contact the business." },
        { status: 400 }
      );
    }

    // Check merchant wallet USDC balance
    const merchantBalance = await getUSDCBalance(merchant.payoutWalletAddress!);
    const payoutAmount = merchant.payoutAmountUSD.toString();

    if (parseFloat(merchantBalance) < parseFloat(payoutAmount)) {
      return NextResponse.json(
        {
          error: `Business has insufficient USDC balance. Please contact them. Required: $${payoutAmount}, Available: $${merchantBalance}`,
        },
        { status: 400 }
      );
    }

    // Deduct points first (before sending USDC) - from merchant-level points
    const updatedMerchantMember = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: {
          decrement: pointsRequired,
        },
      },
    });

    // Create pending transaction record (linked to MerchantMember)
    const transaction = await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId,
        memberId,
        type: "PAYOUT",
        amount: 0, // Points were already deducted
        pointsDeducted: pointsRequired,
        usdcAmount: parseFloat(payoutAmount),
        currency: "USDC",
        reason: `Payout for ${pointsRequired} points`,
        walletAddress: memberWallet.walletAddress,
        walletNetwork: "polygon",
        status: "PENDING",
      },
    });

    try {
      // Transfer USDC from merchant to member
      const { txHash, success } = await transferUSDC(
        merchant.payoutWalletEncrypted,
        memberWallet.walletAddress,
        payoutAmount
      );

      if (!success) {
        throw new Error("Transfer failed on blockchain");
      }

      // Update transaction with success
      await prisma.rewardTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          txHash,
        },
      });

      // Update member wallet balance
      await prisma.memberWallet.update({
        where: { id: memberWallet.id },
        data: {
          balance: {
            increment: parseFloat(payoutAmount),
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully claimed $${payoutAmount} USDC!`,
        payout: {
          amount: payoutAmount,
          currency: "USDC",
          txHash,
          walletAddress: memberWallet.walletAddress,
          pointsDeducted: pointsRequired,
          remainingPoints: updatedMerchantMember.points,
        },
      });
    } catch (error: any) {
      console.error("Payout transfer error:", error);

      // Mark transaction as failed
      await prisma.rewardTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      });

      // Refund points since transfer failed (to merchant-level points)
      await prisma.merchantMember.update({
        where: { id: merchantMember.id },
        data: {
          points: {
            increment: pointsRequired,
          },
        },
      });

      return NextResponse.json(
        {
          error: `Payout failed: ${error.message}. Your points have been refunded.`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Claim payout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payout" },
      { status: 500 }
    );
  }
}
