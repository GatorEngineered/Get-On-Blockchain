// src/app/api/merchant/update-business-name/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * PUT /api/merchant/update-business-name
 *
 * Update merchant business name
 */
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    const { businessName } = await req.json();

    if (!businessName || !businessName.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    // Update merchant name
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: { name: businessName.trim() },
    });

    // Also update all business locations with the new name
    await prisma.business.updateMany({
      where: { merchantId },
      data: { name: businessName.trim() },
    });

    // Update session cookie with new name
    const newSession = {
      ...session,
      name: businessName.trim(),
    };

    const response = NextResponse.json({
      success: true,
      name: updatedMerchant.name,
    });

    response.cookies.set('gob_merchant_session', JSON.stringify(newSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Update Business Name] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update business name', details: error.message },
      { status: 500 }
    );
  }
}
