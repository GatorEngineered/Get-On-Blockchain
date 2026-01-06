// src/app/api/merchant/rewards/route.ts
// CRUD API for merchant rewards catalog

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch all rewards for the logged-in merchant
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const rewards = await prisma.reward.findMany({
      where: { merchantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ rewards });
  } catch (error: any) {
    console.error('[Rewards GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new reward
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, pointsCost, rewardType, usdcAmount, isActive, sortOrder } = body;

    if (!name || pointsCost === undefined) {
      return NextResponse.json(
        { error: 'Name and pointsCost are required' },
        { status: 400 }
      );
    }

    // Validate USDC payout has amount
    if (rewardType === 'USDC_PAYOUT' && !usdcAmount) {
      return NextResponse.json(
        { error: 'USDC amount is required for payout rewards' },
        { status: 400 }
      );
    }

    const reward = await prisma.reward.create({
      data: {
        merchantId,
        name,
        description: description || null,
        pointsCost: parseInt(pointsCost),
        rewardType: rewardType || 'TRADITIONAL',
        usdcAmount: usdcAmount ? parseFloat(usdcAmount) : null,
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, reward });
  } catch (error: any) {
    console.error('[Rewards POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create reward', details: error.message },
      { status: 500 }
    );
  }
}
