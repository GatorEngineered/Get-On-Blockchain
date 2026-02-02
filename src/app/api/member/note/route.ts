// src/app/api/member/note/route.ts
// Get and update member's note for a specific merchant

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

/**
 * GET /api/member/note
 * If merchantId query param provided: Get member's note for a specific merchant
 * If no merchantId: Get list of all merchants the member belongs to with their notes
 */
export async function GET(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');

    // If specific merchantId provided, return just that note
    if (merchantId) {
      const merchantMember = await prisma.merchantMember.findUnique({
        where: {
          merchantId_memberId: {
            merchantId,
            memberId,
          },
        },
        select: {
          memberNote: true,
        },
      });

      if (!merchantMember) {
        return NextResponse.json(
          { error: 'Member not found for this merchant' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        memberNote: merchantMember.memberNote || '',
      });
    }

    // Otherwise, return all merchants with notes
    const merchantMembers = await prisma.merchantMember.findMany({
      where: { memberId },
      include: {
        merchant: {
          include: {
            businesses: {
              take: 1,
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const merchants = merchantMembers.map((mm) => ({
      merchantId: mm.merchantId,
      businessName: mm.merchant.businesses[0]?.name || mm.merchant.name || 'Unknown Business',
      note: mm.memberNote,
    }));

    return NextResponse.json({
      merchants,
    });
  } catch (error: any) {
    console.error('[Member Note GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/member/note
 * Update member's note for a specific merchant
 *
 * Body: { merchantId: string, note: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const memberId = await getMemberIdFromSession();
    if (!memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { merchantId, note } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Validate note length (max 300 characters)
    if (note && note.length > 300) {
      return NextResponse.json(
        { error: 'Note cannot exceed 300 characters' },
        { status: 400 }
      );
    }

    // Verify the member is part of this merchant's program
    const existingMembership = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId,
        },
      },
    });

    if (!existingMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this loyalty program' },
        { status: 404 }
      );
    }

    // Update the member's note
    const updated = await prisma.merchantMember.update({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId,
        },
      },
      data: {
        memberNote: note || null,
      },
      select: {
        memberNote: true,
      },
    });

    return NextResponse.json({
      success: true,
      memberNote: updated.memberNote || '',
    });
  } catch (error: any) {
    console.error('[Member Note PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update note', details: error.message },
      { status: 500 }
    );
  }
}
