// src/app/api/rewards/payout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendUSDC } from '@/lib/blockchain/polygon';
import { decrypt } from '@/lib/crypto/encryption';
import { sendPayoutSuccessEmail } from '@/app/lib/email/notifications';
import { sendEmail } from '@/lib/email/resend';
import { generatePayoutSuccessEmail } from '@/lib/email/templates/payout-success';

const prisma = new PrismaClient();

// Simple in-memory rate limiting (upgrade to Redis in production)
const payoutAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const limit = payoutAttempts.get(key);

  // Reset if expired
  if (limit && limit.resetAt < now) {
    payoutAttempts.delete(key);
  }

  const current = payoutAttempts.get(key);

  if (!current) {
    // First attempt - allow and set limit
    payoutAttempts.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 }); // 10 minutes
    return { allowed: true };
  }

  // Check if exceeded limit (10 attempts per 10 minutes)
  if (current.count >= 10) {
    const resetIn = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, resetIn };
  }

  // Increment counter
  current.count += 1;
  return { allowed: true };
}

/**
 * POST /api/rewards/payout
 *
 * Request payout for reaching milestone (configurable points = configurable USD)
 * Points are aggregated at merchant level via MerchantMember
 *
 * Body:
 * - merchantSlug: string
 * - memberId: string
 * - businessId: string (for tracking which business the payout came from)
 */
