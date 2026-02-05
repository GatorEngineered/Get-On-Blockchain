// src/app/api/merchant/integrations/vagaro/connect/route.ts
// Save Vagaro API credentials for a merchant

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveVagaroCredentials, testVagaroCredentials } from '@/app/lib/pos/vagaro';

/**
 * POST /api/merchant/integrations/vagaro/connect
 *
 * Save Vagaro API credentials for the authenticated merchant.
 * Unlike OAuth-based integrations, Vagaro requires manual credential entry.
 *
 * Body:
 * - clientId: string - Vagaro API client ID
 * - clientSecret: string - Vagaro API client secret
 * - businessId: string - Vagaro business identifier
 */
export async function POST(req: NextRequest) {
  try {
    // Get merchant from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Parse request body
    const { clientId, clientSecret, businessId } = await req.json();

    if (!clientId || !clientSecret || !businessId) {
      return NextResponse.json(
        { error: 'Client ID, Client Secret, and Business ID are required' },
        { status: 400 }
      );
    }

    // Test credentials before saving
    const isValid = await testVagaroCredentials(clientId, clientSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Vagaro credentials. Please check your Client ID and Secret.' },
        { status: 400 }
      );
    }

    // Save credentials (encrypted)
    const success = await saveVagaroCredentials(
      merchantId,
      clientId,
      clientSecret,
      businessId
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save Vagaro credentials' },
        { status: 500 }
      );
    }

    console.log(`[Vagaro] Connected for merchant: ${merchantId}`);

    return NextResponse.json({
      success: true,
      message: 'Vagaro connected successfully',
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhooks/vagaro`,
    });
  } catch (error: any) {
    console.error('[Vagaro Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Vagaro', details: error.message },
      { status: 500 }
    );
  }
}
