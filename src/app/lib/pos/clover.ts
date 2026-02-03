// src/app/lib/pos/clover.ts
// Clover POS-specific integration utilities

import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { decrypt } from '@/app/lib/crypto/encryption';

// Clover API base URLs
const CLOVER_API_BASE_SANDBOX = 'https://sandbox.dev.clover.com';
const CLOVER_API_BASE_PROD = 'https://api.clover.com';

/**
 * Clover order data extracted from webhook
 */
export interface CloverOrderData {
  orderId: string;
  merchantId: string;
  customerEmail?: string;
  totalAmount: number; // In cents
  currency: string;
  createdAt: string;
  state: string;
  customer?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Result of processing a Clover order
 */
export interface CloverProcessingResult {
  success: boolean;
  duplicate?: boolean;
  skipped?: boolean;
  reason?: string;
  orderId?: string;
  memberId?: string;
  pointsAwarded?: number;
}

/**
 * Verify Clover webhook signature
 * Clover uses HMAC-SHA256 with the app secret
 */
export function verifyCloverSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.error('[Clover] Webhook secret not configured');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody, 'utf8');
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature.toLowerCase()),
      Buffer.from(expectedSignature.toLowerCase())
    );
  } catch (error) {
    console.error('[Clover] Signature verification error:', error);
    return false;
  }
}

/**
 * Extract order data from Clover webhook payload
 */
export function extractCloverOrderData(
  payload: any,
  merchantId: string
): CloverOrderData | null {
  try {
    // Clover webhook payload structure varies by event type
    const order = payload.object || payload;

    if (!order || !order.id) {
      console.warn('[Clover] No order object in webhook payload');
      return null;
    }

    // Get customer info if available
    let customerEmail: string | undefined;
    let customer: CloverOrderData['customer'];

    if (order.customers?.elements?.length > 0) {
      const cust = order.customers.elements[0];
      customerEmail = cust.emailAddresses?.elements?.[0]?.emailAddress;
      customer = {
        id: cust.id,
        email: customerEmail,
        firstName: cust.firstName,
        lastName: cust.lastName,
      };
    }

    return {
      orderId: order.id,
      merchantId,
      customerEmail,
      totalAmount: order.total || 0, // Clover amounts are in cents
      currency: order.currency || 'USD',
      createdAt: order.createdTime ? new Date(order.createdTime).toISOString() : new Date().toISOString(),
      state: order.state || 'unknown',
      customer,
    };
  } catch (error) {
    console.error('[Clover] Failed to extract order data:', error);
    return null;
  }
}

/**
 * Look up customer email from Clover API
 */
