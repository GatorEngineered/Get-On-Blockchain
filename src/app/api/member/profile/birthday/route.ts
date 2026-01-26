// src/app/api/member/profile/birthday/route.ts
// Set birthday (one-time only, locked after setting)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

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

// GET - Get current birthday info
export async function GET() {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        birthMonth: true,
        birthDay: true,
        birthdayLocked: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      birthday: member.birthMonth && member.birthDay
        ? { month: member.birthMonth, day: member.birthDay }
        : null,
      isLocked: member.birthdayLocked,
    });
  } catch (error: any) {
    console.error('[Birthday GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch birthday', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Set birthday (one-time only)
export async function PUT(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { month, day } = body;

    // Validate input
    if (!month || !day) {
      return NextResponse.json(
        { error: 'Month and day are required' },
        { status: 400 }
      );
    }

    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      );
    }

    if (dayNum < 1 || dayNum > 31) {
      return NextResponse.json(
        { error: 'Day must be between 1 and 31' },
        { status: 400 }
      );
    }

    // Validate day for the given month (basic validation)
    const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (dayNum > daysInMonth[monthNum]) {
      return NextResponse.json(
        { error: `Invalid day for month ${monthNum}` },
        { status: 400 }
      );
    }

    // Check if birthday is already locked
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { birthdayLocked: true },
    });

    if (member?.birthdayLocked) {
      return NextResponse.json(
        { error: 'Birthday has already been set and cannot be changed' },
        { status: 400 }
      );
    }

    // Set birthday and lock it
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        birthMonth: monthNum,
        birthDay: dayNum,
        birthdayLocked: true,
      },
      select: {
        birthMonth: true,
        birthDay: true,
        birthdayLocked: true,
      },
    });

    return NextResponse.json({
      message: 'Birthday set successfully',
      birthday: {
        month: updatedMember.birthMonth,
        day: updatedMember.birthDay,
      },
      isLocked: updatedMember.birthdayLocked,
    });
  } catch (error: any) {
    console.error('[Birthday PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to set birthday', details: error.message },
      { status: 500 }
    );
  }
}
