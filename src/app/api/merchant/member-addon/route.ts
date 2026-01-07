// src/app/api/merchant/member-addon/route.ts
// API for purchasing additional member slots

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import {
  getMemberLimitStatus,
  MEMBER_ADDON,
  calculateAddonCost,
} from '@/app/lib/plan-limits';

/**
 * GET /api/merchant/member-addon
 * Get current member limit status and addon pricing
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('gob_merchant_session');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let merchantId: string;
    try {
      const sessionData = JSON.parse(session.value);
      merchantId = sessionData.merchantId;
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const status = await getMemberLimitStatus(merchantId);

    if (!status) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Don't allow addons for Starter plan
    const canPurchaseAddon = status.plan !== 'STARTER';

    return NextResponse.json({
      success: true,
      status,
      addon: {
        pricePerSlot: MEMBER_ADDON.price,
        membersPerSlot: MEMBER_ADDON.membersPerSlot,
        canPurchase: canPurchaseAddon,
        reasonCannotPurchase: !canPurchaseAddon
          ? 'Starter plan does not support member addons. Please upgrade to a paid plan.'
          : null,
      },
    });
  } catch (error: any) {
    console.error('[Member Addon] GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get member addon status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant/member-addon
 * Purchase additional member slots
 *
 * Request body:
 * { slots: number } - Number of 500-member slots to purchase
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('gob_merchant_session');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let merchantId: string;
    try {
      const sessionData = JSON.parse(session.value);
      merchantId = sessionData.merchantId;
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { slots, paymentIntentId } = await req.json();

    if (!slots || typeof slots !== 'number' || slots < 1) {
      return NextResponse.json(
        { error: 'Invalid slots. Must be at least 1.' },
        { status: 400 }
      );
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        plan: true,
        additionalMemberSlots: true,
        paymentVerified: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Don't allow addons for Starter plan
    if (merchant.plan === 'STARTER') {
      return NextResponse.json(
        {
          error: 'Starter plan does not support member addons. Please upgrade to a paid plan first.',
        },
        { status: 400 }
      );
    }

    // Require verified payment for addon purchases
    if (!merchant.paymentVerified) {
      return NextResponse.json(
        {
          error: 'Please verify your payment method before purchasing addons.',
        },
        { status: 400 }
      );
    }

    // Calculate cost
    const cost = calculateAddonCost(slots);

    // TODO: Integrate with PayPal one-time payment
    // For now, we'll create a pending purchase record that needs to be
    // confirmed after PayPal payment is completed
    // The paymentIntentId would be from PayPal's payment flow

    if (!paymentIntentId) {
      // Return info for initiating payment
      return NextResponse.json({
        success: true,
        action: 'PAYMENT_REQUIRED',
        purchase: {
          slots: cost.slots,
          membersAdded: cost.membersAdded,
          cost: cost.cost,
          currency: 'USD',
        },
        message: 'Payment required to complete addon purchase.',
      });
    }

    // If we have a paymentIntentId, verify payment and complete purchase
    // TODO: Verify PayPal payment was successful
    // For now, we'll trust the paymentIntentId exists and process

    // Update merchant with additional slots
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        additionalMemberSlots: {
          increment: slots,
        },
      },
    });

    // Log the purchase event
    await prisma.event.create({
      data: {
        merchantId,
        type: 'REWARD_EARNED', // Repurpose event type
        source: 'member-addon',
        metadata: {
          action: 'ADDON_PURCHASE',
          slots: slots,
          membersAdded: cost.membersAdded,
          cost: cost.cost,
          paymentIntentId,
          totalSlots: updatedMerchant.additionalMemberSlots,
        },
      },
    });

    // Get updated status
    const status = await getMemberLimitStatus(merchantId);

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${cost.membersAdded.toLocaleString()} additional member slots!`,
      purchase: {
        slots: cost.slots,
        membersAdded: cost.membersAdded,
        cost: cost.cost,
      },
      status,
    });
  } catch (error: any) {
    console.error('[Member Addon] POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to purchase addon' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchant/member-addon
 * Remove addon slots (for admin use or refunds)
 * Normally merchants wouldn't remove their own slots
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('gob_merchant_session');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let merchantId: string;
    try {
      const sessionData = JSON.parse(session.value);
      merchantId = sessionData.merchantId;
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slotsToRemove = parseInt(searchParams.get('slots') || '0');

    if (slotsToRemove < 1) {
      return NextResponse.json(
        { error: 'Invalid slots to remove' },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { additionalMemberSlots: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const newSlots = Math.max(0, merchant.additionalMemberSlots - slotsToRemove);

    await prisma.merchant.update({
      where: { id: merchantId },
      data: { additionalMemberSlots: newSlots },
    });

    const status = await getMemberLimitStatus(merchantId);

    return NextResponse.json({
      success: true,
      message: `Removed ${slotsToRemove} addon slot(s)`,
      status,
    });
  } catch (error: any) {
    console.error('[Member Addon] DELETE Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove addon' },
      { status: 500 }
    );
  }
}
