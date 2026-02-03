// src/app/api/merchant/redemption/verify/route.ts
/**
 * POST /api/merchant/redemption/verify
 *
 * Verify a redemption QR code scanned by staff.
 * Returns member info and reward details for confirmation.
 *
 * Request body:
 * {
 *   qrCodeHash: string; // From QR: "gob:redeem:xxx" → extract "xxx"
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   redemption?: {
 *     id: string;
 *     member: { id, firstName, lastName, email };
 *     reward: { id, name, description, pointsCost, rewardType, usdcAmount };
 *     memberBalance: number;
 *     memberTier: string;
 *     expiresAt: string;
 *   };
 *   error?: string;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRedemptionQR } from '@/app/lib/redemption/redemption-service';

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

    // 2. Parse request body
    const body = await req.json();
    let { qrCodeHash } = body;

    if (!qrCodeHash) {
      return NextResponse.json({ error: 'qrCodeHash is required' }, { status: 400 });
    }

    // Handle full QR data format: "gob:redeem:xxx" → extract "xxx"
    if (qrCodeHash.startsWith('gob:redeem:')) {
      qrCodeHash = qrCodeHash.replace('gob:redeem:', '');
    }

    // 3. Verify redemption QR
    const result = await verifyRedemptionQR(qrCodeHash, merchantId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Format response
    const redemption = result.redemption!;
    return NextResponse.json({
      success: true,
      redemption: {
        id: redemption.id,
        status: redemption.status,
        member: redemption.member,
        reward: redemption.reward,
        memberBalance: redemption.memberBalance,
        memberTier: redemption.memberTier,
        memberNote: redemption.memberNote,
        expiresAt: redemption.expiresAt.toISOString(),
        expiresInMinutes: Math.max(
          0,
          Math.round((redemption.expiresAt.getTime() - Date.now()) / 60000)
        ),
        createdAt: redemption.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Redemption Verify] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify redemption', details: error.message },
      { status: 500 }
    );
  }
}
