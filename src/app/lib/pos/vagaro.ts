// src/app/lib/pos/vagaro.ts
// Vagaro-specific POS integration utilities for salon & spa businesses

import { prisma } from '@/app/lib/prisma';
import { decrypt, encrypt } from '@/app/lib/crypto/encryption';

// Vagaro API base URL
const VAGARO_API_BASE = 'https://api.vagaro.com';

/**
 * Vagaro transaction data extracted from webhook
 */
export interface VagaroTransactionData {
  transactionId: string;
  businessId: string;
  customerId: string;
  transactionDate: string;
  itemSold: string;
  purchaseType: string;
  quantity: number;
  // Payment amounts (already in dollars)
  ccAmount: number;
  cashAmount: number;
  checkAmount: number;
  achAmount: number;
  otherAmount: number;
  tax: number;
  tip: number;
  discount: number;
}

/**
 * Result of processing a Vagaro transaction
 */
export interface VagaroProcessingResult {
  success: boolean;
  duplicate?: boolean;
  skipped?: boolean;
  reason?: string;
  orderId?: string;
  memberId?: string;
  pointsAwarded?: number;
}

/**
 * Vagaro API token response
 */
interface VagaroTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Vagaro customer data
 */
interface VagaroCustomer {
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobilePhone?: string;
  dayPhone?: string;
}

/**
 * Get Vagaro API access token using client credentials
 * Token is valid for 3600 seconds (1 hour)
 */
