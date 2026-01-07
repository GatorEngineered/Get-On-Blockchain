// src/app/api/member/profile/route.ts
// Get and update member profile

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';

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

// GET - Fetch member profile
export async function GET(req: NextRequest) {
  try {
    const memberId = await getMemberFromToken(req);
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error: any) {
    console.error('[Member Profile GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update member profile
export async function PUT(req: NextRequest) {
  try {
    const memberId = await getMemberFromToken(req);
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, phone } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        firstName,
        lastName,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error: any) {
    console.error('[Member Profile PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
}
