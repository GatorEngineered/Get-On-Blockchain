// src/app/api/merchant/update-main-address/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    const { address, suite, city, state, zipCode } = await req.json();

    if (!address || !address.trim()) {
      return NextResponse.json({ error: 'Street address is required' }, { status: 400 });
    }

    // Get first business (main location)
    const businesses = await prisma.business.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'asc' },
      take: 1,
    });

    if (!businesses.length) {
      return NextResponse.json({ error: 'Main business not found' }, { status: 404 });
    }

    // Update main business address with all fields
    await prisma.business.update({
      where: { id: businesses[0].id },
      data: {
        address: address.trim(),
        suite: suite?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim()?.toUpperCase() || null,
        zipCode: zipCode?.trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Update Main Address] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update address', details: error.message },
      { status: 500 }
    );
  }
}
