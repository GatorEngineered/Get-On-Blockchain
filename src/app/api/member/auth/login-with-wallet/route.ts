// src/app/api/member/auth/login-with-wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * POST /api/member/auth/login-with-wallet
 *
 * Authenticate member using their wallet address
 * If no member exists with this wallet, create one
 *
 * Body:
 * - walletAddress: string (required)
 * - merchantSlug: string (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, merchantSlug } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Find existing member by wallet address
    let member = await prisma.member.findFirst({
      where: { walletAddress: normalizedAddress },
      include: {
        businesses: {
          include: {
            business: true,
          },
        },
      },
    });

    // If no member exists, create one
    if (!member) {
      console.log(
        `[Wallet Login] Creating new member for wallet ${normalizedAddress}`
      );

      member = await prisma.member.create({
        data: {
          walletAddress: normalizedAddress,
          email: `${normalizedAddress.slice(0, 10)}@wallet.temp`, // Temporary email
          firstName: 'Wallet',
          lastName: 'User',
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

      console.log(`[Wallet Login] New member created: ${member.id}`);
    } else {
      console.log(
        `[Wallet Login] Existing member found: ${member.id} (${member.email})`
      );
    }

    // Create a session token for Bearer auth (similar to magic link token)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store the session token in MemberLoginToken table for consistency
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
      walletAddress: member.walletAddress,
      loginAt: new Date().toISOString(),
    });

    cookieStore.set('gob_member_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Log wallet login event
    // Try to find merchant by slug if provided
    let merchantId = member.id; // Default fallback
    if (merchantSlug) {
      const merchant = await prisma.merchant.findUnique({
        where: { slug: merchantSlug },
      });
      if (merchant) {
        merchantId = merchant.id;
      }
    }

    await prisma.event.create({
      data: {
        memberId: member.id,
        merchantId: merchantId,
        type: 'CONNECT_WALLET',
        source: 'wallet-login',
        metadata: {
          walletAddress: normalizedAddress,
          loginMethod: 'wallet',
          merchantSlug: merchantSlug || null,
        },
      },
    });

    console.log(
      `[Wallet Login] Member ${member.id} logged in successfully via wallet`
    );

    return NextResponse.json({
      success: true,
      token: sessionToken,
      member: {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        walletAddress: member.walletAddress,
        tier: member.tier,
      },
    });
  } catch (error: any) {
    console.error('[Wallet Login] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
