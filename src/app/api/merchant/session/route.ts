import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

/**
 * GET /api/merchant/session
 *
 * Check if merchant is logged in and return session info
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ authenticated: false });
    }

    // Fetch merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        loginEmail: true,
        plan: true,
        subscriptionStatus: true,
        paypalSubscriptionId: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      merchantId: merchant.id,
      name: merchant.name,
      email: merchant.loginEmail,
      plan: merchant.plan,
      subscriptionStatus: merchant.subscriptionStatus,
      hasActiveSubscription: !!merchant.paypalSubscriptionId,
    });
  } catch (error: any) {
    console.error('[Merchant Session] Error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
