import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { transferUSDC, getUSDCBalance } from "@/app/lib/blockchain/usdc";
import { sendEmail } from "@/app/lib/email/resend";

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
      // Get member info for email
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { email: true, firstName: true, lastName: true },
      });

      // Send instant email notification to merchant
      const merchantEmail = merchant.notificationEmail || merchant.loginEmail;
      try {
        await sendEmail({
          to: merchantEmail,
          subject: `🚨 Urgent: Member Payout Failed - Insufficient USDC Balance`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .button { display: inline-block; background: #244b7a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Payout Failed - Action Required</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>A member just tried to claim their USDC reward but your wallet balance is too low.</strong>
      </div>

      <div class="details">
        <h3>Failed Payout Details</h3>
        <p><strong>Member:</strong> ${member?.firstName || 'Customer'} ${member?.lastName || ''}</p>
        <p><strong>Payout Amount:</strong> $${payoutAmount} USDC</p>
        <p><strong>Current Wallet Balance:</strong> $${parseFloat(merchantBalance).toFixed(2)} USDC</p>
        <p><strong>Shortfall:</strong> $${(parseFloat(payoutAmount) - parseFloat(merchantBalance)).toFixed(2)} USDC</p>
      </div>

      <h3>What to do:</h3>
      <ol>
        <li>Top up your payout wallet with USDC</li>
        <li>Also add some MATIC for gas fees</li>
        <li>The member will be able to claim once funds are available</li>
      </ol>

      <p><strong>Your wallet address:</strong><br>
      <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${merchant.payoutWalletAddress}</code></p>

      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.getonblockchain.com'}/dashboard/settings" class="button">
        Manage Wallet →
      </a>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 0.9em; color: #6b7280;">
        This is an automated alert from Get On Blockchain. A member is waiting to claim their reward!
      </p>
    </div>
  </div>
</body>
</html>
          `,
        });
        console.log(`[Payout] Sent insufficient balance alert to merchant ${merchant.slug}`);
      } catch (emailError) {
        console.error('[Payout] Failed to send merchant alert email:', emailError);
      }

      // Check if member already has a notification request
      const existingRequest = await prisma.payoutNotificationRequest.findUnique({
        where: {
          merchantId_memberId: { merchantId, memberId },
        },
      });

      // Return member-friendly response (doesn't embarrass merchant)
      return NextResponse.json(
        {
          error: "Your payout is currently under additional verification. The business has been notified and you'll be able to claim soon.",
          pendingVerification: true,
          pointsEarned: currentPoints,
          payoutAmount: parseFloat(payoutAmount),
          merchantName: merchant.name,
          canRequestNotification: !existingRequest,
          hasNotificationRequest: !!existingRequest,
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
