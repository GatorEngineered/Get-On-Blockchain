// src/app/api/merchant/points-rules/route.ts
// Product-specific and custom points rules management (PREMIUM+)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { hasProductPointsRules } from '@/app/lib/plan-limits';

/**
 * GET /api/merchant/points-rules
 * List all points rules for the merchant
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = sessionCookie.value;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { plan: true }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!hasProductPointsRules(merchant.plan)) {
      return NextResponse.json({
        error: 'Points rules require Premium plan or higher',
        requiredPlan: 'PREMIUM'
      }, { status: 403 });
    }

    const rules = await prisma.pointsRule.findMany({
      where: { merchantId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error('[Points Rules] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/merchant/points-rules
 * Create a new points rule
 *
 * Body: {
 *   name: string;
 *   description?: string;
 *   ruleType: 'product' | 'category' | 'action' | 'time';
 *   targetConfig: object;  // Depends on ruleType
 *   pointsType: 'multiplier' | 'bonus' | 'fixed';
 *   pointsValue: number;
 *   startDate?: string;
 *   endDate?: string;
 *   maxUsesTotal?: number;
 *   maxUsesPerMember?: number;
 *   priority?: number;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = sessionCookie.value;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { plan: true }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!hasProductPointsRules(merchant.plan)) {
      return NextResponse.json({
        error: 'Points rules require Premium plan or higher',
        requiredPlan: 'PREMIUM'
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      ruleType,
      targetConfig,
      pointsType = 'multiplier',
      pointsValue,
      startDate,
      endDate,
      maxUsesTotal,
      maxUsesPerMember,
      priority = 0
    } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const validRuleTypes = ['product', 'category', 'action', 'time'];
    if (!ruleType || !validRuleTypes.includes(ruleType)) {
      return NextResponse.json({
        error: `ruleType must be one of: ${validRuleTypes.join(', ')}`
      }, { status: 400 });
    }

    if (!targetConfig || typeof targetConfig !== 'object') {
      return NextResponse.json({ error: 'targetConfig is required' }, { status: 400 });
    }

    const validPointsTypes = ['multiplier', 'bonus', 'fixed'];
    if (!validPointsTypes.includes(pointsType)) {
      return NextResponse.json({
        error: `pointsType must be one of: ${validPointsTypes.join(', ')}`
      }, { status: 400 });
    }

    if (typeof pointsValue !== 'number' || pointsValue <= 0) {
      return NextResponse.json({
        error: 'pointsValue must be a positive number'
      }, { status: 400 });
    }

    // Limit rules per merchant
    const existingCount = await prisma.pointsRule.count({
      where: { merchantId }
    });

    if (existingCount >= 50) {
      return NextResponse.json({
        error: 'Maximum 50 points rules per merchant'
      }, { status: 400 });
    }

    const rule = await prisma.pointsRule.create({
      data: {
        merchantId,
        name,
        description,
        ruleType,
        targetConfig,
        pointsType,
        pointsValue,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxUsesTotal,
        maxUsesPerMember,
        priority,
      }
    });

    return NextResponse.json({ rule });
  } catch (error: any) {
    console.error('[Points Rules] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/merchant/points-rules
 * Delete a points rule
 *
 * Body: { ruleId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = sessionCookie.value;
    const body = await req.json();
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'ruleId is required' }, { status: 400 });
    }

    const rule = await prisma.pointsRule.findFirst({
      where: { id: ruleId, merchantId }
    });

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    await prisma.pointsRule.delete({ where: { id: ruleId } });

    return NextResponse.json({ message: 'Rule deleted successfully' });
  } catch (error: any) {
    console.error('[Points Rules] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/merchant/points-rules
 * Update a points rule
 *
 * Body: { ruleId: string; ...fields to update }
 */
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = sessionCookie.value;
    const body = await req.json();
    const { ruleId, ...updates } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'ruleId is required' }, { status: 400 });
    }

    const rule = await prisma.pointsRule.findFirst({
      where: { id: ruleId, merchantId }
    });

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Build safe update object
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.targetConfig !== undefined) updateData.targetConfig = updates.targetConfig;
    if (updates.pointsType !== undefined) updateData.pointsType = updates.pointsType;
    if (updates.pointsValue !== undefined) updateData.pointsValue = updates.pointsValue;
    if (updates.startDate !== undefined) updateData.startDate = updates.startDate ? new Date(updates.startDate) : null;
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate ? new Date(updates.endDate) : null;
    if (updates.maxUsesTotal !== undefined) updateData.maxUsesTotal = updates.maxUsesTotal;
    if (updates.maxUsesPerMember !== undefined) updateData.maxUsesPerMember = updates.maxUsesPerMember;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const updated = await prisma.pointsRule.update({
      where: { id: ruleId },
      data: updateData
    });

    return NextResponse.json({ rule: updated });
  } catch (error: any) {
    console.error('[Points Rules] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
