import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyWebhookSignature, getSubscription } from '@/app/lib/paypal/subscriptions';

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

  // Sync status
  await prisma.merchant.update({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      // Map PayPal status to our status
      subscriptionStatus: mapPayPalStatus(subscription.status),
    },
  });
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

  await prisma.merchant.update({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  // TODO: Send payment failed email
  console.log(`[PayPal] TODO: Send payment failed email for subscription ${subscriptionId}`);
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

  // Mark as past due
  await prisma.merchant.update({
    where: { paypalSubscriptionId: billingAgreementId },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  // TODO: Send payment failed email
  console.log(`[PayPal] TODO: Send payment failed email for subscription ${billingAgreementId}`);
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
