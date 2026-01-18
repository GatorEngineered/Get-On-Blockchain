// src/app/api/member/redemption/cancel/route.ts
/**
 * POST /api/member/redemption/cancel
 *
 * Cancel a pending redemption request.
 *
 * Request body:
 * {
 *   redemptionId: string;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cancelRedemption } from '@/app/lib/redemption/redemption-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    // 2. Parse request body
    const body = await req.json();
    const { redemptionId } = body;

    if (!redemptionId) {
      return NextResponse.json({ error: 'redemptionId is required' }, { status: 400 });
    }

    // 3. Cancel redemption
    const result = await cancelRedemption(redemptionId, memberId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Redemption Cancel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel redemption', details: error.message },
      { status: 500 }
    );
  }
}
