// src/app/api/merchant/integrations/vagaro/disconnect/route.ts
// Remove Vagaro integration for a merchant

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { disconnectVagaro } from '@/app/lib/pos/vagaro';

/**
 * POST /api/merchant/integrations/vagaro/disconnect
 *
 * Remove Vagaro integration for the authenticated merchant.
 */
export async function POST() {
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

    // Remove Vagaro credentials
    const success = await disconnectVagaro(merchantId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disconnect Vagaro' },
        { status: 500 }
      );
    }

    console.log(`[Vagaro] Disconnected for merchant: ${merchantId}`);

    return NextResponse.json({
      success: true,
      message: 'Vagaro disconnected successfully',
    });
  } catch (error: any) {
    console.error('[Vagaro Disconnect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Vagaro', details: error.message },
      { status: 500 }
    );
  }
}
