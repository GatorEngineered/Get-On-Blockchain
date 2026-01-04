// src/app/api/merchant/subscription/cancel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { cancelSubscription } from '@/app/lib/paypal/subscriptions';

/**
 * POST /api/merchant/subscription/cancel
 *
 * Cancel merchant's PayPal subscription
 * Note: Cancellation takes effect at the end of the current billing period
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

    const { reason } = await req.json();

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check if merchant has an active subscription
    if (!merchant.paypalSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 400 }
      );
    }

    // Cancel subscription via PayPal API
    try {
      await cancelSubscription(
        merchant.paypalSubscriptionId,
        reason || 'Merchant requested cancellation'
      );
    } catch (paypalError: any) {
      console.error('[Cancel Subscription] PayPal API error:', paypalError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription with PayPal', details: paypalError.message },
        { status: 500 }
      );
    }

    // Calculate subscription end date (end of current billing period)
    // For simplicity, set it to 30 days from now for monthly plans
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30);

    // Update merchant in database
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        subscriptionStatus: 'CANCELED',
        cancelAtPeriodEnd: true,
        subscriptionEndsAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully. Your access will continue until the end of the current billing period.',
      subscriptionEndsAt: updatedMerchant.subscriptionEndsAt,
    });
  } catch (error: any) {
    console.error('[Cancel Subscription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    );
  }
}
