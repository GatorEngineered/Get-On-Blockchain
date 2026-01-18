// src/app/api/merchant/redemption/decline/route.ts
/**
 * POST /api/merchant/redemption/decline
 *
 * Decline a redemption request.
 *
 * Request body:
 * {
 *   redemptionId: string;
 *   reason?: string;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { declineRedemption } from '@/app/lib/redemption/redemption-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify merchant/staff session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const merchantId = session.merchantId;
    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { redemptionId, reason } = body;

    if (!redemptionId) {
      return NextResponse.json({ error: 'redemptionId is required' }, { status: 400 });
    }

    // 3. Decline redemption
    const result = await declineRedemption(redemptionId, merchantId, reason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Redemption Decline] Error:', error);
    return NextResponse.json(
      { error: 'Failed to decline redemption', details: error.message },
      { status: 500 }
    );
  }
}
