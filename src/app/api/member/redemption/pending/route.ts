// src/app/api/member/redemption/pending/route.ts
/**
 * GET /api/member/redemption/pending?merchantId=xxx
 *
 * Get member's pending redemption requests for a merchant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMemberPendingRedemptions } from '@/app/lib/redemption/redemption-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify member session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const memberId = session.memberId;
    if (!memberId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Get merchantId from query
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    // 3. Get pending redemptions
    const pending = await getMemberPendingRedemptions(memberId, merchantId);

    // Format response with time remaining
    const formatted = pending.map((r) => ({
      id: r.id,
      rewardId: r.rewardId,
      rewardName: r.reward.name,
      rewardDescription: r.reward.description,
      pointsCost: r.reward.pointsCost,
      qrCodeHash: r.qrCodeHash,
      qrCodeData: `gob:redeem:${r.qrCodeHash}`,
      expiresAt: r.expiresAt.toISOString(),
      expiresInMinutes: Math.max(0, Math.round((r.expiresAt.getTime() - Date.now()) / 60000)),
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      pending: formatted,
    });
  } catch (error: any) {
    console.error('[Redemption Pending] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get pending redemptions', details: error.message },
      { status: 500 }
    );
  }
}
