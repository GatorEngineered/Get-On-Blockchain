// src/app/api/member/email-preferences/route.ts
// Get and update member email notification preferences

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

async function getMemberIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('gob_member_session');

  if (!session?.value) return null;

  try {
    const sessionData = JSON.parse(session.value);
    return sessionData.memberId || null;
  } catch {
    return null;
  }
}

// GET - Fetch member email preferences
export async function GET() {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        // System notification preferences
        emailPayoutNotifications: true,
        emailMagicLinkEnabled: true,
        emailSecurityAlerts: true,
        // Merchant notification preferences
        emailMerchantPromotional: true,
        emailMerchantPointsUpdates: true,
        emailMerchantAnnouncements: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      preferences: {
        // System notifications
        payoutNotifications: member.emailPayoutNotifications,
        magicLinkEnabled: member.emailMagicLinkEnabled,
        securityAlerts: member.emailSecurityAlerts,
        // Merchant notifications
        merchantPromotional: member.emailMerchantPromotional,
        merchantPointsUpdates: member.emailMerchantPointsUpdates,
        merchantAnnouncements: member.emailMerchantAnnouncements,
      },
      email: member.email,
      emailVerified: member.emailVerified,
    });
  } catch (error: any) {
    console.error('[Email Preferences GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email preferences', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update member email preferences
export async function PUT(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      payoutNotifications,
      magicLinkEnabled,
      securityAlerts,
      merchantPromotional,
      merchantPointsUpdates,
      merchantAnnouncements,
    } = body;

    // Build update data with only provided fields
    const updateData: any = {};

    if (typeof payoutNotifications === 'boolean') {
      updateData.emailPayoutNotifications = payoutNotifications;
    }
    if (typeof magicLinkEnabled === 'boolean') {
      updateData.emailMagicLinkEnabled = magicLinkEnabled;
    }
    if (typeof securityAlerts === 'boolean') {
      // Note: Security alerts for critical issues will still be sent
      updateData.emailSecurityAlerts = securityAlerts;
    }
    if (typeof merchantPromotional === 'boolean') {
      updateData.emailMerchantPromotional = merchantPromotional;
    }
    if (typeof merchantPointsUpdates === 'boolean') {
      updateData.emailMerchantPointsUpdates = merchantPointsUpdates;
    }
    if (typeof merchantAnnouncements === 'boolean') {
      updateData.emailMerchantAnnouncements = merchantAnnouncements;
    }

    // If magic link is disabled, check if member has a password
    if (updateData.emailMagicLinkEnabled === false) {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { passwordHash: true },
      });

      if (!member?.passwordHash) {
        return NextResponse.json(
          {
            error: 'Cannot disable magic link emails without a password set. Please set a password first.',
          },
          { status: 400 }
        );
      }
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: updateData,
      select: {
        emailPayoutNotifications: true,
        emailMagicLinkEnabled: true,
        emailSecurityAlerts: true,
        emailMerchantPromotional: true,
        emailMerchantPointsUpdates: true,
        emailMerchantAnnouncements: true,
      },
    });

    return NextResponse.json({
      message: 'Email preferences updated successfully',
      preferences: {
        payoutNotifications: updatedMember.emailPayoutNotifications,
        magicLinkEnabled: updatedMember.emailMagicLinkEnabled,
        securityAlerts: updatedMember.emailSecurityAlerts,
        merchantPromotional: updatedMember.emailMerchantPromotional,
        merchantPointsUpdates: updatedMember.emailMerchantPointsUpdates,
        merchantAnnouncements: updatedMember.emailMerchantAnnouncements,
      },
    });
  } catch (error: any) {
    console.error('[Email Preferences PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update email preferences', details: error.message },
      { status: 500 }
    );
  }
}
