// src/app/api/merchant/payout-milestones/route.ts
// CRUD API for multiple payout milestones (Growth/Pro plans)
// Allows configuring different USDC amounts at different point thresholds

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Plan limits for payout milestones
const milestoneLimits: Record<string, number> = {
  STARTER: 0,  // No USDC payouts
  BASIC: 0,    // No USDC payouts
  PREMIUM: 1,  // Single milestone (legacy behavior)
  GROWTH: 3,   // Up to 3 different milestones
  PRO: 6,      // Up to 6 different milestones
};

// Supported stablecoins (future expansion)
const SUPPORTED_STABLECOINS = ['USDC', 'USDT', 'DAI'];

// Supported networks (future expansion)
const SUPPORTED_NETWORKS = ['polygon', 'ethereum', 'base', 'arbitrum', 'solana', 'xrp'];

// GET - Fetch all payout milestones for merchant
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

    // Get merchant with plan info and legacy payout settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        plan: true,
        payoutEnabled: true,
        payoutMilestonePoints: true,
        payoutAmountUSD: true,
        payoutNetwork: true,
      },
    });

    // Get custom payout milestones
    const milestones = await prisma.payoutMilestone.findMany({
      where: { merchantId },
      orderBy: [{ sortOrder: 'asc' }, { pointsRequired: 'asc' }],
    });

    // If no custom milestones exist and merchant has payouts enabled,
    // return the legacy single milestone from merchant settings
    const legacyMilestone = merchant?.payoutEnabled ? [{
      id: 'legacy-milestone',
      name: `$${merchant.payoutAmountUSD} USDC Payout`,
      pointsRequired: merchant.payoutMilestonePoints || 100,
      usdcAmount: merchant.payoutAmountUSD || 5.0,
      stablecoin: 'USDC',
      network: merchant.payoutNetwork || 'polygon',
      isLegacy: true,
    }] : [];

    const activeMilestones = milestones.length > 0 ? milestones : legacyMilestone;

    return NextResponse.json({
      milestones: activeMilestones,
      plan: merchant?.plan,
      limit: milestoneLimits[merchant?.plan || 'STARTER'],
      canAddMore: milestones.length < milestoneLimits[merchant?.plan || 'STARTER'],
      supportedStablecoins: SUPPORTED_STABLECOINS,
      supportedNetworks: SUPPORTED_NETWORKS,
      payoutEnabled: merchant?.payoutEnabled,
    });
  } catch (error: any) {
    console.error('[PayoutMilestones GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout milestones', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new payout milestone
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

    // Check plan restrictions
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { plan: true, payoutEnabled: true, payoutWalletAddress: true },
    });

    // Check if payouts are enabled
    if (!merchant?.payoutEnabled || !merchant?.payoutWalletAddress) {
      return NextResponse.json(
        { error: 'Please configure your payout wallet first' },
        { status: 400 }
      );
    }

    const limit = milestoneLimits[merchant?.plan || 'STARTER'];

    // Starter and Basic plans cannot have payout milestones
    if (limit === 0) {
      return NextResponse.json(
        {
          error: 'USDC payouts require Premium plan or higher',
          planRestricted: true,
        },
        { status: 403 }
      );
    }

    const currentCount = await prisma.payoutMilestone.count({
      where: { merchantId },
    });

    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: `Your ${merchant?.plan} plan is limited to ${limit} payout milestone${limit > 1 ? 's' : ''}. Upgrade to Growth or Pro to add more.`,
          planRestricted: true,
          limit,
          current: currentCount,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, pointsRequired, usdcAmount, stablecoin, network, sortOrder } = body;

    if (!name || pointsRequired === undefined || usdcAmount === undefined) {
      return NextResponse.json(
        { error: 'Name, pointsRequired, and usdcAmount are required' },
        { status: 400 }
      );
    }

    // Validate stablecoin (currently only USDC is active)
    const coin = stablecoin?.toUpperCase() || 'USDC';
    if (!SUPPORTED_STABLECOINS.includes(coin)) {
      return NextResponse.json(
        { error: `Unsupported stablecoin. Supported: ${SUPPORTED_STABLECOINS.join(', ')}` },
        { status: 400 }
      );
    }

    // Currently only USDC on Polygon is fully supported
    if (coin !== 'USDC') {
      return NextResponse.json(
        { error: 'Currently only USDC is supported. More stablecoins coming soon.' },
        { status: 400 }
      );
    }

    // Validate network (currently only Polygon is active)
    const net = network?.toLowerCase() || 'polygon';
    if (!SUPPORTED_NETWORKS.includes(net)) {
      return NextResponse.json(
        { error: `Unsupported network. Supported: ${SUPPORTED_NETWORKS.join(', ')}` },
        { status: 400 }
      );
    }

    // Currently only Polygon is fully supported
    if (net !== 'polygon') {
      return NextResponse.json(
        { error: 'Currently only Polygon network is supported. More networks coming soon.' },
        { status: 400 }
      );
    }

    const milestone = await prisma.payoutMilestone.create({
      data: {
        merchantId,
        name,
        pointsRequired: parseInt(pointsRequired),
        usdcAmount: parseFloat(usdcAmount),
        stablecoin: coin,
        network: net,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error: any) {
    console.error('[PayoutMilestones POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create payout milestone', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update payout milestone
export async function PUT(req: NextRequest) {
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
    const { id, name, pointsRequired, usdcAmount, stablecoin, network, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.payoutMilestone.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Payout milestone not found' }, { status: 404 });
    }

    const milestone = await prisma.payoutMilestone.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(pointsRequired !== undefined && { pointsRequired: parseInt(pointsRequired) }),
        ...(usdcAmount !== undefined && { usdcAmount: parseFloat(usdcAmount) }),
        ...(stablecoin && { stablecoin: stablecoin.toUpperCase() }),
        ...(network && { network: network.toLowerCase() }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error: any) {
    console.error('[PayoutMilestones PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update payout milestone', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove payout milestone
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.payoutMilestone.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Payout milestone not found' }, { status: 404 });
    }

    await prisma.payoutMilestone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PayoutMilestones DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payout milestone', details: error.message },
      { status: 500 }
    );
  }
}