export async function POST(req: NextRequest) {
  try {
    const { merchantSlug, memberId, businessId } = await req.json();

    // Validation
    if (!merchantSlug || !memberId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantSlug, memberId, businessId' },
        { status: 400 }
      );
    }

    // Rate limiting (per member)
    const rateLimitKey = `payout:${memberId}:${merchantSlug}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many payout requests. Please try again later.',
          resetIn: rateLimit.resetIn
        },
        { status: 429 }
      );
    }

    // 1. Verify merchant exists and has Premium plan
    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (merchant.plan !== 'PREMIUM') {
      return NextResponse.json(
        { error: 'Stablecoin payouts require Premium plan. Upgrade at /pricing' },
        { status: 403 }
      );
    }

    // 2. Verify merchant has payout wallet configured
    if (!merchant.payoutEnabled || !merchant.payoutWalletEncrypted) {
      return NextResponse.json(
        {
          error: 'Payout wallet not configured. Please set up your payout wallet in dashboard.',
          action: 'SETUP_WALLET'
        },
        { status: 400 }
      );
    }

    // Decrypt merchant's payout wallet private key
    let payoutPrivateKey: string;
    try {
      payoutPrivateKey = decrypt(merchant.payoutWalletEncrypted);
    } catch (error) {
      console.error('[Payout] Failed to decrypt wallet:', error);
      return NextResponse.json(
        { error: 'Wallet decryption failed. Please contact support.' },
        { status: 500 }
      );
    }

    // Get merchant's configurable payout settings
    const MILESTONE_POINTS = merchant.payoutMilestonePoints;
    const PAYOUT_AMOUNT_USD = merchant.payoutAmountUSD;
    const PAYOUT_NETWORK = merchant.payoutNetwork as 'polygon' | 'mumbai';

    // 3. Get member's merchant relationship (merchant-level points)
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId: merchant.id,
          memberId,
        },
      },
      include: {
        member: true,
      },
    });

    if (!merchantMember) {
      return NextResponse.json(
        { error: 'Member not found for this merchant' },
        { status: 404 }
      );
    }

    // Get business info for display purposes
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // 4. Check if member has wallet connected (stored at merchant level)
    if (!merchantMember.walletAddress) {
      return NextResponse.json(
        {
          error: 'No wallet connected. Please connect a wallet first.',
          action: 'CONNECT_WALLET'
        },
        { status: 400 }
      );
    }

    // 5. Check if member has enough points (merchant-level aggregation)
    if (merchantMember.points < MILESTONE_POINTS) {
      return NextResponse.json(
        {
          error: `Insufficient points. Need ${MILESTONE_POINTS}, have ${merchantMember.points}`,
          pointsNeeded: MILESTONE_POINTS - merchantMember.points,
        },
        { status: 400 }
      );
    }

    // 6. Check for recent successful payout (prevent double-payout within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentPayout = await prisma.rewardTransaction.findFirst({
      where: {
        memberId,
        merchantMemberId: merchantMember.id,
        type: 'PAYOUT',
        status: 'SUCCESS',
        createdAt: {
          gte: oneHourAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentPayout) {
      const nextAllowedTime = new Date(recentPayout.createdAt.getTime() + 60 * 60 * 1000);
      const minutesRemaining = Math.ceil((nextAllowedTime.getTime() - Date.now()) / (60 * 1000));

      return NextResponse.json(
        {
          error: 'You recently claimed a payout. Please wait before claiming again.',
          nextAllowedAt: nextAllowedTime.toISOString(),
          minutesRemaining,
        },
        { status: 429 }
      );
    }

    // 7. Send USDC to member's wallet using merchant's payout wallet
    console.log(
      `[Payout] Merchant ${merchant.slug} sending ${PAYOUT_AMOUNT_USD} USDC to ${merchantMember.walletAddress} on ${PAYOUT_NETWORK}`
    );

    const result = await sendUSDC(
      payoutPrivateKey,
      merchantMember.walletAddress,
      PAYOUT_AMOUNT_USD,
      PAYOUT_NETWORK
    );

    if (!result.success) {
      // Log failed transaction
      await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          businessId,
          memberId,
          type: 'PAYOUT',
          amount: MILESTONE_POINTS,
          status: 'FAILED',
          reason: result.error || 'Unknown error',
          txHash: null,
        },
      });

      return NextResponse.json(
        {
          error: 'Payout failed. Please try again or contact support.',
          ...(process.env.NODE_ENV === 'development' && { details: result.error })
        },
        { status: 500 }
      );
    }

    // 8. Deduct points from MerchantMember (merchant-level aggregation)
    const updatedMerchantMember = await prisma.merchantMember.update({
      where: {
        merchantId_memberId: {
          merchantId: merchant.id,
          memberId,
        },
      },
      data: {
        points: {
          decrement: MILESTONE_POINTS,
        },
      },
    });

    // 9. Create transaction record
    const transaction = await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId,
        memberId,
        type: 'PAYOUT',
        amount: MILESTONE_POINTS,
        status: 'SUCCESS',
        reason: `Payout of $${PAYOUT_AMOUNT_USD} USDC`,
        txHash: result.txHash || null,
      },
    });

    // 10. Log event
    await prisma.event.create({
      data: {
        merchantId: merchant.id,
        memberId,
        type: 'PAYOUT_CLAIMED',
        metadata: {
          businessId,
          pointsDeducted: MILESTONE_POINTS,
          usdcAmount: PAYOUT_AMOUNT_USD,
          txHash: result.txHash,
          walletAddress: merchantMember.walletAddress,
          newBalance: updatedMerchantMember.points,
        },
      },
    });

    console.log(`[Payout] Success! TxHash: ${result.txHash}`);

    // Send payout success email to member
    await sendPayoutSuccessEmail({
      memberEmail: merchantMember.member.email,
      merchantName: merchant.name,
      amount: PAYOUT_AMOUNT_USD,
      points: MILESTONE_POINTS,
      walletAddress: merchantMember.walletAddress,
      txHash: result.txHash,
      network: PAYOUT_NETWORK,
    });

    // Log email event
    await prisma.event.create({
      data: {
        merchantId: merchant.id,
        memberId,
        type: 'EMAIL_SENT',
        source: 'payout-success',
        metadata: {
          emailType: 'payout-success',
          amount: PAYOUT_AMOUNT_USD,
          txHash: result.txHash,
        },
      },
    });

    // Send payout success email to member
    const explorerUrl = process.env.NODE_ENV === 'production'
      ? `https://polygonscan.com/tx/${result.txHash}`
      : `https://mumbai.polygonscan.com/tx/${result.txHash}`;

    try {
      const emailHtml = generatePayoutSuccessEmail({
        firstName: merchantMember.member.firstName || 'Member',
        lastName: merchantMember.member.lastName || '',
        businessName: business.name,
        amount: PAYOUT_AMOUNT_USD,
        pointsDeducted: MILESTONE_POINTS,
        newPointsBalance: updatedMerchantMember.points,
        txHash: result.txHash!,
        explorerUrl,
        walletAddress: merchantMember.walletAddress,
      });

      await sendEmail({
        to: merchantMember.member.email,
        subject: `✅ Your $${PAYOUT_AMOUNT_USD} USDC Payout is Complete!`,
        html: emailHtml,
      });

      console.log('[Payout] Success email sent to:', merchantMember.member.email);
    } catch (emailError: any) {
      console.error('[Payout] Failed to send success email:', emailError);
      // Don't fail the payout if email fails
    }

    return NextResponse.json({
      success: true,
      message: `${PAYOUT_AMOUNT_USD} USDC sent successfully!`,
      transaction: {
        txHash: result.txHash,
        amount: PAYOUT_AMOUNT_USD,
        pointsDeducted: MILESTONE_POINTS,
        newPointsBalance: updatedMerchantMember.points,
        explorerUrl,
      },
    });

  } catch (error: any) {
    console.error('[Payout] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error processing payout',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rewards/payout?merchantSlug=xxx&memberId=xxx&businessId=xxx
 *
 * Check if member is eligible for payout
 * Points are aggregated at merchant level via MerchantMember
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantSlug = searchParams.get('merchantSlug');
    const memberId = searchParams.get('memberId');

    if (!merchantSlug || !memberId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get merchant to check payout settings
    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Get MerchantMember for merchant-level points and wallet
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId: merchant.id,
          memberId,
        },
      },
    });

    if (!merchantMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Use merchant's configurable settings
    const MILESTONE_POINTS = merchant.payoutMilestonePoints;
    const PAYOUT_AMOUNT_USD = merchant.payoutAmountUSD;

    const isEligible = merchantMember.points >= MILESTONE_POINTS;
    const hasWallet = !!merchantMember.walletAddress;
    const payoutEnabled = merchant.payoutEnabled;

    return NextResponse.json({
      eligible: isEligible && hasWallet && payoutEnabled,
      currentPoints: merchantMember.points,
      tier: merchantMember.tier,
      pointsNeeded: Math.max(0, MILESTONE_POINTS - merchantMember.points),
      milestonePoints: MILESTONE_POINTS,
      payoutAmount: PAYOUT_AMOUNT_USD,
      hasWallet,
      walletAddress: merchantMember.walletAddress,
      payoutEnabled,
      message: !payoutEnabled
        ? 'Merchant has not enabled payouts yet'
        : undefined,
    });

  } catch (error: any) {
    console.error('[Payout] Error checking eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
