// src/app/api/member/redemption/create/route.ts
/**
 * POST /api/member/redemption/create
 *
 * Creates a redemption request and returns QR code data.
 * Member shows this QR to staff to redeem reward.
 *
 * Request body:
 * {
 *   merchantId: string;
 *   rewardId: string;
 *   businessId?: string; // Optional: specific location
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   redemptionId?: string;
 *   qrCodeData?: string;     // Data to encode in QR
 *   expiresAt?: string;      // ISO timestamp
 *   expiresInMinutes?: number;
 *   error?: string;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRedemptionRequest } from '@/app/lib/redemption/redemption-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify member session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const memberId = session.memberId;
    if (!memberId) {
      return NextResponse.json({ error: 'Invalid session - no member ID' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { merchantId, rewardId, businessId } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    if (!rewardId) {
      return NextResponse.json({ error: 'rewardId is required' }, { status: 400 });
    }

    // 3. Create redemption request
    const result = await createRedemptionRequest({
      memberId,
      merchantId,
      rewardId,
      businessId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Calculate time remaining
    const expiresInMinutes = result.expiresAt
      ? Math.round((result.expiresAt.getTime() - Date.now()) / 60000)
      : 10;

    return NextResponse.json({
      success: true,
      redemptionId: result.redemptionId,
      qrCodeData: result.qrCodeData,
      qrCodeHash: result.qrCodeHash,
      expiresAt: result.expiresAt?.toISOString(),
      expiresInMinutes,
    });
  } catch (error: any) {
    console.error('[Redemption Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create redemption request', details: error.message },
      { status: 500 }
    );
  }
}
