// src/app/api/merchant/subscription/details/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { getSubscription } from '@/app/lib/paypal/subscriptions';

/**
 * GET /api/merchant/subscription/details
 *
 * Get merchant's current subscription details from PayPal
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

    // If no PayPal subscription ID, return basic merchant info
    if (!merchant.paypalSubscriptionId) {
      return NextResponse.json({
        plan: merchant.plan,
        subscriptionStatus: merchant.subscriptionStatus,
        trialEndsAt: merchant.trialEndsAt,
        subscriptionEndsAt: merchant.subscriptionEndsAt,
        cancelAtPeriodEnd: merchant.cancelAtPeriodEnd,
        paymentVerified: merchant.paymentVerified,
        hasSubscription: false,
      });
    }

    // Fetch subscription details from PayPal
    try {
      const paypalSubscription = await getSubscription(merchant.paypalSubscriptionId);

      return NextResponse.json({
        plan: merchant.plan,
        subscriptionStatus: merchant.subscriptionStatus,
        trialEndsAt: merchant.trialEndsAt,
        subscriptionEndsAt: merchant.subscriptionEndsAt,
        cancelAtPeriodEnd: merchant.cancelAtPeriodEnd,
        paymentVerified: merchant.paymentVerified,
        hasSubscription: true,
        paypalSubscription: {
          id: paypalSubscription.id,
          status: paypalSubscription.status,
          planId: paypalSubscription.plan_id,
          startTime: paypalSubscription.start_time,
          nextBillingTime: paypalSubscription.billing_info?.next_billing_time,
          lastPayment: paypalSubscription.billing_info?.last_payment,
          subscriber: paypalSubscription.subscriber,
        },
      });
    } catch (error: any) {
      console.error('[Subscription Details] PayPal API error:', error);

      // Return database info even if PayPal call fails
      return NextResponse.json({
        plan: merchant.plan,
        subscriptionStatus: merchant.subscriptionStatus,
        trialEndsAt: merchant.trialEndsAt,
        subscriptionEndsAt: merchant.subscriptionEndsAt,
        cancelAtPeriodEnd: merchant.cancelAtPeriodEnd,
        paymentVerified: merchant.paymentVerified,
        hasSubscription: true,
        error: 'Could not fetch latest subscription details from PayPal',
      });
    }
  } catch (error: any) {
    console.error('[Subscription Details] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details', details: error.message },
      { status: 500 }
    );
  }
}
