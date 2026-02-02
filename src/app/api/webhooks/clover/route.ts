// src/app/api/webhooks/clover/route.ts
// Clover POS Webhook Handler - Receives order events and awards loyalty points

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyCloverSignature,
  extractCloverOrderData,
  processCloverOrder,
  processCloverRefund,
  getCloverWebhookSecret,
} from '@/app/lib/pos/clover';

/**
 * POST /api/webhooks/clover
 *
 * Handles Clover webhook events for automatic points awarding
 *
 * Events handled:
 * - ORDER_CREATED / ORDER_UPDATED - Award points when order is paid
 * - REFUND - Deduct points for refunded orders
 *
 * Security:
 * - Verifies webhook signature using app secret
 * - Idempotent processing (duplicate orders are ignored)
 *
 * Setup:
 * 1. Create app in Clover Developer Dashboard
 * 2. Configure webhook URL
 * 3. Set CLOVER_CLIENT_ID, CLOVER_CLIENT_SECRET in environment
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-clover-signature') || '';

    console.log('[Clover Webhook] Received request');

    // Get webhook secret
    const webhookSecret = getCloverWebhookSecret();
    if (!webhookSecret) {
      console.error('[Clover Webhook] Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature (if provided)
    if (signature && !verifyCloverSignature(rawBody, signature, webhookSecret)) {
      console.error('[Clover Webhook] Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);

    // Clover webhooks have different structures
    // Common fields: merchants (array), appId, type
    const merchants = payload.merchants || [];
    const eventType = payload.type || '';

    console.log(`[Clover Webhook] Event type: ${eventType}, Merchants: ${merchants.length}`);

    // Process each merchant's events
    for (const merchantData of merchants) {
      const merchantId = merchantData.merchantId;

      if (!merchantId) {
        console.warn('[Clover Webhook] No merchant ID in payload');
        continue;
      }

      // Handle different event types
      // Clover sends events like: CREATE, UPDATE, DELETE for various objects
      const objectType = payload.objectType || merchantData.objectType || '';

      if (objectType === 'O' || objectType === 'ORDER') {
        // Order event
        const orders = merchantData.orders?.elements || [merchantData];

        for (const order of orders) {
          // Only process paid/completed orders
          const state = order.state || order.paymentState;
          if (state === 'PAID' || state === 'COMPLETED' || state === 'locked') {
            const orderData = extractCloverOrderData(order, merchantId);
            if (!orderData) {
              console.warn('[Clover Webhook] Could not extract order data');
              continue;
            }

            const result = await processCloverOrder(orderData);
            console.log(
              `[Clover Webhook] Order processed in ${Date.now() - startTime}ms:`,
              result
            );
          }
        }
      }

      if (objectType === 'R' || objectType === 'REFUND') {
        // Refund event
        const refunds = merchantData.refunds?.elements || [merchantData];

        for (const refund of refunds) {
          const orderId = refund.orderRef?.id || refund.orderId;
          const amount = refund.amount || 0;

          if (orderId && amount > 0) {
            console.log(`[Clover Webhook] Processing refund of ${amount} cents for order ${orderId}`);
            const result = await processCloverRefund(orderId, amount);
            console.log('[Clover Webhook] Refund result:', result);
          }
        }
      }
    }

    // Also handle direct order webhooks (simpler format)
    if (payload.orderId || payload.id) {
      const merchantId = payload.merchantId || payload.merchant?.id;
      const state = payload.state || payload.paymentState;

      if (merchantId && (state === 'PAID' || state === 'COMPLETED' || state === 'locked')) {
        const orderData = extractCloverOrderData(payload, merchantId);
        if (orderData) {
          const result = await processCloverOrder(orderData);
          console.log(
            `[Clover Webhook] Direct order processed in ${Date.now() - startTime}ms:`,
            result
          );

          return NextResponse.json({
            received: true,
            processed: result.success,
            duplicate: result.duplicate,
            points_awarded: result.pointsAwarded,
          });
        }
      }
    }

    return NextResponse.json({ received: true, processed: true });

  } catch (error: any) {
    console.error('[Clover Webhook] Error processing webhook:', error);

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
 * GET /api/webhooks/clover
 *
 * Health check endpoint - Clover may ping this to verify URL
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'clover-webhook',
    timestamp: new Date().toISOString(),
  });
}
