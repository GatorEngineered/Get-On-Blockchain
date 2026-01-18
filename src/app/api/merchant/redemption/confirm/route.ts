// src/app/api/merchant/redemption/confirm/route.ts
/**
 * POST /api/merchant/redemption/confirm
 *
 * Confirm a redemption - deduct points and grant reward.
 *
 * Request body:
 * {
 *   redemptionId: string;
 *   businessId?: string; // Optional: override business location
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   transaction?: {
 *     id: string;
 *     pointsDeducted: number;
 *     newBalance: number;
 *     rewardName: string;
 *   };
 *   error?: string;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { confirmRedemption } from '@/app/lib/redemption/redemption-service';

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
      return NextResponse.json({ error: 'Invalid session - no merchant ID' }, { status: 401 });
    }

    // Staff ID if logged in as staff (optional)
    const staffId = session.staffId;

    // 2. Parse request body
    const body = await req.json();
    const { redemptionId, businessId } = body;

    if (!redemptionId) {
      return NextResponse.json({ error: 'redemptionId is required' }, { status: 400 });
    }

    // 3. Confirm redemption
    const result = await confirmRedemption(redemptionId, merchantId, staffId, businessId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
    });
  } catch (error: any) {
    console.error('[Redemption Confirm] Error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm redemption', details: error.message },
      { status: 500 }
    );
  }
}
