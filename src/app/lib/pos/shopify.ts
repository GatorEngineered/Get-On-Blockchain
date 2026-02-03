// src/app/lib/pos/shopify.ts
// Shopify-specific POS integration utilities

import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { decrypt } from '@/app/lib/crypto/encryption';

// Shopify API version
const SHOPIFY_API_VERSION = '2024-01';

/**
 * Shopify order data extracted from webhook
 */
export interface ShopifyOrderData {
  orderId: string;
  orderNumber: string;
  shopDomain: string;
  customerEmail?: string;
  totalPrice: number; // In dollars (Shopify sends as string)
  currency: string;
  financialStatus: string;
  createdAt: string;
  customer?: {
    id: number;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Result of processing a Shopify order
 */
export interface ShopifyProcessingResult {
  success: boolean;
  duplicate?: boolean;
  skipped?: boolean;
  reason?: string;
  orderId?: string;
  memberId?: string;
  pointsAwarded?: number;
}

/**
 * Verify Shopify webhook signature (HMAC-SHA256)
 * Shopify signs the raw body with the shared secret
 */
export function verifyShopifySignature(
  rawBody: string,
  signature: string,
  sharedSecret: string
): boolean {
  if (!sharedSecret) {
    console.error('[Shopify] Webhook shared secret not configured');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', sharedSecret);
    hmac.update(rawBody, 'utf8');
    const expectedSignature = hmac.digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Shopify] Signature verification error:', error);
    return false;
  }
}

/**
 * Extract order data from Shopify webhook payload
 */
export function extractShopifyOrderData(
  payload: any,
  shopDomain: string
): ShopifyOrderData | null {
  try {
    if (!payload || !payload.id) {
      console.warn('[Shopify] No order object in webhook payload');
      return null;
    }

    return {
      orderId: String(payload.id),
      orderNumber: payload.order_number ? String(payload.order_number) : String(payload.id),
      shopDomain,
      customerEmail: payload.email || payload.customer?.email,
      totalPrice: parseFloat(payload.total_price) || 0,
      currency: payload.currency || 'USD',
      financialStatus: payload.financial_status || 'unknown',
      createdAt: payload.created_at,
      customer: payload.customer
        ? {
            id: payload.customer.id,
            email: payload.customer.email,
            firstName: payload.customer.first_name,
            lastName: payload.customer.last_name,
          }
        : undefined,
    };
  } catch (error) {
    console.error('[Shopify] Failed to extract order data:', error);
    return null;
  }
}

/**
 * Process a Shopify order and award loyalty points
 */
export async function processShopifyOrder(
  data: ShopifyOrderData
): Promise<ShopifyProcessingResult> {
  console.log('[Shopify] Processing order:', data.orderId);

  // 1. Find merchant by Shopify shop domain
  const merchant = await prisma.merchant.findFirst({
    where: { shopifyShopDomain: data.shopDomain },
    select: {
      id: true,
      name: true,
      posPointsPerDollar: true,
      welcomePoints: true,
      shopifyAccessToken: true,
      businesses: { select: { id: true }, take: 1 },
    },
  });

  if (!merchant) {
    console.warn('[Shopify] No merchant found for shop:', data.shopDomain);
    return { success: false, skipped: true, reason: 'merchant_not_found' };
  }

  // 2. Check for duplicate order (idempotency)
  const existingOrder = await prisma.externalOrder.findFirst({
    where: {
      merchantId: merchant.id,
      externalId: data.orderId,
      externalSource: 'shopify',
    },
  });

  if (existingOrder) {
    console.log('[Shopify] Duplicate order, already processed:', data.orderId);
    return {
      success: true,
      duplicate: true,
      orderId: existingOrder.id,
      memberId: existingOrder.memberId || undefined,
      pointsAwarded: existingOrder.pointsAwarded || 0,
    };
  }

  // 3. Get customer email
  const customerEmail = data.customerEmail;

  if (!customerEmail) {
    console.log('[Shopify] No customer email for order:', data.orderId);
    // Create order record anyway for tracking, but skip points
    await prisma.externalOrder.create({
      data: {
        merchantId: merchant.id,
        externalId: data.orderId,
        externalSource: 'shopify',
        customerEmail: 'unknown',
        orderTotal: data.totalPrice,
        currency: data.currency,
        orderDate: new Date(data.createdAt),
        status: 'skipped_no_email',
        lineItems: { shopifyOrderNumber: data.orderNumber },
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
        firstName: data.customer?.firstName || '',
        lastName: data.customer?.lastName || '',
      },
    });
    isNewMember = true;
    console.log('[Shopify] Created new member:', member.id);
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
    console.log('[Shopify] Created merchant membership:', merchantMember.id);
  }

  // 6. Calculate points (total_price is already in dollars, round to nearest whole number)
  const pointsToAward = Math.round(data.totalPrice * merchant.posPointsPerDollar);

  // 7. Create external order record
  const externalOrder = await prisma.externalOrder.create({
    data: {
      merchantId: merchant.id,
      externalId: data.orderId,
      externalSource: 'shopify',
      customerEmail: customerEmail.toLowerCase(),
      memberId: member.id,
      orderTotal: data.totalPrice,
      currency: data.currency,
      orderDate: new Date(data.createdAt),
      pointsAwarded: pointsToAward,
      pointsAwardedAt: new Date(),
      status: 'processed',
      lineItems: { shopifyOrderNumber: data.orderNumber },
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
        reason: `Shopify order #${data.orderNumber} ($${data.totalPrice.toFixed(2)})`,
      },
    });
  }

