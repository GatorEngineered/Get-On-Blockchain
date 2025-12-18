// src/app/api/member/auth/send-magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/resend';
import { generateMagicLinkEmail } from '@/lib/email/templates/magic-link';

const prisma = new PrismaClient();

/**
 * POST /api/member/auth/send-magic-link
 *
 * Send a magic link to member's email for passwordless login
 *
 * Body:
 * - email: string
 * - returnTo?: string (optional redirect URL after login)
 * - merchantSlug?: string (optional merchant context)
 */
export async function POST(req: NextRequest) {
  try {
    const { email, returnTo, merchantSlug } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Find or create member by email
    let member = await prisma.member.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!member) {
      // Create new member if doesn't exist
      member = await prisma.member.create({
        data: {
          email: email.toLowerCase(),
          tier: 'STARTER',
        },
      });

      console.log('[Auth] Created new member:', member.id, member.email);
    }

    // Generate magic link token (random 32-byte hex string)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token in database
    await prisma.memberLoginToken.create({
      data: {
        token,
        memberId: member.id,
        expiresAt,
        returnTo: returnTo || '/member/dashboard',
      },
    });

    // Build magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/api/member/auth/verify?token=${token}`;

 console.log('[Auth] Magic link generated for:', member.email);

    console.log('[Auth] Magic link URL:', magicLinkUrl);

    console.log('[Auth] Expires at:', expiresAt.toISOString());

 

    // Send email with magic link

    try {

      const emailHtml = generateMagicLinkEmail({

        firstName: member.firstName || 'Member',

        lastName: member.lastName || '',

        magicLink: magicLinkUrl,

        expiresInMinutes: 15,

      });

 

      await sendEmail({

        to: member.email,

        subject: '🔐 Your Login Link for Get On Blockchain',

        html: emailHtml,

      });

 

      console.log('[Auth] Magic link email sent successfully to:', member.email);

    } catch (emailError: any) {

      console.error('[Auth] Failed to send email:', emailError);

      // Don't fail the request if email fails - still return success

      // This allows fallback to dev mode link display

    }

    // For development: Return the magic link in response
    // IMPORTANT: Remove this in production!
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
      ...(isDevelopment && {
        dev_magic_link: magicLinkUrl,
        dev_warning: 'Magic link exposed for development only - remove in production',
      }),
    });

  } catch (error: any) {
    console.error('[Auth] Error sending magic link:', error);
    return NextResponse.json(
      {
        error: 'Failed to send magic link',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      },
      { status: 500 }
    );
  }
}