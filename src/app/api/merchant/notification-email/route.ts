// src/app/api/merchant/notification-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * PUT /api/merchant/notification-email
 *
 * Update merchant's notification email for marketing and reports
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

    const { notificationEmail } = await req.json();

    // Validate email format if provided
    if (notificationEmail && notificationEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(notificationEmail.trim())) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Update merchant
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        notificationEmail: notificationEmail?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification email updated successfully',
      notificationEmail: updatedMerchant.notificationEmail,
    });
  } catch (error: any) {
    console.error('[Update Notification Email] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification email', details: error.message },
      { status: 500 }
    );
  }
}
