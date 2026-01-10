// src/app/api/member/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import {
  hashPassword,
  validatePasswordStrength,
} from '@/app/lib/passwordUtils';
import {
  sendReferralConvertedEmail,
  sendMerchantReferralConvertedNotification,
} from '@/lib/email/notifications';

const prisma = new PrismaClient();

/**
 * POST /api/member/auth/register
 *
 * Register a new member with email and password
 *
 * Body:
 * - firstName: string (required)
 * - lastName: string (required)
 * - email: string (required)
 * - phone: string (optional)
 * - address: string (optional)
 * - password: string (required, min 8 chars, uppercase, lowercase, number, special)
 * - merchantSlug: string (optional) - for tracking registration source
 */
export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, address, password, merchantSlug } =
      await req.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        {
          error:
            'First name, last name, email, and password are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if member already exists
    const existingMember = await prisma.member.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new member
    const member = await prisma.member.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        passwordHash,
        tier: 'BASE',
      },
      include: {
        businesses: {
          include: {
            business: true,
          },
        },
      },
    });

    console.log(`[Member Registration] New member created: ${member.id} (${member.email})`);

    // Create a session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store the session token
    await prisma.memberLoginToken.create({
      data: {
        token: sessionToken,
        memberId: member.id,
        expiresAt,
        returnTo: null,
      },
    });

    // Create HTTP-only session cookie
    const cookieStore = await cookies();
    const sessionData = JSON.stringify({
      memberId: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      loginAt: new Date().toISOString(),
    });

    cookieStore.set('gob_member_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Log registration event
    // Try to find merchant by slug if provided
    let merchantId: string | null = null;
    if (merchantSlug) {
      const merchant = await prisma.merchant.findUnique({
        where: { slug: merchantSlug },
      });
      if (merchant) {
        merchantId = merchant.id;
      }
    }

    // Only create event if we have a valid merchant
    if (merchantId) {
      await prisma.event.create({
        data: {
          memberId: member.id,
          merchantId: merchantId,
          type: 'CREATE_EMAIL',
          source: 'member-registration',
          metadata: {
            registrationMethod: 'email-password',
            merchantSlug: merchantSlug || null,
          },
        },
      });
    }

    console.log(
      `[Member Registration] Member ${member.id} registered successfully`
    );

    // =========================================================================
    // REFERRAL CONVERSION: Check if any pending referrals exist for this email
    // =========================================================================
    const pendingReferrals = await prisma.referral.findMany({
      where: {
        referredEmail: normalizedEmail,
        status: 'PENDING',
      },
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        merchant: {
          select: {
            id: true,
            name: true,
            loginEmail: true,
            referralPointsValue: true,
            referralEnabled: true,
          },
        },
      },
    });

    // Process each pending referral
    for (const referral of pendingReferrals) {
      // Skip if referrals are disabled for this merchant
      if (!referral.merchant.referralEnabled) continue;

      const pointsToAward = referral.merchant.referralPointsValue;

      try {
        // Check if MerchantMember exists for the referrer
        let merchantMember = await prisma.merchantMember.findUnique({
          where: {
            merchantId_memberId: {
              merchantId: referral.merchantId,
              memberId: referral.referrerId,
            },
          },
        });

        // Create MerchantMember if it doesn't exist
        if (!merchantMember) {
          merchantMember = await prisma.merchantMember.create({
            data: {
              merchantId: referral.merchantId,
              memberId: referral.referrerId,
              points: 0,
              tier: 'BASE',
            },
          });
        }

        // Award points to referrer and update referral status
        await prisma.$transaction([
          // Update referrer's points
          prisma.merchantMember.update({
            where: { id: merchantMember.id },
            data: {
              points: {
                increment: pointsToAward,
              },
            },
          }),
          // Mark referral as converted
          prisma.referral.update({
            where: { id: referral.id },
            data: {
              status: 'CONVERTED',
              pointsAwarded: pointsToAward,
              convertedAt: new Date(),
            },
          }),
          // Log the conversion event
          prisma.event.create({
            data: {
              merchantId: referral.merchantId,
              memberId: referral.referrerId,
              type: 'REFERRAL_CONVERTED',
              metadata: {
                referralId: referral.id,
                newMemberEmail: normalizedEmail,
                newMemberId: member.id,
                pointsAwarded: pointsToAward,
              },
            },
          }),
        ]);

        const referrerName = referral.referrer.firstName && referral.referrer.lastName
          ? `${referral.referrer.firstName} ${referral.referrer.lastName}`
          : referral.referrer.firstName || referral.referrer.email.split('@')[0];

        // Send notification to referrer (non-blocking)
        sendReferralConvertedEmail({
          referrerEmail: referral.referrer.email,
          referrerName,
          merchantName: referral.merchant.name,
          referredEmail: normalizedEmail,
          pointsAwarded: pointsToAward,
        }).catch((err) => {
          console.error('[Referral] Failed to send converted email to referrer:', err);
        });

        // Notify merchant (non-blocking)
        sendMerchantReferralConvertedNotification({
          merchantEmail: referral.merchant.loginEmail,
          merchantName: referral.merchant.name,
          referrerName,
          referrerEmail: referral.referrer.email,
          newMemberEmail: normalizedEmail,
          pointsAwarded: pointsToAward,
        }).catch((err) => {
          console.error('[Referral] Failed to send converted notification to merchant:', err);
        });

        console.log(
          `[Referral Conversion] Referral ${referral.id} converted: ${referrerName} earned ${pointsToAward} pts for referring ${normalizedEmail}`
        );
      } catch (refError: any) {
        console.error(`[Referral Conversion] Error processing referral ${referral.id}:`, refError);
        // Continue processing other referrals even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      token: sessionToken,
      member: {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        address: member.address,
        tier: member.tier,
      },
    });
  } catch (error: any) {
    console.error('[Member Registration] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
