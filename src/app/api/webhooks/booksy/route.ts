// src/app/api/webhooks/booksy/route.ts
// Booksy POS Webhook Handler - Receives appointment events and awards loyalty points

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAppointmentData,
  processBooksyAppointment,
  processBooksyRefund,
  validateBooksyBusinessId,
} from '@/app/lib/pos/booksy';

/**
 * POST /api/webhooks/booksy
 *
 * Handles Booksy webhook events for automatic points awarding
 *
 * Events handled:
 * - appointment.completed - Award points based on appointment price
 * - appointment.cancelled - Deduct points (refund)
 *
 * Security:
 * - Validates business ID against registered merchants
 * - Idempotent processing (duplicate appointments are ignored)
 *
 * Setup:
 * 1. Merchant connects Booksy via OAuth in settings
 * 2. Configure webhook in Booksy developer portal:
 *    URL: https://yourdomain.com/api/webhooks/booksy
 *    Events: appointment.completed, appointment.cancelled
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Read raw body
    const rawBody = await req.text();

    console.log('[Booksy Webhook] Received request');

    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('[Booksy Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const eventType = payload.event_type || payload.type;
    const eventId = payload.id || payload.event_id;

    console.log(`[Booksy Webhook] Event: ${eventType}, ID: ${eventId}`);

    // Validate business ID before processing
    const businessId = payload.data?.business_id;
    if (!businessId) {
      console.warn('[Booksy Webhook] No business ID in payload');
      return NextResponse.json(
        { received: true, processed: false, reason: 'no_business_id' }
      );
    }

    const merchantId = await validateBooksyBusinessId(String(businessId));
    if (!merchantId) {
      console.warn('[Booksy Webhook] Unknown business ID:', businessId);
      return NextResponse.json({
        received: true,
        processed: false,
        reason: 'business_not_registered',
      });
    }

    // Route based on event type
    switch (eventType) {
      case 'appointment.completed':
      case 'appointment.finished': {
        const appointmentData = extractAppointmentData(payload);
        if (!appointmentData) {
          console.warn('[Booksy Webhook] Could not extract appointment data');
          return NextResponse.json({ received: true, processed: false });
        }

        const result = await processBooksyAppointment(appointmentData);
        console.log(
          `[Booksy Webhook] Appointment processed in ${Date.now() - startTime}ms:`,
          result
        );

        return NextResponse.json({
          received: true,
          processed: result.success,
          duplicate: result.duplicate,
          points_awarded: result.pointsAwarded,
        });
      }

      case 'appointment.cancelled':
      case 'appointment.refunded': {
        const appointmentData = extractAppointmentData(payload);
        if (!appointmentData) {
          console.warn('[Booksy Webhook] Could not extract cancellation data');
          return NextResponse.json({ received: true, processed: false });
        }

        const result = await processBooksyRefund(
          appointmentData.appointmentId,
          appointmentData.totalPrice
        );
        console.log(
          `[Booksy Webhook] Refund processed in ${Date.now() - startTime}ms:`,
          result
        );

        return NextResponse.json({
          received: true,
          processed: result.success,
          points_deducted: result.pointsAwarded ? Math.abs(result.pointsAwarded) : 0,
        });
      }

      case 'appointment.created':
      case 'appointment.modified': {
        // Log but don't process - only award on completion
        console.log(`[Booksy Webhook] ${eventType} event received (not processing)`);
        return NextResponse.json({ received: true, processed: false });
      }

      case 'customer.created':
      case 'customer.updated': {
        // For future: Could sync customer data
        console.log(`[Booksy Webhook] Customer event received (not processing)`);
        return NextResponse.json({ received: true, processed: false });
      }

      default:
        console.log(`[Booksy Webhook] Unhandled event type: ${eventType}`);
        return NextResponse.json({ received: true, processed: false });
    }
  } catch (error: any) {
    console.error('[Booksy Webhook] Error processing webhook:', error);

    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/booksy
 *
 * Health check endpoint - Booksy may ping this to verify the webhook URL
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'booksy-webhook',
    timestamp: new Date().toISOString(),
  });
}
