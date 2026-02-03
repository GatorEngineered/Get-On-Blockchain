// src/app/api/merchant/support/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { sendEmail } from '@/app/lib/email/resend';

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

    // Log support request
    console.log('[Support Request]', {
      merchantId: merchant.id,
      businessName: merchant.name,
      loginEmail: merchant.loginEmail,
      category: category || 'General',
      subject: subject.trim(),
    });

    // Send email to support team
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@getonblockchain.com';

    await sendEmail({
      to: supportEmail,
      subject: `[Support] ${category || 'General'}: ${subject.trim()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #244b7a;">New Support Request</h2>

          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Category:</strong> ${category || 'General'}</p>
            <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject.trim()}</p>
          </div>

          <h3 style="color: #333;">Message</h3>
          <div style="background: #fff; border: 1px solid #ddd; padding: 16px; border-radius: 8px;">
            <p style="white-space: pre-wrap;">${message.trim()}</p>
          </div>

          <h3 style="color: #333; margin-top: 24px;">Merchant Details</h3>
          <div style="background: #f9f9f9; padding: 16px; border-radius: 8px;">
            <p style="margin: 4px 0;"><strong>Business:</strong> ${merchant.name}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${merchant.loginEmail}">${merchant.loginEmail}</a></p>
            <p style="margin: 4px 0;"><strong>Merchant ID:</strong> ${merchant.id}</p>
            <p style="margin: 4px 0;"><strong>Plan:</strong> ${merchant.plan}</p>
            <p style="margin: 4px 0;"><strong>Subscription:</strong> ${merchant.subscriptionStatus}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 24px;">
            Reply directly to this email to respond to ${merchant.loginEmail}
          </p>
        </div>
      `,
    });

    console.log(`[Support Request] Email sent to ${supportEmail}`);

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
