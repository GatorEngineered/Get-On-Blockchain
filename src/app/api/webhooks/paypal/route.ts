import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Plan } from '@prisma/client';
import { verifyWebhookSignature, getSubscription } from '@/app/lib/paypal/subscriptions';
import { getPlanMemberLimit, GRACE_PERIOD_DAYS } from '@/app/lib/plan-limits';
import {
  sendPaymentFailedNotification,
  sendAdminPlanUpgradeNotification,
  sendAdminPlanDowngradeNotification,
  sendAdminSubscriptionCancelledNotification,
  sendPaymentReceiptEmail,
} from '@/lib/email/notifications';

// Plan prices for receipts
const PLAN_PRICES: Record<string, { monthly: string; annual: string }> = {
  BASIC: { monthly: '$49.00', annual: '$490.00' },
  PREMIUM: { monthly: '$99.00', annual: '$990.00' },
  GROWTH: { monthly: '$149.00', annual: '$1,490.00' },
  PRO: { monthly: '$199.00', annual: '$1,990.00' },
};

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
  const merchantId = resource.custom_id; // Our merchant ID passed during subscription creation

  console.log(`[PayPal] Subscription activated: ${subscriptionId} for merchant ${merchantId}`);

  if (!merchantId) {
    console.error('[PayPal] No custom_id (merchantId) found in subscription resource');
    return;
  }

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

  // Get merchant by ID (from custom_id) to check previous plan
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { businesses: { take: 1 } },
  });

  if (!merchant) {
    console.error(`[PayPal] Merchant not found for ID: ${merchantId}`);
    return;
  }

  const previousPlan = merchant.plan || 'STARTER';
  const newPlan = getPlanFromPayPalPlanId(subscription.plan_id);
  const isAnnual = subscription.plan_id === process.env.PAYPAL_PLAN_BASIC_ANNUAL ||
                   subscription.plan_id === process.env.PAYPAL_PLAN_PREMIUM_ANNUAL ||
                   subscription.plan_id === process.env.PAYPAL_PLAN_GROWTH_ANNUAL;

  // Update merchant with subscription ID and plan
  // This is where we save the subscription ID - only after payment is confirmed
  await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      paypalSubscriptionId: subscriptionId,
      subscriptionStatus: status,
      trialEndsAt,
      plan: newPlan,
      paymentVerified: status === 'ACTIVE', // Trial = false, Active = true
    },
  });

  console.log(`[PayPal] Merchant ${merchantId} updated: subscriptionId=${subscriptionId}, status=${status}, plan=${newPlan}, trial=${trialEndsAt}`);

  // Send admin notification for new subscription (upgrade from Starter or new signup)
  if (previousPlan !== newPlan) {
    const planPrice = PLAN_PRICES[newPlan] || { monthly: '$0', annual: '$0' };

    sendAdminPlanUpgradeNotification({
      merchantName: merchant.name,
      businessName: merchant.businesses[0]?.name || merchant.name,
      ownerEmail: merchant.loginEmail,
      previousPlan,
      newPlan,
      billingCycle: isAnnual ? 'annual' : 'monthly',
      amount: isAnnual ? planPrice.annual : planPrice.monthly,
    }).catch((err) => {
      console.error('[PayPal] Failed to send admin upgrade notification:', err);
    });
  }
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
    include: { businesses: { take: 1 } },
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
  const isAnnual = subscription.plan_id === process.env.PAYPAL_PLAN_BASIC_ANNUAL ||
                   subscription.plan_id === process.env.PAYPAL_PLAN_PREMIUM_ANNUAL ||
                   subscription.plan_id === process.env.PAYPAL_PLAN_GROWTH_ANNUAL;

  // Prepare update data
  const updateData: any = {
    subscriptionStatus: mapPayPalStatus(subscription.status),
  };

  // If plan changed
  let gracePeriodEndsAt: Date | null = null;
  if (newPlan !== oldPlan) {
    updateData.plan = newPlan;

    if (isDowngrade) {
      // Set grace period for downgrade
      gracePeriodEndsAt = new Date();
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

  // Send admin notifications for plan changes
  if (newPlan !== oldPlan) {
    const planPrice = PLAN_PRICES[newPlan] || { monthly: '$0', annual: '$0' };

    if (isUpgrade) {
      sendAdminPlanUpgradeNotification({
        merchantName: merchant.name,
        businessName: merchant.businesses[0]?.name || merchant.name,
        ownerEmail: merchant.loginEmail,
        previousPlan: oldPlan,
        newPlan,
        billingCycle: isAnnual ? 'annual' : 'monthly',
        amount: isAnnual ? planPrice.annual : planPrice.monthly,
      }).catch((err) => {
        console.error('[PayPal] Failed to send admin upgrade notification:', err);
      });
    } else if (isDowngrade) {
      sendAdminPlanDowngradeNotification({
        merchantName: merchant.name,
        businessName: merchant.businesses[0]?.name || merchant.name,
        ownerEmail: merchant.loginEmail,
        previousPlan: oldPlan,
        newPlan,
        gracePeriodEndsAt: gracePeriodEndsAt || undefined,
      }).catch((err) => {
        console.error('[PayPal] Failed to send admin downgrade notification:', err);
      });
    }
  }
}

/**
 * Map PayPal plan ID to our plan enum
 */
function getPlanFromPayPalPlanId(planId: string): Plan {
  // Map PayPal plan IDs to our plan names
  const planMap: Record<string, Plan> = {
    [process.env.PAYPAL_PLAN_BASIC_MONTHLY || '']: Plan.BASIC,
    [process.env.PAYPAL_PLAN_BASIC_ANNUAL || '']: Plan.BASIC,
    [process.env.PAYPAL_PLAN_PREMIUM_MONTHLY || '']: Plan.PREMIUM,
    [process.env.PAYPAL_PLAN_PREMIUM_ANNUAL || '']: Plan.PREMIUM,
    [process.env.PAYPAL_PLAN_GROWTH_MONTHLY || '']: Plan.GROWTH,
    [process.env.PAYPAL_PLAN_GROWTH_ANNUAL || '']: Plan.GROWTH,
    [process.env.PAYPAL_PLAN_PRO_MONTHLY || '']: Plan.PRO,
    [process.env.PAYPAL_PLAN_PRO_ANNUAL || '']: Plan.PRO,
  };

  return planMap[planId] || Plan.STARTER;
}

/**
 * BILLING.SUBSCRIPTION.CANCELLED
 * Customer cancelled subscription
 */
async function handleSubscriptionCancelled(resource: any) {
  const subscriptionId = resource.id;

  console.log(`[PayPal] Subscription cancelled: ${subscriptionId}`);

  // Get merchant before update for notification
  const merchant = await prisma.merchant.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
    include: { businesses: { take: 1 } },
  });

  // Get subscription details for billing end date
  const subscription = await getSubscription(subscriptionId);
  const accessEndsAt = subscription.billing_info?.next_billing_time
    ? new Date(subscription.billing_info.next_billing_time)
    : undefined;

  await prisma.merchant.update({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: 'CANCELED',
      cancelAtPeriodEnd: true,
      subscriptionEndsAt: accessEndsAt,
    },
  });

  // Send admin notification
  if (merchant) {
    sendAdminSubscriptionCancelledNotification({
      merchantName: merchant.name,
      businessName: merchant.businesses[0]?.name || merchant.name,
      ownerEmail: merchant.loginEmail,
      plan: merchant.plan,
      accessEndsAt,
    }).catch((err) => {
      console.error('[PayPal] Failed to send admin cancellation notification:', err);
    });
  }
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

  // Get merchant for receipt
  const merchant = await prisma.merchant.findUnique({
    where: { paypalSubscriptionId: billingAgreementId },
    include: { businesses: { take: 1 } },
  });

  // Update merchant payment status
  await prisma.merchant.update({
    where: { paypalSubscriptionId: billingAgreementId },
    data: {
      paymentVerified: true,
      subscriptionStatus: 'ACTIVE',
    },
  });

  // Send payment receipt email
  if (merchant) {
    const subscription = await getSubscription(billingAgreementId);
    const amount = resource.amount?.total || subscription.billing_info?.last_payment?.amount?.value || '0';
    const isAnnual = subscription.plan_id === process.env.PAYPAL_PLAN_BASIC_ANNUAL ||
                     subscription.plan_id === process.env.PAYPAL_PLAN_PREMIUM_ANNUAL ||
                     subscription.plan_id === process.env.PAYPAL_PLAN_GROWTH_ANNUAL;
    const nextBillingDate = subscription.billing_info?.next_billing_time
      ? new Date(subscription.billing_info.next_billing_time).toLocaleDateString()
      : undefined;

    sendPaymentReceiptEmail({
      merchantEmail: merchant.loginEmail,
      merchantName: merchant.name,
      businessName: merchant.businesses[0]?.name || merchant.name,
      plan: merchant.plan,
      amount: `$${amount}`,
      billingCycle: isAnnual ? 'annual' : 'monthly',
      nextBillingDate,
      subscriptionId: billingAgreementId,
    }).catch((err) => {
      console.error('[PayPal] Failed to send payment receipt:', err);
    });
  }
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
