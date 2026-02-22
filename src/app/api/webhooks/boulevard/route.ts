// src/app/api/webhooks/boulevard/route.ts
// Boulevard POS Webhook Handler - Receives appointment/payment events and awards loyalty points

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAppointmentData,
  processBoulevardAppointment,
  processBoulevardRefund,
  validateBoulevardBusinessId,
} from '@/app/lib/pos/boulevard';

/**
 * POST /api/webhooks/boulevard
 *
 * Handles Boulevard webhook events for automatic points awarding
 *
 * Events handled:
 * - appointment.completed - Award points based on appointment total
 * - appointment.cancelled - Deduct points (refund)
 *
 * Security:
 * - Validates business ID against registered merchants
 * - Idempotent processing (duplicate appointments are ignored)
 *
 * Setup:
 * 1. Merchant connects Boulevard via OAuth in settings (Enterprise plan required)
 * 2. Configure webhook in Boulevard developer portal:
 *    URL: https://yourdomain.com/api/webhooks/boulevard
 *    Events: appointment.completed, appointment.cancelled
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await req.text();

    console.log('[Boulevard Webhook] Received request');

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('[Boulevard Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const eventType = payload.event || payload.event_type;
    const eventId = payload.id || payload.event_id;

    console.log(`[Boulevard Webhook] Event: ${eventType}, ID: ${eventId}`);

    // Validate business ID
    const businessId = payload.business_id || payload.resource?.business_id;
    if (!businessId) {
      console.warn('[Boulevard Webhook] No business ID in payload');
      return NextResponse.json(
        { received: true, processed: false, reason: 'no_business_id' }
      );
    }

    const merchantId = await validateBoulevardBusinessId(String(businessId));
    if (!merchantId) {
      console.warn('[Boulevard Webhook] Unknown business ID:', businessId);
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
          console.warn('[Boulevard Webhook] Could not extract appointment data');
          return NextResponse.json({ received: true, processed: false });
        }

        const result = await processBoulevardAppointment(appointmentData);
        console.log(
          `[Boulevard Webhook] Appointment processed in ${Date.now() - startTime}ms:`,
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
          console.warn('[Boulevard Webhook] Could not extract cancellation data');
          return NextResponse.json({ received: true, processed: false });
        }

        const result = await processBoulevardRefund(
          appointmentData.appointmentId,
          appointmentData.totalPrice
        );
        console.log(
          `[Boulevard Webhook] Refund processed in ${Date.now() - startTime}ms:`,
          result
        );

        return NextResponse.json({
          received: true,
          processed: result.success,
          points_deducted: result.pointsAwarded ? Math.abs(result.pointsAwarded) : 0,
        });
      }

      case 'appointment.created':
      case 'appointment.rescheduled': {
        console.log(`[Boulevard Webhook] ${eventType} event received (not processing)`);
        return NextResponse.json({ received: true, processed: false });
      }

      case 'client.created':
      case 'client.updated': {
        console.log(`[Boulevard Webhook] Client event received (not processing)`);
        return NextResponse.json({ received: true, processed: false });
      }

      default:
        console.log(`[Boulevard Webhook] Unhandled event type: ${eventType}`);
        return NextResponse.json({ received: true, processed: false });
    }
  } catch (error: any) {
    console.error('[Boulevard Webhook] Error processing webhook:', error);

    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/boulevard
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'boulevard-webhook',
    timestamp: new Date().toISOString(),
  });
}
