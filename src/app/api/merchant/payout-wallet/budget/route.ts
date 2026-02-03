// src/app/api/merchant/payout-wallet/budget/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * POST /api/merchant/payout-wallet/budget
 *
 * Save monthly budget cap settings for merchant payouts
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    // Parse request body
    const { enabled, monthlyBudget, resetDay } = await req.json();

    // Validate inputs
    if (enabled) {
      if (!monthlyBudget || monthlyBudget <= 0) {
        return NextResponse.json(
          { error: 'Monthly budget must be greater than 0' },
          { status: 400 }
        );
      }
      if (!resetDay || resetDay < 1 || resetDay > 28) {
        return NextResponse.json(
          { error: 'Reset day must be between 1 and 28' },
          { status: 400 }
        );
      }
    }

    // Update merchant
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        monthlyPayoutBudget: enabled ? monthlyBudget : null,
        payoutBudgetResetDay: enabled ? resetDay : null,
        // Reset current month payouts if disabling budget
        ...(enabled ? {} : { currentMonthPayouts: 0 }),
      },
    });

    return NextResponse.json({
      success: true,
      monthlyPayoutBudget: updatedMerchant.monthlyPayoutBudget,
      payoutBudgetResetDay: updatedMerchant.payoutBudgetResetDay,
      currentMonthPayouts: updatedMerchant.currentMonthPayouts,
    });
  } catch (error: any) {
    console.error('[Payout Budget] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save budget settings', details: error.message },
      { status: 500 }
    );
  }
}
