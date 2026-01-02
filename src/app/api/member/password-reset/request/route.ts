// src/app/api/member/password-reset/request/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/app/lib/email/resend';

const prisma = new PrismaClient();

/**
 * POST /api/member/password-reset/request
 *
 * Request a password reset email for a member account
 *
 * Body:
 * - email: string (required)
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find member by email
    const member = await prisma.member.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration attacks
    // Don't reveal whether the email exists or not
    if (!member) {
      console.log(
        `[Password Reset Request] No member found for email: ${normalizedEmail}`
      );
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate a unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        email: normalizedEmail,
        userType: 'MEMBER', // Note: You may need to add MEMBER to the UserType enum
        expiresAt,
      },
    });

    // Create reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/member/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendEmail({
      to: normalizedEmail,
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.875rem; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello ${member.firstName},</p>

                <p>We received a request to reset your password for your Get On Blockchain Rewards account.</p>

                <p>Click the button below to reset your password:</p>

                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>

                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>

                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
                </div>

                <p>If you have any questions, please contact our support team.</p>

                <p>Best regards,<br>Get On Blockchain Team</p>
              </div>
              <div class="footer">
                <p>Get On Blockchain Rewards Program</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(
      `[Password Reset Request] Reset email sent to ${normalizedEmail}`
    );

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error: any) {
    console.error('[Password Reset Request] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
