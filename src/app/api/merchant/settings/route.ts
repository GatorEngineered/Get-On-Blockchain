// src/app/api/merchant/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * GET /api/merchant/settings
 *
 * Fetch merchant data for settings page
 */
export async function GET(req: NextRequest) {
  try {
    // Get merchant session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch merchant with all businesses
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Separate main business from additional locations
    const mainBusiness = merchant.businesses[0];
    const additionalLocations = merchant.businesses.slice(1);

    return NextResponse.json({
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
      loginEmail: merchant.loginEmail,
      plan: merchant.plan,
      subscriptionStatus: merchant.subscriptionStatus,
      paymentVerified: merchant.paymentVerified,
      mainBusiness: mainBusiness ? {
        id: mainBusiness.id,
        name: mainBusiness.name,
        address: mainBusiness.address,
        suite: mainBusiness.suite,
        city: mainBusiness.city,
        state: mainBusiness.state,
        zipCode: mainBusiness.zipCode,
      } : null,
      additionalLocations: additionalLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        locationNickname: loc.locationNickname,
        address: loc.address,
        suite: loc.suite,
        city: loc.city,
        state: loc.state,
        zipCode: loc.zipCode,
      })),
      // All businesses (for QR codes)
      businesses: merchant.businesses.map(biz => ({
        id: biz.id,
        slug: biz.slug,
        name: biz.name,
        locationNickname: biz.locationNickname,
        address: biz.address,
        suite: biz.suite,
        city: biz.city,
        state: biz.state,
        zipCode: biz.zipCode,
      })),
      // Payout settings
      payoutEnabled: merchant.payoutEnabled,
      payoutWalletAddress: merchant.payoutWalletAddress,
      payoutMilestonePoints: merchant.payoutMilestonePoints,
      payoutAmountUSD: merchant.payoutAmountUSD,
      // Reward tier settings
      welcomePoints: merchant.welcomePoints,
      earnPerVisit: merchant.earnPerVisit,
      vipThreshold: merchant.vipThreshold,
      superThreshold: merchant.superThreshold,
      // Email settings
      notificationEmail: merchant.notificationEmail,
    });
  } catch (error: any) {
    console.error('[Merchant Settings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}
