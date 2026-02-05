// src/app/lib/pos/square.ts
// Square-specific POS integration utilities

import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { decrypt, encrypt } from '@/app/lib/crypto/encryption';

// Square API version
const SQUARE_API_VERSION = '2024-01-18';

/**
 * Square payment data extracted from webhook
 */
export interface SquarePaymentData {
  paymentId: string;
  orderId?: string;
  locationId: string;
  customerId?: string;
  totalMoney: {
    amount: number; // In cents
    currency: string;
  };
  receiptEmail?: string;
  receiptUrl?: string;
  createdAt: string;
  status: string;
}

/**
 * Result of processing a Square payment
 */
export interface SquareProcessingResult {
  success: boolean;
  duplicate?: boolean;
  skipped?: boolean;
  reason?: string;
  orderId?: string;
  memberId?: string;
  pointsAwarded?: number;
}

/**
 * Verify Square webhook signature (HMAC-SHA256)
 * Square signs: webhookUrl + body with the signature key
 */
export function verifySquareSignature(
  rawBody: string,
  signature: string,
  webhookUrl: string,
  signatureKey: string
): boolean {
  if (!signatureKey) {
    console.error('[Square] No signature key provided for verification');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', signatureKey);
    hmac.update(webhookUrl + rawBody);
    const expectedSignature = hmac.digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Square] Signature verification error:', error);
    return false;
  }
}

/**
 * Get merchant's webhook signature key by location ID
 */
export async function getMerchantSignatureKey(locationId: string): Promise<string | null> {
  try {
    const merchant = await prisma.merchant.findFirst({
      where: { squareLocationId: locationId },
      select: { squareWebhookSignatureKey: true },
    });

    if (!merchant?.squareWebhookSignatureKey) {
      return null;
    }

    return decrypt(merchant.squareWebhookSignatureKey);
  } catch (error) {
    console.error('[Square] Error getting merchant signature key:', error);
    return null;
  }
}

/**
 * Look up customer email from Square Customer API
 */
export async function lookupSquareCustomerEmail(
  accessToken: string,
  customerId: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://connect.squareup.com/v2/customers/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Square-Version': SQUARE_API_VERSION,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('[Square] Customer lookup failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.customer?.email_address || null;
  } catch (error) {
    console.error('[Square] Customer lookup error:', error);
    return null;
  }
}

/**
 * Refresh Square access token using refresh token
 * Square tokens expire after 30 days
 */
export async function refreshSquareToken(merchantId: string): Promise<boolean> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { squareRefreshToken: true },
    });

    if (!merchant?.squareRefreshToken) {
      console.warn('[Square] No refresh token for merchant:', merchantId);
      return false;
    }

    const refreshToken = decrypt(merchant.squareRefreshToken);

    const response = await fetch('https://connect.squareup.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SQUARE_CLIENT_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('[Square] Token refresh failed:', await response.text());
      return false;
    }

    const tokens = await response.json();

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        squareAccessToken: encrypt(tokens.access_token),
        squareRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      },
    });

    console.log('[Square] Token refreshed for merchant:', merchantId);
    return true;
  } catch (error) {
    console.error('[Square] Token refresh error:', error);
    return false;
  }
}

/**
 * Extract payment data from Square webhook payload
 */
export function extractPaymentData(payload: any): SquarePaymentData | null {
  try {
    const payment = payload.data?.object?.payment;
    if (!payment) {
      console.warn('[Square] No payment object in webhook payload');
      return null;
    }

    return {
      paymentId: payment.id,
      orderId: payment.order_id,
      locationId: payment.location_id,
      customerId: payment.customer_id,
      totalMoney: {
        amount: payment.total_money?.amount || 0,
        currency: payment.total_money?.currency || 'USD',
      },
      receiptEmail: payment.receipt_email,
      receiptUrl: payment.receipt_url,
      createdAt: payment.created_at,
      status: payment.status,
    };
  } catch (error) {
    console.error('[Square] Failed to extract payment data:', error);
    return null;
  }
}

/**
 * Process a Square payment and award loyalty points
 */
