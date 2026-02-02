// src/app/lib/pos/toast.ts
// Toast POS-specific integration utilities

import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { decrypt } from '@/app/lib/crypto/encryption';

// Toast API base URL
const TOAST_API_BASE = 'https://ws.toasttab.com';

/**
 * Toast order data extracted from webhook
 */
export interface ToastOrderData {
  orderId: string;
  orderNumber: string;
  restaurantGuid: string;
  customerEmail?: string;
  totalAmount: number; // In dollars
  currency: string;
  createdAt: string;
  customer?: {
    guid?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Result of processing a Toast order
 */
export interface ToastProcessingResult {
  success: boolean;
  duplicate?: boolean;
  skipped?: boolean;
  reason?: string;
  orderId?: string;
  memberId?: string;
  pointsAwarded?: number;
}

/**
 * Verify Toast webhook signature
 * Toast uses HMAC-SHA256 with the webhook secret
 */
export function verifyToastSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.error('[Toast] Webhook secret not configured');
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
    console.error('[Toast] Signature verification error:', error);
    return false;
  }
}

/**
 * Extract order data from Toast webhook payload
 */
export function extractToastOrderData(
  payload: any,
  restaurantGuid: string
): ToastOrderData | null {
  try {
    // Toast sends order data in different formats depending on webhook type
    const order = payload.order || payload;

    if (!order || !order.guid) {
      console.warn('[Toast] No order object in webhook payload');
      return null;
    }

    // Get customer email from checks or order-level customer
    let customerEmail: string | undefined;
    let customer: ToastOrderData['customer'];

    // Check for customer at order level
    if (order.customer?.email) {
      customerEmail = order.customer.email;
      customer = {
        guid: order.customer.guid,
        email: order.customer.email,
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
      };
    }

    // Also check in checks array for customer info
    if (!customerEmail && order.checks?.length > 0) {
      for (const check of order.checks) {
        if (check.customer?.email) {
          customerEmail = check.customer.email;
          customer = {
            guid: check.customer.guid,
            email: check.customer.email,
            firstName: check.customer.firstName,
            lastName: check.customer.lastName,
          };
          break;
        }
      }
    }

    // Calculate total from checks or use order total
    let totalAmount = 0;
    if (order.checks?.length > 0) {
      for (const check of order.checks) {
        totalAmount += (check.totalAmount || 0);
      }
    } else if (order.amount) {
      totalAmount = order.amount;
    }

    // Toast amounts are in cents, convert to dollars
    totalAmount = totalAmount / 100;

    return {
      orderId: order.guid,
      orderNumber: order.displayNumber || order.guid,
      restaurantGuid,
      customerEmail,
      totalAmount,
      currency: 'USD', // Toast primarily uses USD
      createdAt: order.createdDate || order.openedDate || new Date().toISOString(),
      customer,
    };
  } catch (error) {
    console.error('[Toast] Failed to extract order data:', error);
    return null;
  }
}

/**
 * Process a Toast order and award loyalty points
 */
export async function processToastOrder(
  data: ToastOrderData
): Promise<ToastProcessingResult> {
  console.log('[Toast] Processing order:', data.orderId);

  // 1. Find merchant by Toast restaurant GUID
  const merchant = await prisma.merchant.findFirst({
    where: { toastRestaurantGuid: data.restaurantGuid },
    select: {
      id: true,
      name: true,
      posPointsPerDollar: true,
      welcomePoints: true,
      toastAccessToken: true,
      businesses: { select: { id: true }, take: 1 },
    },
  });

  if (!merchant) {
    console.warn('[Toast] No merchant found for restaurant:', data.restaurantGuid);
    return { success: false, skipped: true, reason: 'merchant_not_found' };
  }

  // 2. Check for duplicate order (idempotency)
  const existingOrder = await prisma.externalOrder.findFirst({
    where: {
      merchantId: merchant.id,
      externalId: data.orderId,
      externalSource: 'toast',
    },
  });

  if (existingOrder) {
    console.log('[Toast] Duplicate order, already processed:', data.orderId);
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
    console.log('[Toast] No customer email for order:', data.orderId);
    // Create order record anyway for tracking, but skip points
    await prisma.externalOrder.create({
      data: {
        merchantId: merchant.id,
        externalId: data.orderId,
        externalSource: 'toast',
        customerEmail: 'unknown',
        orderTotal: data.totalAmount,
        currency: data.currency,
        orderDate: new Date(data.createdAt),
        status: 'skipped_no_email',
        lineItems: { toastOrderNumber: data.orderNumber },
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
    console.log('[Toast] Created new member:', member.id);
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
    console.log('[Toast] Created merchant membership:', merchantMember.id);
  }

  // 6. Calculate points
  const pointsToAward = Math.floor(data.totalAmount * merchant.posPointsPerDollar);

  // 7. Create external order record
  const externalOrder = await prisma.externalOrder.create({
    data: {
      merchantId: merchant.id,
      externalId: data.orderId,
      externalSource: 'toast',
      customerEmail: customerEmail.toLowerCase(),
      memberId: member.id,
      orderTotal: data.totalAmount,
      currency: data.currency,
      orderDate: new Date(data.createdAt),
      pointsAwarded: pointsToAward,
      pointsAwardedAt: new Date(),
      status: 'processed',
      lineItems: { toastOrderNumber: data.orderNumber },
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
        reason: `Toast order #${data.orderNumber} ($${data.totalAmount.toFixed(2)})`,
      },
    });
  }

  console.log(
    `[Toast] Awarded ${pointsToAward} points to member ${member.id} for order ${data.orderId}`
  );

  return {
    success: true,
    orderId: externalOrder.id,
    memberId: member.id,
    pointsAwarded: pointsToAward,
  };
}

/**
 * Process a Toast refund and deduct points
 */
export async function processToastRefund(
  orderId: string,
  refundAmount: number // In dollars
): Promise<ToastProcessingResult> {
  console.log('[Toast] Processing refund for order:', orderId);

  // Find the original order
  const originalOrder = await prisma.externalOrder.findFirst({
    where: {
      externalId: orderId,
      externalSource: 'toast',
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
    console.warn('[Toast] Original order not found for refund:', orderId);
    return { success: false, skipped: true, reason: 'original_order_not_found' };
  }

  if (!originalOrder.memberId) {
    console.warn('[Toast] No member associated with order:', orderId);
    return { success: false, skipped: true, reason: 'no_member' };
  }

  // Calculate points to deduct
  const pointsToDeduct = Math.floor(refundAmount * originalOrder.merchant.posPointsPerDollar);

  // Find merchant membership
  const merchantMember = await prisma.merchantMember.findFirst({
    where: {
      merchantId: originalOrder.merchantId,
      memberId: originalOrder.memberId,
    },
  });

  if (!merchantMember) {
    console.warn('[Toast] Merchant membership not found for refund');
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
        reason: `Toast refund for order ${orderId} (-$${refundAmount.toFixed(2)})`,
      },
    });
  }

  // Update original order status
  await prisma.externalOrder.update({
    where: { id: originalOrder.id },
    data: { status: 'refunded' },
  });

  console.log(
    `[Toast] Deducted ${pointsToDeduct} points from member ${originalOrder.memberId} for refund`
  );

  return {
    success: true,
    memberId: originalOrder.memberId,
    pointsAwarded: -pointsToDeduct,
  };
}

/**
 * Get Toast webhook secret
 */
export function getToastWebhookSecret(): string | undefined {
  return process.env.TOAST_WEBHOOK_SECRET;
}
