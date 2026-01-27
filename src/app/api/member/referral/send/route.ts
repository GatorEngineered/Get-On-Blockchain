// src/app/api/member/referral/send/route.ts
// Send a referral to a friend

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import {
  sendReferralInviteEmail,
  sendMerchantReferralSentNotification,
} from '@/lib/email/notifications';

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

/**
 * POST /api/member/referral/send
 *
 * Send a referral invitation to a friend
 *
 * Request body:
 * {
 *   referredEmail: string;  // Email of friend to refer
 *   merchantId: string;     // Merchant context for the referral
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { referredEmail, merchantId } = body;

    // Validate inputs
    if (!referredEmail || !merchantId) {
      return NextResponse.json(
        { error: 'Referred email and merchant ID are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referredEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get member info
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can't refer yourself
    if (member.email.toLowerCase() === referredEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "You can't refer yourself" },
        { status: 400 }
      );
    }

    // Get merchant and check if referrals are enabled
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        slug: true,
        loginEmail: true,
        referralEnabled: true,
        referralPointsValue: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.referralEnabled) {
      return NextResponse.json(
        { error: 'Referrals are not enabled for this merchant' },
        { status: 400 }
      );
    }

    // Check if member has already referred this email for this merchant
    const existingReferral = await prisma.referral.findUnique({
      where: {
        referrerId_merchantId_referredEmail: {
          referrerId: memberId,
          merchantId: merchantId,
          referredEmail: referredEmail.toLowerCase(),
        },
      },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'You have already referred this email address' },
        { status: 400 }
      );
    }

    // Check if the referred email is already a member of this merchant
    const existingMember = await prisma.member.findUnique({
      where: { email: referredEmail.toLowerCase() },
      include: {
        merchantMembers: {
          where: { merchantId: merchantId },
        },
      },
    });

    if (existingMember && existingMember.merchantMembers.length > 0) {
      return NextResponse.json(
        { error: 'This person is already a member of this loyalty program' },
        { status: 400 }
      );
    }

    // Create the referral
    const referral = await prisma.referral.create({
      data: {
        referrerId: memberId,
        merchantId: merchantId,
        referredEmail: referredEmail.toLowerCase(),
        status: 'PENDING',
        source: 'email', // Track that this was an email-based referral
      },
    });

    // Log the event
    await prisma.event.create({
      data: {
        merchantId: merchantId,
        memberId: memberId,
        type: 'REFERRAL_SENT',
        metadata: {
          referralId: referral.id,
          referredEmail: referredEmail.toLowerCase(),
        },
      },
    });

    const referrerName = member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.firstName || member.email.split('@')[0];

    // Send email to referred friend (non-blocking)
    sendReferralInviteEmail({
      referredEmail: referredEmail.toLowerCase(),
      referrerName,
      merchantName: merchant.name,
      merchantSlug: merchant.slug,
    }).catch((err) => {
      console.error('[Referral] Failed to send invite email:', err);
    });

    // Notify merchant (non-blocking)
    sendMerchantReferralSentNotification({
      merchantEmail: merchant.loginEmail,
      merchantName: merchant.name,
      referrerName,
      referrerEmail: member.email,
      referredEmail: referredEmail.toLowerCase(),
    }).catch((err) => {
      console.error('[Referral] Failed to send merchant notification:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Referral sent successfully!',
      referral: {
        id: referral.id,
        referredEmail: referral.referredEmail,
        status: referral.status,
        pointsValue: merchant.referralPointsValue,
      },
    });
  } catch (error: any) {
    console.error('[Referral Send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send referral', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/member/referral/send
 *
 * Get member's referral history for a merchant
 *
 * Query params:
 * - merchantId: string (required)
 */
export async function GET(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Get referrals for this member and merchant
    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: memberId,
        merchantId: merchantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        referredEmail: true,
        status: true,
        pointsAwarded: true,
        createdAt: true,
        convertedAt: true,
      },
    });

    // Get merchant referral settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        referralEnabled: true,
        referralPointsValue: true,
      },
    });

    return NextResponse.json({
      referrals,
      settings: merchant ? {
        enabled: merchant.referralEnabled,
        pointsValue: merchant.referralPointsValue,
      } : null,
    });
  } catch (error: any) {
    console.error('[Referral History] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get referrals', details: error.message },
      { status: 500 }
    );
  }
}