export async function processSquarePayment(
  data: SquarePaymentData
): Promise<SquareProcessingResult> {
  console.log('[Square] Processing payment:', data.paymentId);

  // 1. Find merchant by Square location ID
  const merchant = await prisma.merchant.findFirst({
    where: { squareLocationId: data.locationId },
    select: {
      id: true,
      name: true,
      posPointsPerDollar: true,
      welcomePoints: true,
      squareAccessToken: true,
      businesses: { select: { id: true }, take: 1 },
    },
  });

  if (!merchant) {
    console.warn('[Square] No merchant found for location:', data.locationId);
    return { success: false, skipped: true, reason: 'merchant_not_found' };
  }

  // 2. Check for duplicate payment (idempotency)
  const existingOrder = await prisma.externalOrder.findFirst({
    where: {
      merchantId: merchant.id,
      externalId: data.paymentId,
      externalSource: 'square',
    },
  });

  if (existingOrder) {
    console.log('[Square] Duplicate payment, already processed:', data.paymentId);
    return {
      success: true,
      duplicate: true,
      orderId: existingOrder.id,
      memberId: existingOrder.memberId || undefined,
      pointsAwarded: existingOrder.pointsAwarded || 0,
    };
  }

  // 3. Get customer email
  let customerEmail = data.receiptEmail;

  if (!customerEmail && data.customerId && merchant.squareAccessToken) {
    // Look up customer via Square API
    const accessToken = decrypt(merchant.squareAccessToken);
    const lookedUpEmail = await lookupSquareCustomerEmail(accessToken, data.customerId);
    if (lookedUpEmail) {
      customerEmail = lookedUpEmail;
    }
  }

  if (!customerEmail) {
    console.log('[Square] No customer email for payment:', data.paymentId);
    // Create order record anyway for tracking, but skip points
    await prisma.externalOrder.create({
      data: {
        merchantId: merchant.id,
        externalId: data.paymentId,
        externalSource: 'square',
        customerEmail: 'unknown',
        orderTotal: data.totalMoney.amount / 100,
        currency: data.totalMoney.currency,
        orderDate: new Date(data.createdAt),
        status: 'skipped_no_email',
      },
    });
    return { success: false, skipped: true, reason: 'no_customer_email' };
  }

  // 4. Find or create member
  let member = await prisma.member.findUnique({
    where: { email: customerEmail.toLowerCase() },
  });

  let isNewMember = false;
  if (!member) {
    member = await prisma.member.create({
      data: {
        email: customerEmail.toLowerCase(),
        firstName: '',
        lastName: '',
      },
    });
    isNewMember = true;
    console.log('[Square] Created new member:', member.id);
  }

  // 5. Find or create merchant membership
  let merchantMember = await prisma.merchantMember.findFirst({
    where: { merchantId: merchant.id, memberId: member.id },
  });

  if (!merchantMember) {
    merchantMember = await prisma.merchantMember.create({
      data: {
        merchantId: merchant.id,
        memberId: member.id,
        points: isNewMember ? merchant.welcomePoints : 0,
      },
    });
    console.log('[Square] Created merchant membership:', merchantMember.id);
  }

  // 6. Calculate points (amount is in cents, convert to dollars, round to nearest whole number)
  const orderTotal = data.totalMoney.amount / 100;
  const pointsToAward = Math.round(orderTotal * merchant.posPointsPerDollar);

  // 7. Create external order record
  const externalOrder = await prisma.externalOrder.create({
    data: {
      merchantId: merchant.id,
      externalId: data.paymentId,
      externalSource: 'square',
      customerEmail: customerEmail.toLowerCase(),
      memberId: member.id,
      orderTotal,
      currency: data.totalMoney.currency,
      orderDate: new Date(data.createdAt),
      pointsAwarded: pointsToAward,
      pointsAwardedAt: new Date(),
      status: 'processed',
      lineItems: data.orderId ? { squareOrderId: data.orderId } : undefined,
    },
  });

  // 8. Award points to member
  await prisma.merchantMember.update({
    where: { id: merchantMember.id },
    data: {
      points: { increment: pointsToAward },
    },
  });

  // 9. Create reward transaction for audit trail
  if (merchant.businesses.length > 0) {
    await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId: merchant.businesses[0].id,
        memberId: member.id,
        type: 'EARN',
        amount: pointsToAward,
        status: 'SUCCESS',
        reason: `Square payment ${data.paymentId} ($${orderTotal.toFixed(2)})`,
      },
    });
  }

  console.log(
    `[Square] Awarded ${pointsToAward} points to member ${member.id} for payment ${data.paymentId}`
  );

  return {
    success: true,
    orderId: externalOrder.id,
    memberId: member.id,
    pointsAwarded: pointsToAward,
  };
}

/**
 * Register Square webhooks for a merchant
 * Called after OAuth completion to enable automatic points awarding
 */