export async function lookupCloverCustomerEmail(
  accessToken: string,
  merchantId: string,
  customerId: string,
  useSandbox: boolean = false
): Promise<string | null> {
  try {
    const baseUrl = useSandbox ? CLOVER_API_BASE_SANDBOX : CLOVER_API_BASE_PROD;
    const response = await fetch(
      `${baseUrl}/v3/merchants/${merchantId}/customers/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('[Clover] Customer lookup failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.emailAddresses?.elements?.[0]?.emailAddress || null;
  } catch (error) {
    console.error('[Clover] Customer lookup error:', error);
    return null;
  }
}

/**
 * Process a Clover order and award loyalty points
 */
export async function processCloverOrder(
  data: CloverOrderData
): Promise<CloverProcessingResult> {
  console.log('[Clover] Processing order:', data.orderId);

  // 1. Find merchant by Clover merchant ID
  const merchant = await prisma.merchant.findFirst({
    where: { cloverMerchantId: data.merchantId },
    select: {
      id: true,
      name: true,
      posPointsPerDollar: true,
      welcomePoints: true,
      cloverAccessToken: true,
      businesses: { select: { id: true }, take: 1 },
    },
  });

  if (!merchant) {
    console.warn('[Clover] No merchant found for Clover ID:', data.merchantId);
    return { success: false, skipped: true, reason: 'merchant_not_found' };
  }

  // 2. Check for duplicate order (idempotency)
  const existingOrder = await prisma.externalOrder.findFirst({
    where: {
      merchantId: merchant.id,
      externalId: data.orderId,
      externalSource: 'clover',
    },
  });

  if (existingOrder) {
    console.log('[Clover] Duplicate order, already processed:', data.orderId);
    return {
      success: true,
      duplicate: true,
      orderId: existingOrder.id,
      memberId: existingOrder.memberId || undefined,
      pointsAwarded: existingOrder.pointsAwarded || 0,
    };
  }

  // 3. Get customer email
  let customerEmail = data.customerEmail;

  // Try to look up customer if we have customer ID but no email
  if (!customerEmail && data.customer?.id && merchant.cloverAccessToken) {
    const accessToken = decrypt(merchant.cloverAccessToken);
    const lookedUpEmail = await lookupCloverCustomerEmail(
      accessToken,
      data.merchantId,
      data.customer.id
    );
    if (lookedUpEmail) {
      customerEmail = lookedUpEmail;
    }
  }

  if (!customerEmail) {
    console.log('[Clover] No customer email for order:', data.orderId);
    // Create order record anyway for tracking, but skip points
    await prisma.externalOrder.create({
      data: {
        merchantId: merchant.id,
        externalId: data.orderId,
        externalSource: 'clover',
        customerEmail: 'unknown',
        orderTotal: data.totalAmount / 100, // Convert cents to dollars
        currency: data.currency,
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
        firstName: data.customer?.firstName || '',
        lastName: data.customer?.lastName || '',
      },
    });
    isNewMember = true;
    console.log('[Clover] Created new member:', member.id);
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
    console.log('[Clover] Created merchant membership:', merchantMember.id);
  }

  // 6. Calculate points (amount is in cents, convert to dollars, round to nearest whole number)
  const orderTotal = data.totalAmount / 100;
  const pointsToAward = Math.round(orderTotal * merchant.posPointsPerDollar);

  // 7. Create external order record
  const externalOrder = await prisma.externalOrder.create({
    data: {
      merchantId: merchant.id,
      externalId: data.orderId,
      externalSource: 'clover',
      customerEmail: customerEmail.toLowerCase(),
      memberId: member.id,
      orderTotal,
      currency: data.currency,
      orderDate: new Date(data.createdAt),
      pointsAwarded: pointsToAward,
      pointsAwardedAt: new Date(),
      status: 'processed',
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
        reason: `Clover order ${data.orderId} ($${orderTotal.toFixed(2)})`,
      },
    });
  }

  console.log(
    `[Clover] Awarded ${pointsToAward} points to member ${member.id} for order ${data.orderId}`
  );

  return {
    success: true,
    orderId: externalOrder.id,
    memberId: member.id,
    pointsAwarded: pointsToAward,
  };
}

/**
 * Process a Clover refund and deduct points
 */
export async function processCloverRefund(
  orderId: string,
  refundAmount: number // In cents
): Promise<CloverProcessingResult> {
  console.log('[Clover] Processing refund for order:', orderId);

  // Find the original order
  const originalOrder = await prisma.externalOrder.findFirst({
    where: {
      externalId: orderId,
      externalSource: 'clover',
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
    console.warn('[Clover] Original order not found for refund:', orderId);
    return { success: false, skipped: true, reason: 'original_order_not_found' };
  }

  if (!originalOrder.memberId) {
    console.warn('[Clover] No member associated with order:', orderId);
    return { success: false, skipped: true, reason: 'no_member' };
  }

  // Calculate points to deduct (convert cents to dollars, round to nearest whole number)
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
    console.warn('[Clover] Merchant membership not found for refund');
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
        reason: `Clover refund for order ${orderId} (-$${refundDollars.toFixed(2)})`,
      },
    });
  }

  // Update original order status
  await prisma.externalOrder.update({
    where: { id: originalOrder.id },
    data: { status: 'refunded' },
  });

  console.log(
    `[Clover] Deducted ${pointsToDeduct} points from member ${originalOrder.memberId} for refund`
  );

  return {
    success: true,
    memberId: originalOrder.memberId,
    pointsAwarded: -pointsToDeduct,
  };
}

/**
 * Get Clover webhook secret (app secret)
 */
export function getCloverWebhookSecret(): string | undefined {
  return process.env.CLOVER_APP_SECRET || process.env.CLOVER_CLIENT_SECRET;
}