  console.log(
    `[Shopify] Awarded ${pointsToAward} points to member ${member.id} for order ${data.orderId}`
  );

  return {
    success: true,
    orderId: externalOrder.id,
    memberId: member.id,
    pointsAwarded: pointsToAward,
  };
}

/**
 * Process a Shopify refund and deduct points
 */
export async function processShopifyRefund(
  orderId: string,
  refundAmount: number, // In dollars
  shopDomain: string
): Promise<ShopifyProcessingResult> {
  console.log('[Shopify] Processing refund for order:', orderId);

  // Find the original order
  const originalOrder = await prisma.externalOrder.findFirst({
    where: {
      externalId: orderId,
      externalSource: 'shopify',
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
    console.warn('[Shopify] Original order not found for refund:', orderId);
    return { success: false, skipped: true, reason: 'original_order_not_found' };
  }

  if (!originalOrder.memberId) {
    console.warn('[Shopify] No member associated with order:', orderId);
    return { success: false, skipped: true, reason: 'no_member' };
  }

  // Calculate points to deduct (proportional to refund amount, round to nearest whole number)
  const pointsToDeduct = Math.round(refundAmount * originalOrder.merchant.posPointsPerDollar);

  // Find merchant membership
  const merchantMember = await prisma.merchantMember.findFirst({
    where: {
      merchantId: originalOrder.merchantId,
      memberId: originalOrder.memberId,
    },
  });

  if (!merchantMember) {
    console.warn('[Shopify] Merchant membership not found for refund');
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
        reason: `Shopify refund for order ${orderId} (-$${refundAmount.toFixed(2)})`,
      },
    });
  }

  // Update original order status
  await prisma.externalOrder.update({
    where: { id: originalOrder.id },
    data: { status: 'refunded' },
  });

  console.log(
    `[Shopify] Deducted ${pointsToDeduct} points from member ${originalOrder.memberId} for refund`
  );

  return {
    success: true,
    memberId: originalOrder.memberId,
    pointsAwarded: -pointsToDeduct,
  };
}

/**
 * Get Shopify webhook shared secret for a merchant
 * Note: Shopify uses a single shared secret per app, not per merchant
 */
export function getShopifyWebhookSecret(): string | undefined {
  return process.env.SHOPIFY_WEBHOOK_SECRET;
}

/**
 * Register webhooks with Shopify for a shop
 * Called automatically after OAuth connection
 */
export async function registerShopifyWebhooks(
  shopDomain: string,
  accessToken: string
): Promise<{ success: boolean; webhooks: string[]; errors: string[] }> {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`;
  const apiVersion = SHOPIFY_API_VERSION;

  const webhooksToRegister = [
    { topic: 'orders/paid', address: webhookUrl },
    { topic: 'refunds/create', address: webhookUrl },
  ];

  const results: string[] = [];
  const errors: string[] = [];

  for (const webhook of webhooksToRegister) {
    try {
      const response = await fetch(
        `https://${shopDomain}/admin/api/${apiVersion}/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhook: {
              topic: webhook.topic,
              address: webhook.address,
              format: 'json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`[Shopify] Registered webhook: ${webhook.topic}`, data.webhook?.id);
        results.push(webhook.topic);
      } else {
        const errorText = await response.text();
        // 422 usually means webhook already exists - that's OK
        if (response.status === 422 && errorText.includes('already been taken')) {
          console.log(`[Shopify] Webhook already exists: ${webhook.topic}`);
          results.push(webhook.topic);
        } else {
          console.error(`[Shopify] Failed to register ${webhook.topic}:`, errorText);
          errors.push(`${webhook.topic}: ${response.status}`);
        }
      }
    } catch (error: any) {
      console.error(`[Shopify] Error registering ${webhook.topic}:`, error.message);
      errors.push(`${webhook.topic}: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    webhooks: results,
    errors,
  };
}

/**
 * Get existing webhooks for a shop (for debugging/admin)
 */
export async function getShopifyWebhooks(
  shopDomain: string,
  accessToken: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.webhooks || [];
    }

    console.error('[Shopify] Failed to list webhooks:', await response.text());
    return [];
  } catch (error) {
    console.error('[Shopify] Error listing webhooks:', error);
    return [];
  }
}