export async function registerSquareWebhooks(
  accessToken: string,
  merchantId: string
): Promise<{ success: boolean; subscriptionId?: string; errors?: string[] }> {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/square`;

  // Events to subscribe to
  const eventTypes = [
    'payment.completed',
    'payment.updated',
    'refund.created',
  ];

  try {
    console.log('[Square] Registering webhooks for merchant:', merchantId);

    // First, check if webhook already exists to avoid duplicates
    const listResponse = await fetch(
      'https://connect.squareup.com/v2/webhooks/subscriptions',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Square-Version': SQUARE_API_VERSION,
          'Content-Type': 'application/json',
        },
      }
    );

    if (listResponse.ok) {
      const listData = await listResponse.json();
      const existingSubscription = listData.subscriptions?.find(
        (sub: any) => sub.notification_url === webhookUrl && sub.enabled
      );

      if (existingSubscription) {
        console.log('[Square] Webhook already exists:', existingSubscription.id);
        return { success: true, subscriptionId: existingSubscription.id };
      }
    }

    // Create new webhook subscription
    const response = await fetch(
      'https://connect.squareup.com/v2/webhooks/subscriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Square-Version': SQUARE_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idempotency_key: `webhook-${merchantId}-${Date.now()}`,
          subscription: {
            name: 'GetOnBlockchain Loyalty Points',
            enabled: true,
            event_types: eventTypes,
            notification_url: webhookUrl,
            api_version: SQUARE_API_VERSION,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Square] Webhook registration failed:', errorData);
      return {
        success: false,
        errors: errorData.errors?.map((e: any) => e.detail || e.code) || ['Unknown error'],
      };
    }

    const data = await response.json();
    const subscriptionId = data.subscription?.id;

    // Store the signature key from the response for future verification
    // The signature key is in the subscription response
    if (data.subscription?.signature_key) {
      // Store this in the merchant record for webhook verification
      await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          squareWebhookSignatureKey: encrypt(data.subscription.signature_key),
        },
      });
      console.log('[Square] Webhook signature key stored for merchant:', merchantId);
    }

    console.log('[Square] Webhook registered successfully:', subscriptionId);
    return { success: true, subscriptionId };
  } catch (error: any) {
    console.error('[Square] Webhook registration error:', error);
    return { success: false, errors: [error.message] };
  }
}

/**
 * Process a Square refund and deduct points
 */
export async function processSquareRefund(
  paymentId: string,
  refundAmount: number // In cents
): Promise<SquareProcessingResult> {
  console.log('[Square] Processing refund for payment:', paymentId);

  // Find the original order
  const originalOrder = await prisma.externalOrder.findFirst({
    where: {
      externalId: paymentId,
      externalSource: 'square',
      status: 'processed',
    },
    include: {
      merchant: {
        select: {
          id: true,
          posPointsPerDollar: true,
          businesses: { select: { id: true }, take: 1 },
        },
      },
    },
  });

  if (!originalOrder) {
    console.warn('[Square] Original order not found for refund:', paymentId);
    return { success: false, skipped: true, reason: 'original_order_not_found' };
  }

  if (!originalOrder.memberId) {
    console.warn('[Square] No member associated with order:', paymentId);
    return { success: false, skipped: true, reason: 'no_member' };
  }

  // Calculate points to deduct (proportional to refund amount, round to nearest whole number)
  const refundDollars = refundAmount / 100;
  const pointsToDeduct = Math.round(refundDollars * originalOrder.merchant.posPointsPerDollar);

  // Find merchant membership
  const merchantMember = await prisma.merchantMember.findFirst({
    where: {
      merchantId: originalOrder.merchantId,
      memberId: originalOrder.memberId,
    },
  });

  if (!merchantMember) {
    console.warn('[Square] Merchant membership not found for refund');
    return { success: false, skipped: true, reason: 'membership_not_found' };
  }

  // Deduct points (don't go below 0)
  const newPoints = Math.max(0, merchantMember.points - pointsToDeduct);
  await prisma.merchantMember.update({
    where: { id: merchantMember.id },
    data: { points: newPoints },
  });

  // Create transaction record
  if (originalOrder.merchant.businesses.length > 0) {
    await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId: originalOrder.merchant.businesses[0].id,
        memberId: originalOrder.memberId,
        type: 'ADJUST',
        amount: -pointsToDeduct,
        status: 'SUCCESS',
        reason: `Square refund for payment ${paymentId} (-$${refundDollars.toFixed(2)})`,
      },
    });
  }

  // Update original order status
  await prisma.externalOrder.update({
    where: { id: originalOrder.id },
    data: { status: 'refunded' },
  });

  console.log(
    `[Square] Deducted ${pointsToDeduct} points from member ${originalOrder.memberId} for refund`
  );

  return {
    success: true,
    memberId: originalOrder.memberId,
    pointsAwarded: -pointsToDeduct,
  };
}
