import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyWebhookSignature, getSubscription } from '@/app/lib/paypal/subscriptions';
import { getPlanMemberLimit, GRACE_PERIOD_DAYS } from '@/app/lib/plan-limits';
import { sendPaymentFailedNotification } from '@/lib/email/notifications';

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * POST /api/webhooks/paypal
 *
 * Handles PayPal subscription webhook events
 *
 * Important Events:
 * - BILLING.SUBSCRIPTION.ACTIVATED - Subscription activated (after approval)
 * - BILLING.SUBSCRIPTION.UPDATED - Subscription updated
 * - BILLING.SUBSCRIPTION.CANCELLED - Subscription cancelled
 * - BILLING.SUBSCRIPTION.SUSPENDED - Subscription suspended (payment failed)
 * - BILLING.SUBSCRIPTION.EXPIRED - Subscription expired
 * - PAYMENT.SALE.COMPLETED - Payment successful
 * - PAYMENT.SALE.DENIED - Payment failed
 *
 * Docs: https://developer.paypal.com/api/rest/webhooks/event-names/#subscriptions
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headers = {
      'paypal-transmission-id': req.headers.get('paypal-transmission-id') || '',
      'paypal-transmission-time': req.headers.get('paypal-transmission-time') || '',
      'paypal-transmission-sig': req.headers.get('paypal-transmission-sig') || '',
      'paypal-cert-url': req.headers.get('paypal-cert-url') || '',
      'paypal-auth-algo': req.headers.get('paypal-auth-algo') || '',
    };

    console.log(`[PayPal Webhook] Received event: ${body.event_type}`);

    // Verify webhook signature (production only)
    if (process.env.NODE_ENV === 'production' && PAYPAL_WEBHOOK_ID) {
      try {
        const verification = await verifyWebhookSignature({
          webhookId: PAYPAL_WEBHOOK_ID,
          headers,
          body,
        });

        if (verification.verification_status !== 'SUCCESS') {
          console.error('[PayPal Webhook] Signature verification failed');
          return NextResponse.json(
            { error: 'Invalid webhook signature' },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error('[PayPal Webhook] Signature verification error:', error);
        return NextResponse.json(
          { error: 'Webhook verification failed' },
          { status: 401 }
        );
      }
    }

    // Handle event
    const eventType = body.event_type;
    const resource = body.resource;

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(resource);
        break;

      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handleSubscriptionUpdated(resource);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(resource);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(resource);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(resource);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(resource);
        break;

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED':
        await handlePaymentFailed(resource);
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[PayPal Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * BILLING.SUBSCRIPTION.ACTIVATED
 * Subscription activated after customer approval
 */
async function handleSubscriptionActivated(resource: any) {
  const subscriptionId = resource.id;
  const customId = resource.custom_id; // Our merchant ID

  console.log(`[PayPal] Subscription activated: ${subscriptionId}`);

  // Get full subscription details
  const subscription = await getSubscription(subscriptionId);

  // Determine if in trial or active
  let status: 'TRIAL' | 'ACTIVE' = 'ACTIVE';
  let trialEndsAt: Date | null = null;

  if (subscription.billing_info?.cycle_executions) {
    const trialCycle = subscription.billing_info.cycle_executions.find(
      (cycle) => cycle.tenure_type === 'TRIAL'
    );

    if (trialCycle && trialCycle.cycles_completed < trialCycle.cycles_remaining) {
      status = 'TRIAL';
      // Trial is 7 days from start
      const startTime = new Date(subscription.start_time);
      trialEndsAt = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Update merchant
  await prisma.merchant.update({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: status,
      trialEndsAt,
      paymentVerified: status === 'ACTIVE', // Trial = false, Active = true
    },
  });

  console.log(`[PayPal] Merchant updated: status=${status}, trial=${trialEndsAt}`);
}

/**
 * BILLING.SUBSCRIPTION.UPDATED
 * Subscription was updated (plan change, etc.)
 */
async function handleSubscriptionUpdated(resource: any) {
  const subscriptionId = resource.id;

  console.log(`[PayPal] Subscription updated: ${subscriptionId}`);

  // Get full details
  const subscription = await getSubscription(subscriptionId);

  // Get current merchant to check for plan change
  const merchant = await prisma.merchant.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
    select: { id: true, plan: true },
  });

  if (!merchant) {
    console.error(`[PayPal] Merchant not found for subscription: ${subscriptionId}`);
    return;
  }

  // Detect plan change from PayPal plan ID
  const newPlan = getPlanFromPayPalPlanId(subscription.plan_id);
  const oldPlan = merchant.plan;

  // Check if this is a downgrade
  const oldLimit = getPlanMemberLimit(oldPlan);
  const newLimit = getPlanMemberLimit(newPlan);
  const isDowngrade = newLimit < oldLimit;
  const isUpgrade = newLimit > oldLimit;

  // Prepare update data
  const updateData: any = {
    subscriptionStatus: mapPayPalStatus(subscription.status),
  };

  // If plan changed
  if (newPlan !== oldPlan) {
    updateData.plan = newPlan;

    if (isDowngrade) {
      // Set grace period for downgrade
      const gracePeriodEndsAt = new Date();
      gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS);
      updateData.previousPlan = oldPlan;
      updateData.downgradeGracePeriodEndsAt = gracePeriodEndsAt;
      console.log(`[PayPal] Plan downgrade detected: ${oldPlan} -> ${newPlan}, grace period until ${gracePeriodEndsAt}`);
    } else if (isUpgrade) {
      // Clear grace period on upgrade
      updateData.previousPlan = null;
      updateData.downgradeGracePeriodEndsAt = null;
      console.log(`[PayPal] Plan upgrade detected: ${oldPlan} -> ${newPlan}`);
    }
  }

  // Sync status and plan
  await prisma.merchant.update({
    where: { paypalSubscriptionId: subscriptionId },
    data: updateData,
  });
}

/**
 * Map PayPal plan ID to our plan enum
 */
function getPlanFromPayPalPlanId(planId: string): string {
  // Map PayPal plan IDs to our plan names
  const planMap: Record<string, string> = {
    [process.env.PAYPAL_PLAN_BASIC_MONTHLY || '']: 'BASIC',
    [process.env.PAYPAL_PLAN_BASIC_ANNUAL || '']: 'BASIC',
    [process.env.PAYPAL_PLAN_PREMIUM_MONTHLY || '']: 'PREMIUM',
    [process.env.PAYPAL_PLAN_PREMIUM_ANNUAL || '']: 'PREMIUM',
    [process.env.PAYPAL_PLAN_GROWTH_MONTHLY || '']: 'GROWTH',
    [process.env.PAYPAL_PLAN_GROWTH_ANNUAL || '']: 'GROWTH',
    [process.env.PAYPAL_PLAN_PRO_MONTHLY || '']: 'PRO',
    [process.env.PAYPAL_PLAN_PRO_ANNUAL || '']: 'PRO',
  };

  return planMap[planId] || 'STARTER';
}

/**
 * BILLING.SUBSCRIPTION.CANCELLED
 * Customer cancelled subscription
 */
async function handleSubscriptionCancelled(resource: any) {
  const subscriptionId = resource.id;

  console.log(`[PayPal] Subscription cancelled: ${subscriptionId}`);

  await prisma.merchant.update({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: 'CANCELED',
      cancelAtPeriodEnd: true,
    },
  });

  // TODO: Send cancellation email
  console.log(`[PayPal] TODO: Send cancellation email for subscription ${subscriptionId}`);
}

