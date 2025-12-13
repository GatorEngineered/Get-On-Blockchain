// src/app/api/rewards/payout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendUSDC } from '@/lib/blockchain/polygon';
import { decrypt } from '@/lib/crypto/encryption';
import { sendPayoutSuccessEmail } from '@/lib/email/notifications';

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
 * Request payout for reaching milestone (100 points = $5 USDC)
 *
 * Body:
 * - merchantSlug: string
 * - memberId: string
 * - businessId: string
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
    const rateLimitKey = `payout:${memberId}:${businessId}`;
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

    // 2. Get member's business relationship
    const businessMember = await prisma.businessMember.findUnique({
      where: {
        businessId_memberId: {
          businessId,
          memberId,
        },
      },
      include: {
        member: true,
        business: true,
      },
    });

    if (!businessMember) {
      return NextResponse.json(
        { error: 'Member not found for this business' },
        { status: 404 }
      );
    }

    // 3. Check if member has wallet connected
    if (!businessMember.walletAddress) {
      return NextResponse.json(
        {
          error: 'No wallet connected. Please connect a wallet first.',
          action: 'CONNECT_WALLET'
        },
        { status: 400 }
      );
    }

    // 4. Check if member has enough points
    if (businessMember.points < MILESTONE_POINTS) {
      return NextResponse.json(
        {
          error: `Insufficient points. Need ${MILESTONE_POINTS}, have ${businessMember.points}`,
          pointsNeeded: MILESTONE_POINTS - businessMember.points,
        },
        { status: 400 }
      );
    }

    // 5. Check for recent successful payout (prevent double-payout within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentPayout = await prisma.rewardTransaction.findFirst({
      where: {
        businessId,
        memberId,
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

    // 6. Send USDC to member's wallet using merchant's payout wallet
    console.log(
      `[Payout] Merchant ${merchant.slug} sending ${PAYOUT_AMOUNT_USD} USDC to ${businessMember.walletAddress} on ${PAYOUT_NETWORK}`
    );

    const result = await sendUSDC(
      payoutPrivateKey,
      businessMember.walletAddress,
      PAYOUT_AMOUNT_USD,
      PAYOUT_NETWORK
    );

    if (!result.success) {
      // Log failed transaction
      await prisma.rewardTransaction.create({
        data: {
          businessMemberId: businessMember.id,
          businessId,
          memberId,
          type: 'PAYOUT',
          amount: MILESTONE_POINTS, // Keep for backwards compatibility
          pointsDeducted: MILESTONE_POINTS,
          usdcAmount: PAYOUT_AMOUNT_USD,
          status: 'FAILED',
          errorMessage: result.error,
          walletAddress: businessMember.walletAddress,
          walletNetwork: businessMember.walletNetwork || 'polygon',
        },
      });

      return NextResponse.json(
        {
          error: 'Payout failed. Please try again or contact support.',
          details: result.error
        },
        { status: 500 }
      );
    }

    // 7. Deduct points and record successful transaction
    const updatedMember = await prisma.businessMember.update({
      where: {
        businessId_memberId: {
          businessId,
          memberId,
        },
      },
      data: {
        points: {
          decrement: MILESTONE_POINTS,
        },
      },
    });

    // 8. Create transaction record
    const transaction = await prisma.rewardTransaction.create({
      data: {
        businessMemberId: businessMember.id,
        businessId,
        memberId,
        type: 'PAYOUT',
        amount: MILESTONE_POINTS, // Keep for backwards compatibility
        pointsDeducted: MILESTONE_POINTS,
        usdcAmount: PAYOUT_AMOUNT_USD,
        status: 'SUCCESS',
        txHash: result.txHash,
        walletAddress: businessMember.walletAddress,
        walletNetwork: businessMember.walletNetwork || 'polygon',
      },
    });

    // 9. Log event
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
          walletAddress: businessMember.walletAddress,
          newBalance: updatedMember.points,
        },
      },
    });

    console.log(`[Payout] Success! TxHash: ${result.txHash}`);

    // Send payout success email to member
    await sendPayoutSuccessEmail({
      memberEmail: businessMember.member.email,
      merchantName: merchant.name,
      amount: PAYOUT_AMOUNT_USD,
      points: MILESTONE_POINTS,
      walletAddress: businessMember.walletAddress,
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

    return NextResponse.json({
      success: true,
      message: `${PAYOUT_AMOUNT_USD} USDC sent successfully!`,
      transaction: {
        txHash: result.txHash,
        amount: PAYOUT_AMOUNT_USD,
        pointsDeducted: MILESTONE_POINTS,
        newPointsBalance: updatedMember.points,
        explorerUrl: process.env.NODE_ENV === 'production'
          ? `https://polygonscan.com/tx/${result.txHash}`
          : `https://mumbai.polygonscan.com/tx/${result.txHash}`,
      },
    });

  } catch (error: any) {
    console.error('[Payout] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error processing payout',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rewards/payout?merchantSlug=xxx&memberId=xxx&businessId=xxx
 *
 * Check if member is eligible for payout
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantSlug = searchParams.get('merchantSlug');
    const memberId = searchParams.get('memberId');
    const businessId = searchParams.get('businessId');

    if (!merchantSlug || !memberId || !businessId) {
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

    const businessMember = await prisma.businessMember.findUnique({
      where: {
        businessId_memberId: {
          businessId,
          memberId,
        },
      },
    });

    if (!businessMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Use merchant's configurable settings
    const MILESTONE_POINTS = merchant.payoutMilestonePoints;
    const PAYOUT_AMOUNT_USD = merchant.payoutAmountUSD;

    const isEligible = businessMember.points >= MILESTONE_POINTS;
    const hasWallet = !!businessMember.walletAddress;
    const payoutEnabled = merchant.payoutEnabled;

    return NextResponse.json({
      eligible: isEligible && hasWallet && payoutEnabled,
      currentPoints: businessMember.points,
      pointsNeeded: Math.max(0, MILESTONE_POINTS - businessMember.points),
      milestonePoints: MILESTONE_POINTS,
      payoutAmount: PAYOUT_AMOUNT_USD,
      hasWallet,
      walletAddress: businessMember.walletAddress,
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
