// src/app/api/member/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { comparePassword } from '@/app/lib/passwordUtils';

const prisma = new PrismaClient();

/**
 * POST /api/member/auth/login
 *
 * Authenticate member using email and password
 *
 * Body:
 * - email: string (required)
 * - password: string (required)
 * - merchantSlug: string (optional) - for tracking login source
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, merchantSlug } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find member by email
    const member = await prisma.member.findUnique({
      where: { email: normalizedEmail },
      include: {
        businesses: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if member has a password set (use same generic message for security)
    if (!member.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await comparePassword(password, member.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log(
      `[Member Login] Member ${member.id} (${member.email}) logged in successfully`
    );

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

    // Log login event
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
          source: 'member-login',
          metadata: {
            loginMethod: 'email-password',
            merchantSlug: merchantSlug || null,
          },
        },
      });
    }

    console.log(
      `[Member Login] Member ${member.id} session created`
    );

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
        walletAddress: member.walletAddress,
      },
    });
  } catch (error: any) {
    console.error('[Member Login] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
