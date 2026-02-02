// src/app/api/webhooks/toast/route.ts
// Toast POS Webhook Handler - Receives order events and awards loyalty points

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyToastSignature,
  extractToastOrderData,
  processToastOrder,
  processToastRefund,
  getToastWebhookSecret,
} from '@/app/lib/pos/toast';

/**
 * POST /api/webhooks/toast
 *
 * Handles Toast webhook events for automatic points awarding
 *
 * Events handled:
 * - ORDER_PAID - Award points based on order total
 * - ORDER_CLOSED - Award points when order is completed
 * - PAYMENT_REFUND - Deduct points for refunded orders
 *
 * Security:
 * - Verifies HMAC-SHA256 signature from Toast
 * - Idempotent processing (duplicate orders are ignored)
 *
 * Setup:
 * 1. Merchant connects Toast via OAuth (existing flow)
 * 2. Register webhooks via Toast Developer Portal
 * 3. Set TOAST_WEBHOOK_SECRET in environment
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('toast-signature') ||
                      req.headers.get('x-toast-signature') || '';
    const eventType = req.headers.get('toast-webhook-type') ||
                      req.headers.get('x-toast-webhook-type') || '';

    console.log(`[Toast Webhook] Received event: ${eventType}`);

    // Get webhook secret
    const webhookSecret = getToastWebhookSecret();
    if (!webhookSecret) {
      console.error('[Toast Webhook] TOAST_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    if (signature && !verifyToastSignature(rawBody, signature, webhookSecret)) {
      console.error('[Toast Webhook] Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);

    // Get restaurant GUID from payload or headers
    const restaurantGuid = payload.restaurantGuid ||
                           payload.restaurant?.guid ||
                           req.headers.get('toast-restaurant-external-id') || '';

    if (!restaurantGuid) {
      console.warn('[Toast Webhook] No restaurant GUID in payload');
      return NextResponse.json({ received: true, processed: false });
    }

    console.log(`[Toast Webhook] Restaurant: ${restaurantGuid}, Event: ${eventType}`);

    // Route based on event type
    // Toast webhook types vary - handle common order events
    const eventTypeLower = eventType.toLowerCase();

    if (eventTypeLower.includes('order') &&
        (eventTypeLower.includes('paid') || eventTypeLower.includes('closed') || eventTypeLower.includes('complete'))) {

      const orderData = extractToastOrderData(payload, restaurantGuid);
      if (!orderData) {
        console.warn('[Toast Webhook] Could not extract order data');
        return NextResponse.json({ received: true, processed: false });
      }

      const result = await processToastOrder(orderData);
      console.log(
        `[Toast Webhook] Order processed in ${Date.now() - startTime}ms:`,
        result
      );

      return NextResponse.json({
        received: true,
        processed: result.success,
        duplicate: result.duplicate,
        points_awarded: result.pointsAwarded,
      });
    }

    if (eventTypeLower.includes('refund') || eventTypeLower.includes('void')) {
      // Extract refund info
      const orderId = payload.order?.guid || payload.orderGuid;
      const refundAmount = (payload.amount || payload.refundAmount || 0) / 100; // Convert cents to dollars

      if (!orderId || refundAmount <= 0) {
        console.warn('[Toast Webhook] Invalid refund payload');
        return NextResponse.json({ received: true, processed: false });
      }

      console.log(`[Toast Webhook] Processing refund of $${refundAmount} for order ${orderId}`);
      const result = await processToastRefund(orderId, refundAmount);

      return NextResponse.json({
        received: true,
        processed: result.success,
        points_deducted: result.pointsAwarded ? -result.pointsAwarded : 0,
      });
    }

    // For other event types, acknowledge but don't process
    console.log(`[Toast Webhook] Unhandled event type: ${eventType}`);
    return NextResponse.json({ received: true, processed: false });

  } catch (error: any) {
    console.error('[Toast Webhook] Error processing webhook:', error);

    if (error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/toast
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'toast-webhook',
    timestamp: new Date().toISOString(),
  });
}
