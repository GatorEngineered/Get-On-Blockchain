// src/app/api/merchant/support/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

/**
 * POST /api/merchant/support
 *
 * Send support request email with merchant context
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    const { subject, message, category } = await req.json();

    // Validation
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    if (subject.trim().length < 5) {
      return NextResponse.json(
        { error: 'Subject must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (message.trim().length < 20) {
      return NextResponse.json(
        { error: 'Message must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Get merchant details
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // TODO: Integrate with Resend email service
    // For now, just log the support request
    console.log('[Support Request]', {
      merchantId: merchant.id,
      businessName: merchant.name,
      loginEmail: merchant.loginEmail,
      category: category || 'General',
      subject: subject.trim(),
      message: message.trim(),
      plan: merchant.plan,
      subscriptionStatus: merchant.subscriptionStatus,
    });

    // In production, send email using Resend:
    /*
    await sendEmail({
      to: 'support@getonblockchain.com',
      subject: `[Support] ${category || 'General'}: ${subject}`,
      html: generateSupportEmail({
        businessName: merchant.name,
        merchantEmail: merchant.loginEmail,
        merchantId: merchant.id,
        plan: merchant.plan,
        category: category || 'General',
        subject: subject.trim(),
        message: message.trim(),
      }),
      replyTo: merchant.loginEmail,
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Support request sent successfully. Our team will respond within 24 hours.',
    });
  } catch (error: any) {
    console.error('[Support Request] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send support request', details: error.message },
      { status: 500 }
    );
  }
}