export async function getVagaroAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
    const response = await fetch(`${VAGARO_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        clientSecretKey: clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      console.error('[Vagaro] Token request failed:', response.status);
      return null;
    }

    const data: VagaroTokenResponse = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('[Vagaro] Token request error:', error);
    return null;
  }
}

/**
 * Look up customer email from Vagaro API
 */
export async function lookupVagaroCustomerEmail(
  accessToken: string,
  customerId: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${VAGARO_API_BASE}/v1/customers/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('[Vagaro] Customer lookup failed:', response.status);
      return null;
    }

    const data: VagaroCustomer = await response.json();
    return data.email || null;
  } catch (error) {
    console.error('[Vagaro] Customer lookup error:', error);
    return null;
  }
}

/**
 * Validate that the business ID in webhook matches a registered merchant
 */
export async function validateVagaroBusinessId(businessId: string): Promise<string | null> {
  // Find merchant by Vagaro business ID
  const merchant = await prisma.merchant.findFirst({
    where: { vagaroBusinessId: businessId },
    select: { id: true },
  });

  return merchant?.id || null;
}

/**
 * Extract transaction data from Vagaro webhook payload
 */
export function extractTransactionData(payload: any): VagaroTransactionData | null {
  try {
    // Vagaro webhook structure: { id, createdDate, type, action, payload: {...} }
    const data = payload.payload;
    if (!data || payload.type !== 'transaction') {
      console.warn('[Vagaro] Not a transaction webhook');
      return null;
    }

    return {
      transactionId: data.transactionId,
      businessId: data.businessId,
      customerId: data.customerId,
      transactionDate: data.transactionDate,
      itemSold: data.itemSold || '',
      purchaseType: data.purchaseType || '',
      quantity: data.quantity || 1,
      ccAmount: data.ccAmount || 0,
      cashAmount: data.cashAmount || 0,
      checkAmount: data.checkAmount || 0,
      achAmount: data.achAmount || 0,
      otherAmount: data.otherAmount || 0,
      tax: data.tax || 0,
      tip: data.tip || 0,
      discount: data.discount || 0,
    };
  } catch (error) {
    console.error('[Vagaro] Failed to extract transaction data:', error);
    return null;
  }
}

/**
 * Calculate total payment from Vagaro transaction
 * (all payment types + tax + tip - discount)
 */
export function calculateTransactionTotal(data: VagaroTransactionData): number {
  const paymentTotal =
    data.ccAmount +
    data.cashAmount +
    data.checkAmount +
    data.achAmount +
    data.otherAmount;

  // Include tax and tip, subtract discount
  return paymentTotal + data.tax + data.tip - data.discount;
}

/**
 * Process a Vagaro transaction and award loyalty points
 */
export async function processVagaroTransaction(
  data: VagaroTransactionData
): Promise<VagaroProcessingResult> {
  console.log('[Vagaro] Processing transaction:', data.transactionId);

  // 1. Find merchant by Vagaro business ID
  const merchant = await prisma.merchant.findFirst({
    where: { vagaroBusinessId: data.businessId },
    select: {
      id: true,
      name: true,
      posPointsPerDollar: true,
      welcomePoints: true,
      vagaroClientId: true,
      vagaroClientSecret: true,
      businesses: { select: { id: true }, take: 1 },
    },
  });

  if (!merchant) {
    console.warn('[Vagaro] No merchant found for business:', data.businessId);
    return { success: false, skipped: true, reason: 'merchant_not_found' };
  }

  // 2. Check for duplicate transaction (idempotency)
  const existingOrder = await prisma.externalOrder.findFirst({
    where: {
      merchantId: merchant.id,
      externalId: data.transactionId,
      externalSource: 'vagaro',
    },
  });

  if (existingOrder) {
    console.log('[Vagaro] Duplicate transaction, already processed:', data.transactionId);
    return {
      success: true,
      duplicate: true,
      orderId: existingOrder.id,
      memberId: existingOrder.memberId || undefined,
      pointsAwarded: existingOrder.pointsAwarded || 0,
    };
  }

  // 3. Get customer email via Vagaro API
  let customerEmail: string | null = null;

  if (data.customerId && merchant.vagaroClientId && merchant.vagaroClientSecret) {
    try {
      const clientId = decrypt(merchant.vagaroClientId);
      const clientSecret = decrypt(merchant.vagaroClientSecret);

      const accessToken = await getVagaroAccessToken(clientId, clientSecret);
      if (accessToken) {
        customerEmail = await lookupVagaroCustomerEmail(accessToken, data.customerId);
      }
    } catch (error) {
      console.error('[Vagaro] Error looking up customer:', error);
    }
  }

  if (!customerEmail) {
    console.log('[Vagaro] No customer email for transaction:', data.transactionId);
    // Create order record for tracking, but skip points
    const orderTotal = calculateTransactionTotal(data);
    await prisma.externalOrder.create({
      data: {
        merchantId: merchant.id,
        externalId: data.transactionId,
        externalSource: 'vagaro',
        customerEmail: 'unknown',
        orderTotal,
        currency: 'USD',
        orderDate: new Date(data.transactionDate),
        status: 'skipped_no_email',
        lineItems: {
          itemSold: data.itemSold,
          purchaseType: data.purchaseType,
          quantity: data.quantity,
        },
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
    console.log('[Vagaro] Created new member:', member.id);
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
    console.log('[Vagaro] Created merchant membership:', merchantMember.id);
  }

  // 6. Calculate points (Vagaro amounts are already in dollars)
  const orderTotal = calculateTransactionTotal(data);
  const pointsToAward = Math.round(orderTotal * merchant.posPointsPerDollar);

  // 7. Create external order record
  const externalOrder = await prisma.externalOrder.create({
    data: {
      merchantId: merchant.id,
      externalId: data.transactionId,
      externalSource: 'vagaro',
      customerEmail: customerEmail.toLowerCase(),
      memberId: member.id,
      orderTotal,
      currency: 'USD',
      orderDate: new Date(data.transactionDate),
      pointsAwarded: pointsToAward,
      pointsAwardedAt: new Date(),
      status: 'processed',
      lineItems: {
        itemSold: data.itemSold,
        purchaseType: data.purchaseType,
        quantity: data.quantity,
        tax: data.tax,
        tip: data.tip,
        discount: data.discount,
      },
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
        reason: `Vagaro: ${data.itemSold || data.purchaseType} ($${orderTotal.toFixed(2)})`,
      },
    });
  }

  console.log(
    `[Vagaro] Awarded ${pointsToAward} points to member ${member.id} for transaction ${data.transactionId}`
  );

  return {
    success: true,
    orderId: externalOrder.id,
    memberId: member.id,
    pointsAwarded: pointsToAward,
  };
}

/**
 * Process a Vagaro refund and deduct points
 * Note: Vagaro may send a new transaction with negative amounts or a separate refund event
 */
export async function processVagaroRefund(
  transactionId: string,
  refundAmount: number
): Promise<VagaroProcessingResult> {
  console.log('[Vagaro] Processing refund for transaction:', transactionId);

  // Find the original order
  const originalOrder = await prisma.externalOrder.findFirst({
    where: {
      externalId: transactionId,
      externalSource: 'vagaro',
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
    console.warn('[Vagaro] Original order not found for refund:', transactionId);
    return { success: false, skipped: true, reason: 'original_order_not_found' };
  }

  if (!originalOrder.memberId) {
    console.warn('[Vagaro] No member associated with order:', transactionId);
    return { success: false, skipped: true, reason: 'no_member' };
  }

  // Calculate points to deduct (proportional to refund amount)
  const pointsToDeduct = Math.round(refundAmount * originalOrder.merchant.posPointsPerDollar);

  // Find merchant membership
  const merchantMember = await prisma.merchantMember.findFirst({
    where: {
      merchantId: originalOrder.merchantId,
      memberId: originalOrder.memberId,
    },
  });

  if (!merchantMember) {
    console.warn('[Vagaro] Merchant membership not found for refund');
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
        reason: `Vagaro refund for ${transactionId} (-$${refundAmount.toFixed(2)})`,
      },
    });
  }

  // Update original order status
  await prisma.externalOrder.update({
    where: { id: originalOrder.id },
    data: { status: 'refunded' },
  });

  console.log(
    `[Vagaro] Deducted ${pointsToDeduct} points from member ${originalOrder.memberId} for refund`
  );

  return {
    success: true,
    memberId: originalOrder.memberId,
    pointsAwarded: -pointsToDeduct,
  };
}

/**
 * Save Vagaro credentials for a merchant
 */
export async function saveVagaroCredentials(
  merchantId: string,
  clientId: string,
  clientSecret: string,
  businessId: string
): Promise<boolean> {
  try {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        vagaroClientId: encrypt(clientId),
        vagaroClientSecret: encrypt(clientSecret),
        vagaroBusinessId: businessId,
      },
    });
    console.log('[Vagaro] Credentials saved for merchant:', merchantId);
    return true;
  } catch (error) {
    console.error('[Vagaro] Error saving credentials:', error);
    return false;
  }
}

/**
 * Remove Vagaro integration for a merchant
 */
export async function disconnectVagaro(merchantId: string): Promise<boolean> {
  try {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        vagaroClientId: null,
        vagaroClientSecret: null,
        vagaroBusinessId: null,
      },
    });
    console.log('[Vagaro] Disconnected for merchant:', merchantId);
    return true;
  } catch (error) {
    console.error('[Vagaro] Error disconnecting:', error);
    return false;
  }
}

/**
 * Test Vagaro API credentials
 */
export async function testVagaroCredentials(
  clientId: string,
  clientSecret: string
): Promise<boolean> {
  const token = await getVagaroAccessToken(clientId, clientSecret);
  return !!token;
}
