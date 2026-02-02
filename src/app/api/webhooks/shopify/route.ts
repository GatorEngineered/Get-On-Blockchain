// src/app/api/webhooks/shopify/route.ts
// Shopify Webhook Handler - Receives order events and awards loyalty points

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyShopifySignature,
  extractShopifyOrderData,
  processShopifyOrder,
  processShopifyRefund,
  getShopifyWebhookSecret,
} from '@/app/lib/pos/shopify';

/**
 * POST /api/webhooks/shopify
 *
 * Handles Shopify webhook events for automatic points awarding
 *
 * Events handled:
 * - orders/paid - Award points based on order total
 * - orders/create - Award points if already paid
 * - refunds/create - Deduct points for refunded orders
 *
 * Security:
 * - Verifies HMAC-SHA256 signature from Shopify
 * - Idempotent processing (duplicate orders are ignored)
 *
 * Setup:
 * 1. Merchant connects Shopify via OAuth (existing flow)
 * 2. Register webhooks via Shopify API or Admin
 * 3. Set SHOPIFY_WEBHOOK_SECRET in environment
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-shopify-hmac-sha256') || '';
    const topic = req.headers.get('x-shopify-topic') || '';
    const shopDomain = req.headers.get('x-shopify-shop-domain') || '';

    console.log(`[Shopify Webhook] Received: ${topic} from ${shopDomain}`);

    // Get webhook secret
    const webhookSecret = getShopifyWebhookSecret();
    if (!webhookSecret) {
      console.error('[Shopify Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    if (!verifyShopifySignature(rawBody, signature, webhookSecret)) {
      console.error('[Shopify Webhook] Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);

    console.log(`[Shopify Webhook] Topic: ${topic}, Shop: ${shopDomain}`);

    // Route based on webhook topic
    switch (topic) {
      case 'orders/paid':
      case 'orders/create': {
        const orderData = extractShopifyOrderData(payload, shopDomain);
        if (!orderData) {
          console.warn('[Shopify Webhook] Could not extract order data');
          return NextResponse.json({ received: true, processed: false });
        }

        // For orders/create, only process if already paid
        if (topic === 'orders/create' && orderData.financialStatus !== 'paid') {
          console.log(`[Shopify Webhook] Order not paid yet, status: ${orderData.financialStatus}`);
          return NextResponse.json({ received: true, processed: false });
        }

        const result = await processShopifyOrder(orderData);
        console.log(
          `[Shopify Webhook] Order processed in ${Date.now() - startTime}ms:`,
          result
        );

        return NextResponse.json({
          received: true,
          processed: result.success,
          duplicate: result.duplicate,
          points_awarded: result.pointsAwarded,
        });
      }

      case 'refunds/create': {
        // Extract refund data
        const orderId = payload.order_id ? String(payload.order_id) : null;
        const refundLineItems = payload.refund_line_items || [];

        // Calculate total refund amount
        let refundAmount = 0;
        for (const item of refundLineItems) {
          refundAmount += parseFloat(item.subtotal) || 0;
        }

        // Also check transactions for the refund amount
        const transactions = payload.transactions || [];
        for (const tx of transactions) {
          if (tx.kind === 'refund' && tx.status === 'success') {
            refundAmount = Math.max(refundAmount, parseFloat(tx.amount) || 0);
          }
        }

        if (!orderId || refundAmount <= 0) {
          console.warn('[Shopify Webhook] Invalid refund payload');
          return NextResponse.json({ received: true, processed: false });
        }

        console.log(`[Shopify Webhook] Processing refund of $${refundAmount} for order ${orderId}`);
        const result = await processShopifyRefund(orderId, refundAmount, shopDomain);

        return NextResponse.json({
          received: true,
          processed: result.success,
          points_deducted: result.pointsAwarded ? -result.pointsAwarded : 0,
        });
      }

      default:
        // Log unhandled topics but return 200 to acknowledge receipt
        console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
        return NextResponse.json({ received: true, processed: false });
    }
  } catch (error: any) {
    console.error('[Shopify Webhook] Error processing webhook:', error);

    // Return 200 for parsing errors to prevent retries
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
 * GET /api/webhooks/shopify
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'shopify-webhook',
    timestamp: new Date().toISOString(),
  });
}
