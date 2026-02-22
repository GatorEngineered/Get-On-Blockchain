// src/app/lib/pos/boulevard.ts
// Boulevard-specific POS integration utilities for premium salons & spas
// Boulevard uses a GraphQL Admin API with webhook support

import { prisma } from '@/app/lib/prisma';
import { decrypt } from '@/app/lib/crypto/encryption';

// Boulevard API base URL
const BOULEVARD_API_BASE = 'https://dashboard.boulevard.io/api/2020-01';
const BOULEVARD_GRAPHQL_URL = 'https://dashboard.boulevard.io/api/2020-01/admin';

/**
 * Boulevard appointment data extracted from webhook
 */
export interface BoulevardAppointmentData {
  appointmentId: string;
  businessId: string;
  clientId: string;
  appointmentDate: string;
  services: string[];
  totalPrice: number;
  currency: string;
  status: string;
}

/**
 * Result of processing a Boulevard appointment
 */
export interface BoulevardProcessingResult {
  success: boolean;
  duplicate?: boolean;
  skipped?: boolean;
  reason?: string;
  orderId?: string;
  memberId?: string;
  pointsAwarded?: number;
}

/**
 * Boulevard client data
 */
interface BoulevardClient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobilePhone?: string;
}

/**
 * Validate that the business ID in webhook matches a registered merchant
 */
export async function validateBoulevardBusinessId(businessId: string): Promise<string | null> {
  const merchant = await prisma.merchant.findFirst({
    where: { boulevardBusinessId: businessId },
    select: { id: true },
  });

  return merchant?.id || null;
}

/**
 * Look up client email from Boulevard GraphQL API
 */
export async function lookupBoulevardClientEmail(
  accessToken: string,
  clientId: string
): Promise<string | null> {
  try {
    const query = `
      query GetClient($id: ID!) {
        client(id: $id) {
          email
          firstName
          lastName
        }
      }
    `;

    const response = await fetch(BOULEVARD_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: clientId },
      }),
    });

    if (!response.ok) {
      console.warn('[Boulevard] Client lookup failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data?.data?.client?.email || null;
  } catch (error) {
    console.error('[Boulevard] Client lookup error:', error);
    return null;
  }
}

/**
 * Extract appointment data from Boulevard webhook payload
 */
export function extractAppointmentData(payload: any): BoulevardAppointmentData | null {
  try {
    // Boulevard webhook structure:
    // { event: "appointment.completed", resource: { ...appointment data... }, business_id: "..." }
    const resource = payload.resource || payload.data;
    if (!resource) {
      console.warn('[Boulevard] No resource in webhook payload');
      return null;
    }

    // Extract service names from appointment services
    const services: string[] = [];
    if (resource.appointment_services) {
      for (const svc of resource.appointment_services) {
        if (svc.service?.name) {
          services.push(svc.service.name);
        }
      }
    }

    return {
      appointmentId: String(resource.id),
      businessId: String(payload.business_id || resource.business_id || ''),
      clientId: String(resource.client_id || resource.client?.id || ''),
      appointmentDate: resource.start_at || resource.date || new Date().toISOString(),
      services,
      totalPrice: parseFloat(resource.total_price || resource.price || '0'),
      currency: resource.currency || 'USD',
      status: resource.status || 'completed',
    };
  } catch (error) {
    console.error('[Boulevard] Failed to extract appointment data:', error);
    return null;
  }
}

/**
 * Process a Boulevard appointment and award loyalty points
 */
