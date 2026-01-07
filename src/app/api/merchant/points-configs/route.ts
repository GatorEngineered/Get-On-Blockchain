// src/app/api/merchant/points-configs/route.ts
// CRUD API for custom points configurations (Growth/Pro plans)
// Allows custom earn rules beyond basic visit points

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Plan limits for custom points rules
const pointsConfigLimits: Record<string, number> = {
  STARTER: 1,  // Just basic visit points
  BASIC: 2,    // Visit + one custom rule
  PREMIUM: 3,  // Visit + 2 custom rules
  GROWTH: 5,   // Up to 5 custom rules
  PRO: 10,     // Up to 10 custom rules
};

// Supported trigger types
const TRIGGER_TYPES = [
  'VISIT',      // Points per visit (default)
  'REFERRAL',   // Points for referring a friend
  'SPEND',      // Points based on spend amount
  'BIRTHDAY',   // Birthday bonus points
  'SIGNUP',     // Welcome/signup bonus
  'CHALLENGE',  // Complete a challenge
  'STREAK',     // Visit streak bonus
  'CUSTOM',     // Custom trigger
];

// GET - Fetch all points configs for merchant
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

    // Get merchant with plan info and default points settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        plan: true,
        welcomePoints: true,
        earnPerVisit: true,
      },
    });

    // Get custom points configs
    const configs = await prisma.pointsConfig.findMany({
      where: { merchantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // If no custom configs exist, return the default ones
    const defaultConfigs = [
      {
        id: 'default-welcome',
        name: 'Welcome Bonus',
        triggerType: 'SIGNUP',
        pointsAmount: merchant?.welcomePoints || 10,
        multiplier: 1.0,
        conditions: null,
        isDefault: true,
      },
      {
        id: 'default-visit',
        name: 'Visit Points',
        triggerType: 'VISIT',
        pointsAmount: merchant?.earnPerVisit || 10,
        multiplier: 1.0,
        conditions: null,
        isDefault: true,
      },
    ];

    const activeConfigs = configs.length > 0 ? configs : defaultConfigs;

    return NextResponse.json({
      configs: activeConfigs,
      plan: merchant?.plan,
      limit: pointsConfigLimits[merchant?.plan || 'STARTER'],
      canAddMore: configs.length < pointsConfigLimits[merchant?.plan || 'STARTER'],
      triggerTypes: TRIGGER_TYPES,
    });
  } catch (error: any) {
    console.error('[PointsConfigs GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points configs', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new points config
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
      select: { plan: true },
    });

    const limit = pointsConfigLimits[merchant?.plan || 'STARTER'];
    const currentCount = await prisma.pointsConfig.count({
      where: { merchantId },
    });

    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: `Your ${merchant?.plan} plan is limited to ${limit} points rule${limit > 1 ? 's' : ''}. Upgrade to Growth or Pro to add more.`,
          planRestricted: true,
          limit,
          current: currentCount,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, triggerType, pointsAmount, multiplier, conditions, sortOrder } = body;

    if (!name || !triggerType || pointsAmount === undefined) {
      return NextResponse.json(
        { error: 'Name, triggerType, and pointsAmount are required' },
        { status: 400 }
      );
    }

    // Validate trigger type
    if (!TRIGGER_TYPES.includes(triggerType.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid trigger type. Supported: ${TRIGGER_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const config = await prisma.pointsConfig.create({
      data: {
        merchantId,
        name,
        triggerType: triggerType.toUpperCase(),
        pointsAmount: parseInt(pointsAmount),
        multiplier: multiplier ? parseFloat(multiplier) : 1.0,
        conditions: conditions || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('[PointsConfigs POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create points config', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update points config
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
    const { id, name, triggerType, pointsAmount, multiplier, conditions, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Points config ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.pointsConfig.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Points config not found' }, { status: 404 });
    }

    const config = await prisma.pointsConfig.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(triggerType && { triggerType: triggerType.toUpperCase() }),
        ...(pointsAmount !== undefined && { pointsAmount: parseInt(pointsAmount) }),
        ...(multiplier !== undefined && { multiplier: parseFloat(multiplier) }),
        ...(conditions !== undefined && { conditions }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('[PointsConfigs PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update points config', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove points config
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
      return NextResponse.json({ error: 'Points config ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.pointsConfig.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Points config not found' }, { status: 404 });
    }

    await prisma.pointsConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PointsConfigs DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete points config', details: error.message },
      { status: 500 }
    );
  }
}
