// src/app/api/member/password-reset/reset/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  hashPassword,
  validatePasswordStrength,
} from '@/app/lib/passwordUtils';

const prisma = new PrismaClient();

/**
 * POST /api/member/password-reset/reset
 *
 * Reset a member's password using a valid reset token
 *
 * Body:
 * - token: string (required)
 * - password: string (required)
 */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
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

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'This reset token has already been used' },
        { status: 400 }
      );
    }

    // Verify this is a member reset token
    if (resetToken.userType !== 'MEMBER') {
      return NextResponse.json(
        { error: 'Invalid reset token type' },
        { status: 400 }
      );
    }

    // Find the member
    const member = await prisma.member.findUnique({
      where: { email: resetToken.email },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member account not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update member's password
    await prisma.member.update({
      where: { id: member.id },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    console.log(
      `[Password Reset] Password successfully reset for member ${member.id} (${member.email})`
    );

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[Password Reset] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
