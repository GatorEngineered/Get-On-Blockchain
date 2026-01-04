// src/app/api/merchant/update-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * PUT /api/merchant/update-email
 *
 * Update merchant email address
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

    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already in use
    const existing = await prisma.merchant.findFirst({
      where: {
        loginEmail: normalizedEmail,
        NOT: { id: merchantId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already in use' },
        { status: 409 }
      );
    }

    // Update merchant email
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: { loginEmail: normalizedEmail },
    });

    // Update session cookie
    const newSession = {
      ...session,
      email: normalizedEmail,
    };

    const response = NextResponse.json({
      success: true,
      email: updatedMerchant.loginEmail,
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
    console.error('[Update Email] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update email', details: error.message },
      { status: 500 }
    );
  }
}
