// src/app/lib/pos/booksy.ts
// Booksy-specific POS integration utilities for salon & spa businesses

import { prisma } from '@/app/lib/prisma';
import { decrypt } from '@/app/lib/crypto/encryption';

// Booksy API base URL (US region — adjust country code for other regions)
const BOOKSY_API_BASE = 'https://us.booksy.com/public-api/us';

/**
 * Booksy appointment data extracted from webhook
 */
export interface BooksyAppointmentData {
  appointmentId: string;
  businessId: string;
  customerId: string;
  appointmentDate: string;
  serviceName: string;
  totalPrice: number; // in dollars
  currency: string;
  status: string;
}

/**
 * Result of processing a Booksy appointment
 */
export interface BooksyProcessingResult {
  success: boolean;
  duplicate?: boolean;
  skipped?: boolean;
  reason?: string;
  orderId?: string;
  memberId?: string;
  pointsAwarded?: number;
}

/**
 * Booksy customer data
 */
interface BooksyCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
}

/**
 * Validate that the business ID in webhook matches a registered merchant
 */
export async function validateBooksyBusinessId(businessId: string): Promise<string | null> {
  const merchant = await prisma.merchant.findFirst({
    where: { booksyBusinessId: businessId },
    select: { id: true },
  });

  return merchant?.id || null;
}

/**
 * Look up customer email from Booksy API
 */
export async function lookupBooksyCustomerEmail(
  accessToken: string,
  businessId: string,
  customerId: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${BOOKSY_API_BASE}/business/${businessId}/customers/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('[Booksy] Customer lookup failed:', response.status);
      return null;
    }

    const data: BooksyCustomer = await response.json();
    return data.email || null;
  } catch (error) {
    console.error('[Booksy] Customer lookup error:', error);
    return null;
  }
}

/**
 * Extract appointment data from Booksy webhook payload
 */
export function extractAppointmentData(payload: any): BooksyAppointmentData | null {
  try {
    // Booksy webhook structure:
    // { event_type: "appointment.completed", data: { ...appointment data... } }
    const data = payload.data;
    if (!data) {
      console.warn('[Booksy] No data in webhook payload');
      return null;
    }

    return {
      appointmentId: String(data.id || data.appointment_id),
      businessId: String(data.business_id),
      customerId: String(data.customer_id || ''),
      appointmentDate: data.datetime || data.date || new Date().toISOString(),
      serviceName: data.service_name || data.treatment || '',
      totalPrice: parseFloat(data.total_price || data.price || '0'),
      currency: data.currency || 'USD',
      status: data.status || 'completed',
    };
  } catch (error) {
    console.error('[Booksy] Failed to extract appointment data:', error);
    return null;
  }
}

/**
 * Process a Booksy appointment and award loyalty points
 */