export async function processBoulevardAppointment(
  data: BoulevardAppointmentData
): Promise<BoulevardProcessingResult> {
  console.log('[Boulevard] Processing appointment:', data.appointmentId);

  // 1. Find merchant by Boulevard business ID
  const merchant = await prisma.merchant.findFirst({
    where: { boulevardBusinessId: data.businessId },
    select: {
      id: true,
      name: true,
      posPointsPerDollar: true,
      welcomePoints: true,
      boulevardAccessToken: true,
      businesses: { select: { id: true }, take: 1 },
    },
  });

  if (!merchant) {
    console.warn('[Boulevard] No merchant found for business:', data.businessId);
    return { success: false, skipped: true, reason: 'merchant_not_found' };
  }

  // 2. Check for duplicate (idempotency)
  const existingOrder = await prisma.externalOrder.findFirst({
    where: {
      merchantId: merchant.id,
      externalId: data.appointmentId,
      externalSource: 'boulevard',
    },
  });

  if (existingOrder) {
    console.log('[Boulevard] Duplicate appointment, already processed:', data.appointmentId);
    return {
      success: true,
      duplicate: true,
      orderId: existingOrder.id,
      memberId: existingOrder.memberId || undefined,
      pointsAwarded: existingOrder.pointsAwarded || 0,
    };
  }

  // 3. Get client email via Boulevard GraphQL API
  let clientEmail: string | null = null;

  if (data.clientId && merchant.boulevardAccessToken) {
    try {
      const accessToken = decrypt(merchant.boulevardAccessToken);
      clientEmail = await lookupBoulevardClientEmail(accessToken, data.clientId);
    } catch (error) {
      console.error('[Boulevard] Error looking up client:', error);
    }
  }

  if (!clientEmail) {
    console.log('[Boulevard] No client email for appointment:', data.appointmentId);
    await prisma.externalOrder.create({
      data: {
        merchantId: merchant.id,
        externalId: data.appointmentId,
        externalSource: 'boulevard',
        customerEmail: 'unknown',
        orderTotal: data.totalPrice,
        currency: data.currency,
        orderDate: new Date(data.appointmentDate),
        status: 'skipped_no_email',
        lineItems: {
          services: data.services,
          status: data.status,
        },
      },
    });
    return { success: false, skipped: true, reason: 'no_client_email' };
  }

  // 4. Find or create member
  let member = await prisma.member.findUnique({
    where: { email: clientEmail.toLowerCase() },
  });

  let isNewMember = false;
  if (!member) {
    member = await prisma.member.create({
      data: {
        email: clientEmail.toLowerCase(),
        firstName: '',
        lastName: '',
      },
    });
    isNewMember = true;
    console.log('[Boulevard] Created new member:', member.id);
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
    console.log('[Boulevard] Created merchant membership:', merchantMember.id);
  }

  // 6. Calculate points
  const pointsToAward = Math.round(data.totalPrice * merchant.posPointsPerDollar);

  // 7. Create external order record
  const externalOrder = await prisma.externalOrder.create({
    data: {
      merchantId: merchant.id,
      externalId: data.appointmentId,
      externalSource: 'boulevard',
      customerEmail: clientEmail.toLowerCase(),
      memberId: member.id,
      orderTotal: data.totalPrice,
      currency: data.currency,
      orderDate: new Date(data.appointmentDate),
      pointsAwarded: pointsToAward,
      pointsAwardedAt: new Date(),
      status: 'processed',
      lineItems: {
        services: data.services,
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
  const serviceLabel = data.services.length > 0
    ? data.services.join(', ')
    : 'Appointment';

  if (merchant.businesses.length > 0) {
    await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId: merchant.businesses[0].id,
        memberId: member.id,
        type: 'EARN',
        amount: pointsToAward,
        status: 'SUCCESS',
        reason: `Boulevard: ${serviceLabel} ($${data.totalPrice.toFixed(2)})`,
      },
    });
  }

  console.log(
    `[Boulevard] Awarded ${pointsToAward} points to member ${member.id} for appointment ${data.appointmentId}`
  );

  return {
    success: true,
    orderId: externalOrder.id,
    memberId: member.id,
    pointsAwarded: pointsToAward,
  };
}

/**
 * Process a Boulevard cancellation/refund and deduct points
 */
export async function processBoulevardRefund(
  appointmentId: string,
  refundAmount: number
): Promise<BoulevardProcessingResult> {
  console.log('[Boulevard] Processing refund for appointment:', appointmentId);

  const originalOrder = await prisma.externalOrder.findFirst({
    where: {
      externalId: appointmentId,
      externalSource: 'boulevard',
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
    console.warn('[Boulevard] Original order not found for refund:', appointmentId);
    return { success: false, skipped: true, reason: 'original_order_not_found' };
  }

  if (!originalOrder.memberId) {
    console.warn('[Boulevard] No member associated with order:', appointmentId);
    return { success: false, skipped: true, reason: 'no_member' };
  }

  const pointsToDeduct = Math.round(refundAmount * originalOrder.merchant.posPointsPerDollar);

  const merchantMember = await prisma.merchantMember.findFirst({
    where: {
      merchantId: originalOrder.merchantId,
      memberId: originalOrder.memberId,
    },
  });

  if (!merchantMember) {
    console.warn('[Boulevard] Merchant membership not found for refund');
    return { success: false, skipped: true, reason: 'membership_not_found' };
  }

  const newPoints = Math.max(0, merchantMember.points - pointsToDeduct);
  await prisma.merchantMember.update({
    where: { id: merchantMember.id },
    data: { points: newPoints },
  });

  if (originalOrder.merchant.businesses.length > 0) {
    await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId: originalOrder.merchant.businesses[0].id,
        memberId: originalOrder.memberId,
        type: 'ADJUST',
        amount: -pointsToDeduct,
        status: 'SUCCESS',
        reason: `Boulevard refund for ${appointmentId} (-$${refundAmount.toFixed(2)})`,
      },
    });
  }

  await prisma.externalOrder.update({
    where: { id: originalOrder.id },
    data: { status: 'refunded' },
  });

  console.log(
    `[Boulevard] Deducted ${pointsToDeduct} points from member ${originalOrder.memberId} for refund`
  );

  return {
    success: true,
    memberId: originalOrder.memberId,
    pointsAwarded: -pointsToDeduct,
  };
}
