// src/app/api/merchant/tier-configs/route.ts
// CRUD API for custom member tier configurations (Growth/Pro plans)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Plan limits for tiers
// - STARTER: 3 tiers (Rookie, Soldier, General)
// - BASIC: 4 tiers (Rookie, Soldier, Captain, General)
// - PREMIUM: 6 tiers (Rookie, Soldier, Sergeant, Captain, Major, General)
// - GROWTH/PRO: Custom tiers allowed
const tierLimits: Record<string, number> = {
  STARTER: 3,  // Rookie, Soldier, General only
  BASIC: 4,    // Rookie, Soldier, Captain, General
  PREMIUM: 6,  // Rookie, Soldier, Sergeant, Captain, Major, General
  GROWTH: 10,  // Custom tiers allowed
  PRO: 15,     // Extended custom tiers
};

// GET - Fetch all tier configs for merchant
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

    // Get merchant with plan info
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        plan: true,
        vipThreshold: true,
        superThreshold: true,
      },
    });

    // Get custom tier configs
    const customTiers = await prisma.memberTierConfig.findMany({
      where: { merchantId },
      orderBy: [{ sortOrder: 'asc' }, { threshold: 'asc' }],
    });

    // Get default tiers based on plan
    // STARTER: 3 tiers, BASIC: 4 tiers, PREMIUM+: 6 tiers
    const plan = merchant?.plan || 'STARTER';
    const vipThreshold = merchant?.vipThreshold || 100;
    const superThreshold = merchant?.superThreshold || 200;

    // Calculate intermediate thresholds based on plan
    const getDefaultTiersForPlan = () => {
      const baseTiers = [
        {
          id: 'default-base',
          name: 'BASE',
          displayName: 'Rookie Member',
          description: 'Joined',
          threshold: 0,
          sortOrder: 0,
          isDefault: true,
        },
        {
          id: 'default-vip',
          name: 'VIP',
          displayName: 'Soldier Member',
          description: `Trusted • Unlocked at ${vipThreshold} points`,
          threshold: vipThreshold,
          sortOrder: 1,
          isDefault: true,
        },
      ];

      // For BASIC (4 tiers): add Captain between Soldier and General
      if (plan === 'BASIC') {
        const captainThreshold = Math.round(vipThreshold + (superThreshold - vipThreshold) * 0.5);
        return [
          ...baseTiers,
          {
            id: 'default-captain',
            name: 'CAPTAIN',
            displayName: 'Captain Member',
            description: `Dedicated • Unlocked at ${captainThreshold} points`,
            threshold: captainThreshold,
            sortOrder: 2,
            isDefault: true,
          },
          {
            id: 'default-super',
            name: 'SUPER',
            displayName: 'General Member',
            description: `Honor • Unlocked at ${superThreshold} points`,
            threshold: superThreshold,
            sortOrder: 3,
            isDefault: true,
          },
        ];
      }

      // For PREMIUM+ (6 tiers): add Sergeant, Captain, Major between Soldier and General
      if (['PREMIUM', 'GROWTH', 'PRO'].includes(plan)) {
        const range = superThreshold - vipThreshold;
        const sergeantThreshold = Math.round(vipThreshold + range * 0.25);
        const captainThreshold = Math.round(vipThreshold + range * 0.5);
        const majorThreshold = Math.round(vipThreshold + range * 0.75);
        return [
          ...baseTiers,
          {
            id: 'default-sergeant',
            name: 'SERGEANT',
            displayName: 'Sergeant Member',
            description: `Proven • Unlocked at ${sergeantThreshold} points`,
            threshold: sergeantThreshold,
            sortOrder: 2,
            isDefault: true,
          },
          {
            id: 'default-captain',
            name: 'CAPTAIN',
            displayName: 'Captain Member',
            description: `Dedicated • Unlocked at ${captainThreshold} points`,
            threshold: captainThreshold,
            sortOrder: 3,
            isDefault: true,
          },
          {
            id: 'default-major',
            name: 'MAJOR',
            displayName: 'Major Member',
            description: `Leader • Unlocked at ${majorThreshold} points`,
            threshold: majorThreshold,
            sortOrder: 4,
            isDefault: true,
          },
          {
            id: 'default-super',
            name: 'SUPER',
            displayName: 'General Member',
            description: `Honor • Unlocked at ${superThreshold} points`,
            threshold: superThreshold,
            sortOrder: 5,
            isDefault: true,
          },
        ];
      }

      // Default: STARTER (3 tiers)
      return [
        ...baseTiers,
        {
          id: 'default-super',
          name: 'SUPER',
          displayName: 'General Member',
          description: `Honor • Unlocked at ${superThreshold} points`,
          threshold: superThreshold,
          sortOrder: 2,
          isDefault: true,
        },
      ];
    };

    const defaultTiers = getDefaultTiersForPlan();

    // Return custom tiers if they exist, otherwise default tiers
    const tiers = customTiers.length > 0 ? customTiers : defaultTiers;

    return NextResponse.json({
      tiers,
      plan: merchant?.plan,
      limit: tierLimits[merchant?.plan || 'STARTER'],
      canAddMore: customTiers.length < tierLimits[merchant?.plan || 'STARTER'],
    });
  } catch (error: any) {
    console.error('[TierConfigs GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier configs', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new tier config
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

    const limit = tierLimits[merchant?.plan || 'STARTER'];
    const currentCount = await prisma.memberTierConfig.count({
      where: { merchantId },
    });

    // For Starter/Basic/Premium, only allow if they have less than 3 custom tiers
    // This is to allow them to customize the default 3 but not add more
    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: `Your ${merchant?.plan} plan is limited to ${limit} tier${limit > 1 ? 's' : ''}. Upgrade to Growth or Pro to add more.`,
          planRestricted: true,
          limit,
          current: currentCount,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, displayName, description, threshold, sortOrder } = body;

    if (!name || !displayName || threshold === undefined) {
      return NextResponse.json(
        { error: 'Name, displayName, and threshold are required' },
        { status: 400 }
      );
    }

    const tierConfig = await prisma.memberTierConfig.create({
      data: {
        merchantId,
        name: name.toUpperCase(),
        displayName,
        description: description || null,
        threshold: parseInt(threshold),
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, tierConfig });
  } catch (error: any) {
    console.error('[TierConfigs POST] Error:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A tier with this name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create tier config', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update tier config
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
    const { id, name, displayName, description, threshold, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tier config ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.memberTierConfig.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tier config not found' }, { status: 404 });
    }

    const tierConfig = await prisma.memberTierConfig.update({
      where: { id },
      data: {
        ...(name && { name: name.toUpperCase() }),
        ...(displayName && { displayName }),
        ...(description !== undefined && { description }),
        ...(threshold !== undefined && { threshold: parseInt(threshold) }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, tierConfig });
  } catch (error: any) {
    console.error('[TierConfigs PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update tier config', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove tier config
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
      return NextResponse.json({ error: 'Tier config ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.memberTierConfig.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tier config not found' }, { status: 404 });
    }

    await prisma.memberTierConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[TierConfigs DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tier config', details: error.message },
      { status: 500 }
    );
  }
}