export async function processBooksyAppointment(
  data: BooksyAppointmentData
): Promise<BooksyProcessingResult> {
  console.log('[Booksy] Processing appointment:', data.appointmentId);

  // 1. Find merchant by Booksy business ID
  const merchant = await prisma.merchant.findFirst({
    where: { booksyBusinessId: data.businessId },
    select: {
      id: true,
      name: true,
      posPointsPerDollar: true,
      welcomePoints: true,
      booksyAccessToken: true,
      businesses: { select: { id: true }, take: 1 },
    },
  });

  if (!merchant) {
    console.warn('[Booksy] No merchant found for business:', data.businessId);
    return { success: false, skipped: true, reason: 'merchant_not_found' };
  }

  // 2. Check for duplicate (idempotency)
  const existingOrder = await prisma.externalOrder.findFirst({
    where: {
      merchantId: merchant.id,
      externalId: data.appointmentId,
      externalSource: 'booksy',
    },
  });

  if (existingOrder) {
    console.log('[Booksy] Duplicate appointment, already processed:', data.appointmentId);
    return {
      success: true,
      duplicate: true,
      orderId: existingOrder.id,
      memberId: existingOrder.memberId || undefined,
      pointsAwarded: existingOrder.pointsAwarded || 0,
    };
  }

  // 3. Get customer email via Booksy API
  let customerEmail: string | null = null;

  if (data.customerId && merchant.booksyAccessToken) {
    try {
      const accessToken = decrypt(merchant.booksyAccessToken);
      customerEmail = await lookupBooksyCustomerEmail(
        accessToken,
        data.businessId,
        data.customerId
      );
    } catch (error) {
      console.error('[Booksy] Error looking up customer:', error);
    }
  }

  if (!customerEmail) {
    console.log('[Booksy] No customer email for appointment:', data.appointmentId);
    // Create order record for tracking, but skip points
    await prisma.externalOrder.create({
      data: {
        merchantId: merchant.id,
        externalId: data.appointmentId,
        externalSource: 'booksy',
        customerEmail: 'unknown',
        orderTotal: data.totalPrice,
        currency: data.currency,
        orderDate: new Date(data.appointmentDate),
        status: 'skipped_no_email',
        lineItems: {
          serviceName: data.serviceName,
          status: data.status,
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
    console.log('[Booksy] Created new member:', member.id);
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
    console.log('[Booksy] Created merchant membership:', merchantMember.id);
  }

  // 6. Calculate points
  const pointsToAward = Math.round(data.totalPrice * merchant.posPointsPerDollar);

  // 7. Create external order record
  const externalOrder = await prisma.externalOrder.create({
    data: {
      merchantId: merchant.id,
      externalId: data.appointmentId,
      externalSource: 'booksy',
      customerEmail: customerEmail.toLowerCase(),
      memberId: member.id,
      orderTotal: data.totalPrice,
      currency: data.currency,
      orderDate: new Date(data.appointmentDate),
      pointsAwarded: pointsToAward,
      pointsAwardedAt: new Date(),
      status: 'processed',
      lineItems: {
        serviceName: data.serviceName,
        status: data.status,
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
        reason: `Booksy: ${data.serviceName || 'Appointment'} ($${data.totalPrice.toFixed(2)})`,
      },
    });
  }

  console.log(
    `[Booksy] Awarded ${pointsToAward} points to member ${member.id} for appointment ${data.appointmentId}`
  );

  return {
    success: true,
    orderId: externalOrder.id,
    memberId: member.id,
    pointsAwarded: pointsToAward,
  };
}

/**
 * Process a Booksy cancellation/refund and deduct points
 */
export async function processBooksyRefund(
  appointmentId: string,
  refundAmount: number
): Promise<BooksyProcessingResult> {
  console.log('[Booksy] Processing refund for appointment:', appointmentId);

  // Find the original order
  const originalOrder = await prisma.externalOrder.findFirst({
    where: {
      externalId: appointmentId,
      externalSource: 'booksy',
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
    console.warn('[Booksy] Original order not found for refund:', appointmentId);
    return { success: false, skipped: true, reason: 'original_order_not_found' };
  }

  if (!originalOrder.memberId) {
    console.warn('[Booksy] No member associated with order:', appointmentId);
    return { success: false, skipped: true, reason: 'no_member' };
  }

  // Calculate points to deduct
  const pointsToDeduct = Math.round(refundAmount * originalOrder.merchant.posPointsPerDollar);

  // Find merchant membership
  const merchantMember = await prisma.merchantMember.findFirst({
    where: {
      merchantId: originalOrder.merchantId,
      memberId: originalOrder.memberId,
    },
  });

  if (!merchantMember) {
    console.warn('[Booksy] Merchant membership not found for refund');
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
        reason: `Booksy refund for ${appointmentId} (-$${refundAmount.toFixed(2)})`,
      },
    });
  }

  // Update original order status
  await prisma.externalOrder.update({
    where: { id: originalOrder.id },
    data: { status: 'refunded' },
  });

  console.log(
    `[Booksy] Deducted ${pointsToDeduct} points from member ${originalOrder.memberId} for refund`
  );

  return {
    success: true,
    memberId: originalOrder.memberId,
    pointsAwarded: -pointsToDeduct,
  };
}
