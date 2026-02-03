// src/app/api/merchant/payout-wallet/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * GET /api/merchant/payout-wallet/stats
 *
 * Get payout statistics and history for merchant
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get all MerchantMembers for this merchant
    const merchantMembers = await prisma.merchantMember.findMany({
      where: { merchantId },
      select: { id: true },
    });

    const merchantMemberIds = merchantMembers.map(mm => mm.id);

    // Get all successful payout transactions
    const payoutTransactions = await prisma.rewardTransaction.findMany({
      where: {
        merchantMemberId: {
          in: merchantMemberIds,
        },
        type: 'PAYOUT',
        status: 'SUCCESS',
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        business: {
          select: {
            name: true,
            locationNickname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Last 50 payouts
    });

    // Calculate total amount paid out
    const totalPaidOut = payoutTransactions.reduce((sum, tx) => {
      return sum + (tx.usdcAmount || 0);
    }, 0);

    // Count total payouts
    const totalPayouts = payoutTransactions.length;

    // Format recent payouts for display
    const recentPayouts = payoutTransactions.slice(0, 10).map(tx => ({
      id: tx.id,
      memberName: `${tx.member.firstName} ${tx.member.lastName}`.trim() || tx.member.email,
      memberEmail: tx.member.email,
      amount: tx.usdcAmount,
      pointsDeducted: tx.pointsDeducted,
      location: tx.business.locationNickname || tx.business.name,
      txHash: tx.txHash,
      createdAt: tx.createdAt,
      walletAddress: tx.walletAddress,
    }));

    return NextResponse.json({
      walletAddress: merchant.payoutWalletAddress,
      payoutEnabled: merchant.payoutEnabled,
      payoutAmountUSD: merchant.payoutAmountUSD,
      payoutMilestonePoints: merchant.payoutMilestonePoints,
      totalPaidOut: parseFloat(totalPaidOut.toFixed(2)),
      totalPayouts,
      // Monthly Budget Cap
      monthlyPayoutBudget: merchant.monthlyPayoutBudget,
      payoutBudgetResetDay: merchant.payoutBudgetResetDay,
      currentMonthPayouts: merchant.currentMonthPayouts,
      lastBudgetResetAt: merchant.lastBudgetResetAt?.toISOString() || null,
      recentPayouts,
    });
  } catch (error: any) {
    console.error('[Payout Wallet Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout statistics', details: error.message },
      { status: 500 }
    );
  }
}