/**
 * BILLING.SUBSCRIPTION.SUSPENDED
 * Subscription suspended (usually payment failed)
 */
async function handleSubscriptionSuspended(resource: any) {
  const subscriptionId = resource.id;

  console.log(`[PayPal] Subscription suspended: ${subscriptionId}`);

  // Get merchant to send email
  const merchant = await prisma.merchant.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
    include: { businesses: { take: 1 } },
  });

  await prisma.merchant.update({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  // Send payment failed email
  if (merchant && merchant.loginEmail) {
    const subscription = await getSubscription(subscriptionId);
    const amount = subscription.billing_info?.last_payment?.amount?.value || '0';

    sendPaymentFailedNotification(merchant.loginEmail, {
      merchantName: merchant.name,
      businessName: merchant.businesses[0]?.name || merchant.name,
      currentPlan: merchant.plan,
      amount: `$${amount}`,
      failureReason: 'Payment was suspended by PayPal. Please check your payment method.',
    }).catch((err) => {
      console.error('[PayPal] Failed to send payment failed email:', err);
    });
  }
}

/**
 * BILLING.SUBSCRIPTION.EXPIRED
 * Subscription expired (trial ended without payment or final billing cycle)
 */
async function handleSubscriptionExpired(resource: any) {
  const subscriptionId = resource.id;

  console.log(`[PayPal] Subscription expired: ${subscriptionId}`);

  await prisma.merchant.update({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: 'EXPIRED',
    },
  });

  // TODO: Send expiration email
  console.log(`[PayPal] TODO: Send expiration email for subscription ${subscriptionId}`);
}

/**
 * PAYMENT.SALE.COMPLETED
 * Payment successful
 */
async function handlePaymentCompleted(resource: any) {
  const billingAgreementId = resource.billing_agreement_id; // subscription ID

  console.log(`[PayPal] Payment completed for subscription: ${billingAgreementId}`);

  // Update merchant payment status
  await prisma.merchant.update({
    where: { paypalSubscriptionId: billingAgreementId },
    data: {
      paymentVerified: true,
      subscriptionStatus: 'ACTIVE',
    },
  });

  // TODO: Send payment receipt email
  console.log(`[PayPal] TODO: Send payment receipt for subscription ${billingAgreementId}`);
}

/**
 * PAYMENT.SALE.DENIED or REFUNDED
 * Payment failed
 */
async function handlePaymentFailed(resource: any) {
  const billingAgreementId = resource.billing_agreement_id;

  console.log(`[PayPal] Payment failed/refunded for subscription: ${billingAgreementId}`);

  // Get merchant to send email
  const merchant = await prisma.merchant.findUnique({
    where: { paypalSubscriptionId: billingAgreementId },
    include: { businesses: { take: 1 } },
  });

  // Mark as past due
  await prisma.merchant.update({
    where: { paypalSubscriptionId: billingAgreementId },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  // Send payment failed email
  if (merchant && merchant.loginEmail) {
    const amount = resource.amount?.total || '0';
    const failureReason = resource.state === 'refunded'
      ? 'Your payment was refunded.'
      : 'Your payment was declined. Please update your payment method.';

    sendPaymentFailedNotification(merchant.loginEmail, {
      merchantName: merchant.name,
      businessName: merchant.businesses[0]?.name || merchant.name,
      currentPlan: merchant.plan,
      amount: `$${amount}`,
      failureReason,
    }).catch((err) => {
      console.error('[PayPal] Failed to send payment failed email:', err);
    });
  }
}

/**
 * Map PayPal subscription status to our internal status
 */
function mapPayPalStatus(
  paypalStatus: string
): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'PAUSED' {
  switch (paypalStatus) {
    case 'ACTIVE':
      return 'ACTIVE';
    case 'SUSPENDED':
      return 'PAST_DUE';
    case 'CANCELLED':
      return 'CANCELED';
    case 'EXPIRED':
      return 'EXPIRED';
    default:
      return 'TRIAL';
  }
}
