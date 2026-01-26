// src/app/api/member/profile/anniversary/route.ts
// Get and update relationship/wedding anniversary date (editable)

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

// GET - Get current relationship anniversary date
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
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      anniversaryDate: member.anniversaryDate?.toISOString() || null,
      isSet: !!member.anniversaryDate,
    });
  } catch (error: any) {
    console.error('[Anniversary GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anniversary', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Set/update relationship anniversary date
export async function PUT(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { anniversaryDate } = body;

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

    // Set anniversary date
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        anniversaryDate: parsedDate,
      },
      select: {
        anniversaryDate: true,
      },
    });

    return NextResponse.json({
      message: 'Relationship anniversary date updated successfully',
      anniversaryDate: updatedMember.anniversaryDate!.toISOString(),
      isSet: true,
    });
  } catch (error: any) {
    console.error('[Anniversary PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update anniversary', details: error.message },
      { status: 500 }
    );
  }
}
