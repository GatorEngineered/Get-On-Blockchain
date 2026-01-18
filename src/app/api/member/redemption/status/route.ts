// src/app/api/member/redemption/status/route.ts
/**
 * GET /api/member/redemption/status?id=xxx
 *
 * Get status of a redemption request (for polling).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

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

    // 2. Get redemption ID from query
    const { searchParams } = new URL(req.url);
    const redemptionId = searchParams.get('id');

    if (!redemptionId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // 3. Get redemption status
    const redemption = await prisma.redemptionRequest.findUnique({
      where: { id: redemptionId },
      select: {
        id: true,
        memberId: true,
        status: true,
        expiresAt: true,
        confirmedAt: true,
        declinedAt: true,
      },
    });

    if (!redemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 });
    }

    // Verify member owns this redemption
    if (redemption.memberId !== memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if expired (and update if needed)
    if (redemption.status === 'PENDING' && redemption.expiresAt < new Date()) {
      await prisma.redemptionRequest.update({
        where: { id: redemptionId },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ status: 'EXPIRED' });
    }

    return NextResponse.json({
      status: redemption.status,
      confirmedAt: redemption.confirmedAt?.toISOString(),
      declinedAt: redemption.declinedAt?.toISOString(),
    });
  } catch (error: any) {
    console.error('[Redemption Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get status', details: error.message },
      { status: 500 }
    );
  }
}
