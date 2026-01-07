// src/app/api/member/change-password/route.ts
// Change member password

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getMemberFromToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { memberId: string };
    return decoded.memberId;
  } catch {
    return null;
  }
}

// POST - Change password
export async function POST(req: NextRequest) {
  try {
    const memberId = await getMemberFromToken(req);
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Get member with password hash
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Verify current password
    if (!member.passwordHash) {
      return NextResponse.json(
        { error: 'No password set. Please use password reset.' },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, member.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.member.update({
      where: { id: memberId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('[Member Change Password] Error:', error);
    return NextResponse.json(
      { error: 'Failed to change password', details: error.message },
      { status: 500 }
    );
  }
}
