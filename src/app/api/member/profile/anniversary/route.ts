// src/app/api/member/profile/anniversary/route.ts
// Get and update anniversary date (editable)

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

// GET - Get current anniversary date
export async function GET() {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        anniversaryDate: true,
        createdAt: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // If no custom anniversary date, use createdAt as default
    const anniversaryDate = member.anniversaryDate || member.createdAt;

    return NextResponse.json({
      anniversaryDate: anniversaryDate.toISOString(),
      isCustom: !!member.anniversaryDate,
      joinDate: member.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[Anniversary GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anniversary', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Set/update anniversary date
export async function PUT(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { anniversaryDate, useJoinDate } = body;

    // If useJoinDate is true, clear custom anniversary date
    if (useJoinDate) {
      const updatedMember = await prisma.member.update({
        where: { id: memberId },
        data: {
          anniversaryDate: null,
        },
        select: {
          anniversaryDate: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        message: 'Anniversary reset to join date',
        anniversaryDate: updatedMember.createdAt.toISOString(),
        isCustom: false,
        joinDate: updatedMember.createdAt.toISOString(),
      });
    }

    // Validate anniversary date
    if (!anniversaryDate) {
      return NextResponse.json(
        { error: 'Anniversary date is required' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(anniversaryDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Set custom anniversary date
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        anniversaryDate: parsedDate,
      },
      select: {
        anniversaryDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Anniversary date updated successfully',
      anniversaryDate: updatedMember.anniversaryDate!.toISOString(),
      isCustom: true,
      joinDate: updatedMember.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[Anniversary PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update anniversary', details: error.message },
      { status: 500 }
    );
  }
}
