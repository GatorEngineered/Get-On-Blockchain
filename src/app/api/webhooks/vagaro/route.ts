// src/app/api/webhooks/vagaro/route.ts
// Vagaro POS Webhook Handler - Receives transaction events and awards loyalty points

import { NextRequest, NextResponse } from 'next/server';
import {
  extractTransactionData,
  processVagaroTransaction,
  validateVagaroBusinessId,
} from '@/app/lib/pos/vagaro';

/**
 * POST /api/webhooks/vagaro
 *
 * Handles Vagaro webhook events for automatic points awarding
 *
 * Events handled:
 * - transaction (action: created) - Award points based on transaction amount
 *
 * Security:
 * - Validates business ID against registered merchants
 * - Idempotent processing (duplicate transactions are ignored)
 *
 * Setup:
 * 1. Merchant connects Vagaro via settings (enters client ID, secret, business ID)
 * 2. Merchant configures webhook URL in Vagaro dashboard:
 *    Settings → Developers → APIs & Webhooks → Create Webhook
 * 3. Set endpoint to: https://yourdomain.com/api/webhooks/vagaro
 * 4. Select "Transactions" event type
 *
 * Vagaro webhook structure:
 * {
 *   "id": "unique-event-id",
 *   "createdDate": "2024-02-15T00:00:00Z",
 *   "type": "transaction",
 *   "action": "created",
 *   "payload": { ...transaction data... }
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Read raw body
    const rawBody = await req.text();

    console.log('[Vagaro Webhook] Received request');

    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('[Vagaro Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const eventType = payload.type;
    const eventAction = payload.action;
    const eventId = payload.id;

    console.log(`[Vagaro Webhook] Event: ${eventType}, Action: ${eventAction}, ID: ${eventId}`);

    // Validate business ID before processing
    const businessId = payload.payload?.businessId;
    if (!businessId) {
      console.warn('[Vagaro Webhook] No business ID in payload');
      return NextResponse.json(
        { received: true, processed: false, reason: 'no_business_id' }
      );
    }

    const merchantId = await validateVagaroBusinessId(businessId);
    if (!merchantId) {
      console.warn('[Vagaro Webhook] Unknown business ID:', businessId);
      // Return 200 to acknowledge receipt but don't process
      // This prevents Vagaro from retrying for non-connected merchants
      return NextResponse.json({
        received: true,
        processed: false,
        reason: 'business_not_registered',
      });
    }

    // Route based on event type
    switch (eventType) {
      case 'transaction': {
        // Only process created transactions (not refunds for now)
        if (eventAction !== 'created') {
          console.log(`[Vagaro Webhook] Transaction action is ${eventAction}, skipping`);
          return NextResponse.json({ received: true, processed: false });
        }

        const transactionData = extractTransactionData(payload);
        if (!transactionData) {
          console.warn('[Vagaro Webhook] Could not extract transaction data');
          return NextResponse.json({ received: true, processed: false });
        }

        const result = await processVagaroTransaction(transactionData);
        console.log(
          `[Vagaro Webhook] Transaction processed in ${Date.now() - startTime}ms:`,
          result
        );

        return NextResponse.json({
          received: true,
          processed: result.success,
          duplicate: result.duplicate,
          points_awarded: result.pointsAwarded,
        });
      }

      case 'appointment': {
        // For future: Could award points for completed appointments
        console.log('[Vagaro Webhook] Appointment event received (not processing)');
        return NextResponse.json({ received: true, processed: false });
      }

      case 'customer': {
        // For future: Could sync customer data
        console.log('[Vagaro Webhook] Customer event received (not processing)');
        return NextResponse.json({ received: true, processed: false });
      }

      default:
        // Log unhandled event types but return 200 to acknowledge receipt
        console.log(`[Vagaro Webhook] Unhandled event type: ${eventType}`);
        return NextResponse.json({ received: true, processed: false });
    }
  } catch (error: any) {
    console.error('[Vagaro Webhook] Error processing webhook:', error);

    // Return 500 for errors - Vagaro will retry up to 5 times
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/vagaro
 *
 * Health check endpoint - Vagaro may ping this to verify the webhook URL
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'vagaro-webhook',
    timestamp: new Date().toISOString(),
  });
}
