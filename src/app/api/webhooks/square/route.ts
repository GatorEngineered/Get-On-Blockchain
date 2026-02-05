// src/app/api/webhooks/square/route.ts
// Square POS Webhook Handler - Receives payment events and awards loyalty points

import { NextRequest, NextResponse } from 'next/server';
import {
  verifySquareSignature,
  extractPaymentData,
  processSquarePayment,
  processSquareRefund,
  getMerchantSignatureKey,
} from '@/app/lib/pos/square';

// Webhook URL for signature verification
const WEBHOOK_URL =
  process.env.SQUARE_WEBHOOK_URL ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/square`;

// Fallback global signature key (for backwards compatibility)
const GLOBAL_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

/**
 * POST /api/webhooks/square
 *
 * Handles Square webhook events for automatic points awarding
 *
 * Events handled:
 * - payment.created/updated - Award points based on transaction amount
 * - refund.created - Deduct points for refunded transactions
 *
 * Security:
 * - Verifies HMAC-SHA256 signature (per-merchant key or global fallback)
 * - Idempotent processing (duplicate payments are ignored)
 *
 * Setup:
 * 1. Merchant connects Square via OAuth
 * 2. Webhook is auto-registered during OAuth callback
 * 3. Signature key is stored per-merchant for verification
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-square-hmacsha256-signature') || '';

    console.log('[Square Webhook] Received request');

    // Parse the webhook payload first to get location_id
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const eventType = payload.type;
    const eventId = payload.event_id;
    const locationId = payload.data?.object?.payment?.location_id ||
                       payload.data?.object?.refund?.location_id;

    console.log(`[Square Webhook] Event: ${eventType}, ID: ${eventId}, Location: ${locationId}`);

    // Get merchant's signature key, fall back to global key
    let signatureKey = GLOBAL_SIGNATURE_KEY || '';
    if (locationId) {
      const merchantKey = await getMerchantSignatureKey(locationId);
      if (merchantKey) {
        signatureKey = merchantKey;
      }
    }

    // Verify webhook signature
    if (!verifySquareSignature(rawBody, signature, WEBHOOK_URL, signatureKey)) {
      console.error('[Square Webhook] Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Route based on event type
    // Note: Square uses payment.created and payment.updated (not payment.completed)
    switch (eventType) {
      case 'payment.created':
      case 'payment.updated': {
        const paymentData = extractPaymentData(payload);
        if (!paymentData) {
          console.warn('[Square Webhook] Could not extract payment data');
          return NextResponse.json({ received: true, processed: false });
        }

        // Only process completed payments
        if (paymentData.status !== 'COMPLETED') {
          console.log(`[Square Webhook] Payment status is ${paymentData.status}, skipping`);
          return NextResponse.json({ received: true, processed: false });
        }

        // Check for refund on payment.updated
        const payment = payload.data?.object?.payment;
        if (eventType === 'payment.updated' && payment?.refunded_money?.amount > 0) {
          console.log('[Square Webhook] Payment has refund, processing');
          const result = await processSquareRefund(
            payment.id,
            payment.refunded_money.amount
          );
          return NextResponse.json({
            received: true,
            processed: result.success,
            points_deducted: result.pointsAwarded ? -result.pointsAwarded : 0,
          });
        }

        const result = await processSquarePayment(paymentData);
        console.log(
          `[Square Webhook] Payment processed in ${Date.now() - startTime}ms:`,
          result
        );

        return NextResponse.json({
          received: true,
          processed: result.success,
          duplicate: result.duplicate,
          points_awarded: result.pointsAwarded,
        });
      }

      case 'refund.created': {
        const refund = payload.data?.object?.refund;
        if (refund?.payment_id && refund?.amount_money?.amount) {
          console.log('[Square Webhook] Processing refund');
          const result = await processSquareRefund(
            refund.payment_id,
            refund.amount_money.amount
          );
          return NextResponse.json({
            received: true,
            processed: result.success,
            points_deducted: result.pointsAwarded ? -result.pointsAwarded : 0,
          });
        }
        console.warn('[Square Webhook] Invalid refund payload');
        return NextResponse.json({ received: true, processed: false });
      }

      default:
        // Log unhandled event types but return 200 to acknowledge receipt
        console.log(`[Square Webhook] Unhandled event type: ${eventType}`);
        return NextResponse.json({ received: true, processed: false });
    }
  } catch (error: any) {
    console.error('[Square Webhook] Error processing webhook:', error);

    // Return 200 to prevent Square from retrying (we've logged the error)
    // Return 500 only for truly unexpected errors that might be transient
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
 * GET /api/webhooks/square
 *
 * Health check endpoint - Square may ping this to verify the webhook URL
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'square-webhook',
    timestamp: new Date().toISOString(),
  });
}
