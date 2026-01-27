// src/app/api/member/referral/link/route.ts
// Get or generate a member's referral link for sharing

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { generateReferralCode, buildShareUrls } from '@/app/lib/referral-code';

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
 * GET /api/member/referral/link?merchantId=xxx
 *
 * Get member's referral link for a merchant
 * Auto-generates referral code if not exists
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

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        slug: true,
        referralEnabled: true,
        referralPointsValue: true,
        welcomePoints: true,
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

    // Get or create MerchantMember with referral code
    let merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId,
        },
      },
    });

    if (!merchantMember) {
      return NextResponse.json(
        { error: 'You must be a member of this loyalty program to share referrals' },
        { status: 400 }
      );
    }

    // Generate referral code if not exists
    if (!merchantMember.referralCode) {
      let referralCode = generateReferralCode();

      // Ensure uniqueness (rare collision case)
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.merchantMember.findUnique({
          where: { referralCode },
        });
        if (!existing) break;
        referralCode = generateReferralCode();
        attempts++;
      }

      merchantMember = await prisma.merchantMember.update({
        where: { id: merchantMember.id },
        data: { referralCode },
      });
    }

    // Build share URLs
    const shareUrls = buildShareUrls(
      merchant.slug,
      merchantMember.referralCode!,
      merchant.name,
      merchant.welcomePoints
    );

    return NextResponse.json({
      referralCode: merchantMember.referralCode,
      shareUrls,
      merchant: {
        name: merchant.name,
        slug: merchant.slug,
        pointsValue: merchant.referralPointsValue,
        welcomePoints: merchant.welcomePoints,
      },
    });
  } catch (error: any) {
    console.error('[Referral Link] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get referral link', details: error.message },
      { status: 500 }
    );
  }
}
