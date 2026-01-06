// src/app/api/merchant/[slug]/rewards/route.ts
// Public API to fetch active rewards for a merchant by slug

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch active rewards for a merchant (public endpoint)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find merchant by slug
    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Fetch active rewards for this merchant
    const rewards = await prisma.reward.findMany({
      where: {
        merchantId: merchant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        pointsCost: true,
        rewardType: true,
        usdcAmount: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { pointsCost: 'asc' }],
    });

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
      },
      rewards,
    });
  } catch (error: any) {
    console.error('[Public Rewards GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards', details: error.message },
      { status: 500 }
    );
  }
}
