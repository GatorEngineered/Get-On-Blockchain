// src/app/api/merchant/rewards/[id]/route.ts
// Individual reward operations: GET, PUT, DELETE

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper to get merchantId from session
async function getMerchantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('gob_merchant_session');

  if (!sessionCookie?.value) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    return session.merchantId || null;
  } catch {
    return null;
  }
}

// GET - Fetch a single reward by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const merchantId = await getMerchantId();

    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reward = await prisma.reward.findFirst({
      where: { id, merchantId },
    });

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    return NextResponse.json({ reward });
  } catch (error: any) {
    console.error('[Reward GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reward', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a reward
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const merchantId = await getMerchantId();

    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify reward belongs to merchant
    const existingReward = await prisma.reward.findFirst({
      where: { id, merchantId },
    });

    if (!existingReward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, pointsCost, rewardType, usdcAmount, isActive, sortOrder } = body;

    // Validate USDC payout has amount
    if (rewardType === 'USDC_PAYOUT' && !usdcAmount) {
      return NextResponse.json(
        { error: 'USDC amount is required for payout rewards' },
        { status: 400 }
      );
    }

    const reward = await prisma.reward.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(pointsCost !== undefined && { pointsCost: parseInt(pointsCost) }),
        ...(rewardType !== undefined && { rewardType }),
        ...(usdcAmount !== undefined && { usdcAmount: usdcAmount ? parseFloat(usdcAmount) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ success: true, reward });
  } catch (error: any) {
    console.error('[Reward PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update reward', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a reward
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const merchantId = await getMerchantId();

    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify reward belongs to merchant
    const existingReward = await prisma.reward.findFirst({
      where: { id, merchantId },
    });

    if (!existingReward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    await prisma.reward.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Reward deleted' });
  } catch (error: any) {
    console.error('[Reward DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete reward', details: error.message },
      { status: 500 }
    );
  }
}
