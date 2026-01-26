// src/app/api/merchant/settings/special-rewards/route.ts
// Get and update birthday/anniversary reward settings for merchants

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * GET /api/merchant/settings/special-rewards
 *
 * Fetch merchant's birthday and anniversary reward settings
 */
export async function GET() {
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

    // Fetch merchant special rewards settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        birthdayRewardEnabled: true,
        birthdayRewardPoints: true,
        birthdayRewardWindowDays: true,
        anniversaryRewardEnabled: true,
        anniversaryRewardPoints: true,
        anniversaryRewardWindowDays: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get claim statistics
    const currentYear = new Date().getFullYear();

    const [birthdayClaims, anniversaryClaims] = await Promise.all([
      prisma.merchantMember.count({
        where: {
          merchantId,
          lastBirthdayClaimYear: currentYear,
        },
      }),
      prisma.merchantMember.count({
        where: {
          merchantId,
          lastAnniversaryClaimYear: currentYear,
        },
      }),
    ]);

    return NextResponse.json({
      birthday: {
        enabled: merchant.birthdayRewardEnabled,
        points: merchant.birthdayRewardPoints,
        windowDays: merchant.birthdayRewardWindowDays,
        claimsThisYear: birthdayClaims,
      },
      anniversary: {
        enabled: merchant.anniversaryRewardEnabled,
        points: merchant.anniversaryRewardPoints,
        windowDays: merchant.anniversaryRewardWindowDays,
        claimsThisYear: anniversaryClaims,
      },
    });
  } catch (error: any) {
    console.error('[Special Rewards Settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch special rewards settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/merchant/settings/special-rewards
 *
 * Update merchant's birthday and anniversary reward settings
 */
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const {
      birthdayRewardEnabled,
      birthdayRewardPoints,
      birthdayRewardWindowDays,
      anniversaryRewardEnabled,
      anniversaryRewardPoints,
      anniversaryRewardWindowDays,
    } = body;

    // Build update data (only include fields that are provided)
    const updateData: any = {};

    // Birthday settings
    if (typeof birthdayRewardEnabled === 'boolean') {
      updateData.birthdayRewardEnabled = birthdayRewardEnabled;
    }

    if (typeof birthdayRewardPoints === 'number') {
      if (birthdayRewardPoints < 1 || birthdayRewardPoints > 10000) {
        return NextResponse.json(
          { error: 'Birthday reward points must be between 1 and 10000' },
          { status: 400 }
        );
      }
      updateData.birthdayRewardPoints = birthdayRewardPoints;
    }

    if (typeof birthdayRewardWindowDays === 'number') {
      if (birthdayRewardWindowDays < 1 || birthdayRewardWindowDays > 30) {
        return NextResponse.json(
          { error: 'Birthday reward window must be between 1 and 30 days' },
          { status: 400 }
        );
      }
      updateData.birthdayRewardWindowDays = birthdayRewardWindowDays;
    }

    // Anniversary settings
    if (typeof anniversaryRewardEnabled === 'boolean') {
      updateData.anniversaryRewardEnabled = anniversaryRewardEnabled;
    }

    if (typeof anniversaryRewardPoints === 'number') {
      if (anniversaryRewardPoints < 1 || anniversaryRewardPoints > 10000) {
        return NextResponse.json(
          { error: 'Anniversary reward points must be between 1 and 10000' },
          { status: 400 }
        );
      }
      updateData.anniversaryRewardPoints = anniversaryRewardPoints;
    }

    if (typeof anniversaryRewardWindowDays === 'number') {
      if (anniversaryRewardWindowDays < 1 || anniversaryRewardWindowDays > 30) {
        return NextResponse.json(
          { error: 'Anniversary reward window must be between 1 and 30 days' },
          { status: 400 }
        );
      }
      updateData.anniversaryRewardWindowDays = anniversaryRewardWindowDays;
    }

    // Update merchant settings
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        birthdayRewardEnabled: true,
        birthdayRewardPoints: true,
        birthdayRewardWindowDays: true,
        anniversaryRewardEnabled: true,
        anniversaryRewardPoints: true,
        anniversaryRewardWindowDays: true,
      },
    });

    console.log(`[Special Rewards Settings] Updated settings for merchant ${merchantId}`);

    return NextResponse.json({
      success: true,
      birthday: {
        enabled: merchant.birthdayRewardEnabled,
        points: merchant.birthdayRewardPoints,
        windowDays: merchant.birthdayRewardWindowDays,
      },
      anniversary: {
        enabled: merchant.anniversaryRewardEnabled,
        points: merchant.anniversaryRewardPoints,
        windowDays: merchant.anniversaryRewardWindowDays,
      },
    });
  } catch (error: any) {
    console.error('[Special Rewards Settings PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update special rewards settings', details: error.message },
      { status: 500 }
    );
  }
}
