import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/app/lib/paypal/subscriptions';
import { prisma } from '@/app/lib/prisma';

// PayPal Plan IDs (from .env)
const PAYPAL_PLANS = {
  BASIC_MONTHLY: process.env.PAYPAL_PLAN_BASIC_MONTHLY,
  PREMIUM_MONTHLY: process.env.PAYPAL_PLAN_PREMIUM_MONTHLY,
  BASIC_ANNUAL: process.env.PAYPAL_PLAN_BASIC_ANNUAL,
  PREMIUM_ANNUAL: process.env.PAYPAL_PLAN_PREMIUM_ANNUAL,
};

export type PlanType = 'BASIC_MONTHLY' | 'PREMIUM_MONTHLY' | 'BASIC_ANNUAL' | 'PREMIUM_ANNUAL';

/**
 * POST /api/merchant/subscription/create
 *
 * Creates a PayPal subscription and returns approval URL
 *
 * Request body:
 * {
 *   merchantId: string;
 *   planType: 'BASIC_MONTHLY' | 'PREMIUM_MONTHLY' | 'BASIC_ANNUAL' | 'PREMIUM_ANNUAL';
 *   email: string;
 *   firstName: string;
 *   lastName: string;
 * }
 *
 * Response:
 * {
 *   subscriptionId: string;
 *   approvalUrl: string; // Redirect user here to complete payment
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { merchantId, planType, email, firstName, lastName } = await req.json();

    // Validation
    if (!merchantId || !planType || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, planType, email' },
        { status: 400 }
      );
    }

    if (!Object.keys(PAYPAL_PLANS).includes(planType)) {
      return NextResponse.json(
        { error: `Invalid plan type. Must be one of: ${Object.keys(PAYPAL_PLANS).join(', ')}` },
        { status: 400 }
      );
    }

    // Get plan ID
    const planId = PAYPAL_PLANS[planType as PlanType];
    if (!planId) {
      return NextResponse.json(
        { error: `Plan ${planType} not configured. Add PAYPAL_PLAN_${planType} to .env` },
        { status: 500 }
      );
    }

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        loginEmail: true,
        paypalSubscriptionId: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if merchant already has active subscription
    if (merchant.paypalSubscriptionId) {
      return NextResponse.json(
        {
          error: 'Merchant already has an active subscription',
          subscriptionId: merchant.paypalSubscriptionId,
        },
        { status: 400 }
      );
    }

    // Create PayPal subscription
    const { subscription, approvalUrl } = await createSubscription({
      plan_id: planId,
      subscriber: {
        email_address: email,
        name: firstName && lastName ? {
          given_name: firstName,
          surname: lastName,
        } : undefined,
      },
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/signup/success?merchantId=${merchantId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/signup/cancel?merchantId=${merchantId}`,
      custom_id: merchantId, // Link PayPal subscription to our merchant
    });

    console.log(`[PayPal] Created subscription ${subscription.id} for merchant ${merchantId}`);

    // Store subscription ID in database (status will be APPROVAL_PENDING)
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        paypalSubscriptionId: subscription.id,
        subscriptionStatus: 'TRIAL', // Will be updated by webhook
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('[PayPal] Subscription creation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create subscription',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
