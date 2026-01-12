// src/app/api/merchant/locations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { getLocationLimit } from '@/app/lib/plan-limits';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    const { name, nickname, address, suite, city, state, zipCode } = await req.json();

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Location name and street address are required' },
        { status: 400 }
      );
    }

    // Get merchant to use business name and check plan
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check location limit based on plan
    const locationLimit = getLocationLimit(merchant.plan);
    const currentLocationCount = await prisma.business.count({
      where: { merchantId },
    });

    if (currentLocationCount >= locationLimit) {
      return NextResponse.json(
        {
          error: `Your ${merchant.plan} plan is limited to ${locationLimit} location${locationLimit > 1 ? 's' : ''}. Please upgrade your plan to add more locations.`,
          planRestricted: true,
          currentPlan: merchant.plan,
          limit: locationLimit,
          current: currentLocationCount,
        },
        { status: 403 }
      );
    }

    // Generate unique slug for this location
    const baseSlug = `${merchant.slug}-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`;

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create new location
    const newLocation = await prisma.business.create({
      data: {
        slug,
        name: merchant.name,
        locationNickname: nickname || name,
        address,
        suite: suite?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim()?.toUpperCase() || null,
        zipCode: zipCode?.trim() || null,
        contactEmail: merchant.loginEmail,
        merchantId,
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: newLocation.id,
        name: newLocation.name,
        locationNickname: newLocation.locationNickname,
        address: newLocation.address,
        suite: newLocation.suite,
        city: newLocation.city,
        state: newLocation.state,
        zipCode: newLocation.zipCode,
      },
    });
  } catch (error: any) {
    console.error('[Add Location] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add location', details: error.message },
      { status: 500 }
    );
  }
}
