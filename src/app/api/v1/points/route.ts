// src/app/api/v1/points/route.ts
// External Points API (PREMIUM+)
// Award or deduct points via API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateApiKey, hasPermission, logApiUsage, checkRateLimit } from '@/app/lib/api-keys';
import { hasExternalApiAccess } from '@/app/lib/plan-limits';

/**
 * POST /api/v1/points
 * Award or deduct points for a member
 *
 * Headers:
 *   Authorization: Bearer gob_live_xxx
 *
 * Body: {
 *   email: string;             // Customer email
 *   points: number;            // Positive to award, negative to deduct
 *   reason?: string;           // Description of why points changed
 *   source?: string;           // "api", "webhook", "custom"
 *   idempotency_key?: string;  // Prevent duplicate processing
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let apiKeyId: string | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const apiKeyValue = authHeader.substring(7);
    const keyData = await validateApiKey(apiKeyValue);

    if (!keyData) {
      return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    apiKeyId = keyData.apiKey.id;

    if (!hasExternalApiAccess(keyData.merchant.plan)) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API access requires Premium plan or higher' },
        { status: 403 }
      );
    }

    if (!hasPermission(keyData.apiKey.permissions, 'write:points')) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API key does not have write:points permission' },
        { status: 403 }
      );
    }

    const rateLimit = await checkRateLimit(apiKeyId, keyData.apiKey.rateLimit);
    if (!rateLimit.allowed) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 429, Date.now() - startTime);
      return NextResponse.json({
        error: 'Rate limit exceeded',
        retry_after: rateLimit.resetAt.toISOString()
      }, { status: 429 });
    }

    const body = await req.json();
    const { email, points, reason, source = 'api', idempotency_key } = body;

    if (!email) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    if (typeof points !== 'number' || points === 0) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'points must be a non-zero number' }, { status: 400 });
    }

    const merchantId = keyData.merchant.id;

    // Check idempotency by looking for existing transaction with same reason pattern
    if (idempotency_key) {
      const idempotencyReason = `API idempotency: ${idempotency_key}`;
      const existing = await prisma.rewardTransaction.findFirst({
        where: {
          reason: { contains: idempotencyReason },
          merchantMember: { merchantId }
        }
      });
      if (existing) {
        await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 200, Date.now() - startTime);
        return NextResponse.json({
          success: true,
          message: 'Points already processed (duplicate)',
          duplicate: true,
          transaction_id: existing.id,
          points: existing.amount
        });
      }
    }

    // Find member
    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!member) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 404, Date.now() - startTime);
      return NextResponse.json({
        error: 'Member not found',
        hint: 'Use POST /api/v1/members to create a member first, or use POST /api/v1/orders which auto-creates members'
      }, { status: 404 });
    }

    // Find merchant membership
    const merchantMember = await prisma.merchantMember.findFirst({
      where: { merchantId, memberId: member.id }
    });

    if (!merchantMember) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 404, Date.now() - startTime);
      return NextResponse.json({
        error: 'Member is not enrolled with this merchant',
        hint: 'Member exists but has not joined your loyalty program'
      }, { status: 404 });
    }

    // Check for sufficient points if deducting
    if (points < 0 && merchantMember.points + points < 0) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 400, Date.now() - startTime);
      return NextResponse.json({
        error: 'Insufficient points',
        current_points: merchantMember.points,
        requested_deduction: Math.abs(points)
      }, { status: 400 });
    }

    // Update points
    const updated = await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: { points: { increment: points } }
    });

    // Create transaction record if business exists
    let transaction: { id: string; amount: number } | null = null;
    const businesses = keyData.merchant.businesses;

    if (businesses && businesses.length > 0) {
      const baseReason = reason || (points > 0 ? 'Points awarded via API' : 'Points deducted via API');
      const fullReason = idempotency_key
        ? `${baseReason} | API idempotency: ${idempotency_key}`
        : baseReason;

      transaction = await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          businessId: businesses[0].id,
          memberId: member.id,
          type: points > 0 ? 'EARN' : 'REDEEM',
          amount: Math.abs(points),
          reason: fullReason,
          status: 'SUCCESS',
        },
        select: { id: true, amount: true }
      });
    }

    await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      transaction_id: transaction?.id || null,
      member_id: member.id,
      points_changed: points,
      new_balance: updated.points,
      message: points > 0
        ? `Awarded ${points} points`
        : `Deducted ${Math.abs(points)} points`
    });

  } catch (error: any) {
    console.error('[Points API] Error:', error);
    if (apiKeyId) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'POST', 500, Date.now() - startTime);
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/v1/points
 * Get points balance for a member
 *
 * Query params:
 *   email: string (required)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let apiKeyId: string | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const apiKeyValue = authHeader.substring(7);
    const keyData = await validateApiKey(apiKeyValue);

    if (!keyData) {
      return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    apiKeyId = keyData.apiKey.id;

    if (!hasPermission(keyData.apiKey.permissions, 'read:points')) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'GET', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API key does not have read:points permission' },
        { status: 403 }
      );
    }

    const rateLimit = await checkRateLimit(apiKeyId, keyData.apiKey.rateLimit);
    if (!rateLimit.allowed) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'GET', 429, Date.now() - startTime);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'GET', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'email query parameter is required' }, { status: 400 });
    }

    const merchantId = keyData.merchant.id;

    // Find member and their merchant membership
    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        merchantMembers: {
          where: { merchantId },
          select: {
            points: true,
            tier: true,
            createdAt: true,
          }
        }
      }
    });

    if (!member) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'GET', 404, Date.now() - startTime);
      return NextResponse.json({
        found: false,
        email: email.toLowerCase(),
        message: 'Member not found'
      });
    }

    const membership = member.merchantMembers[0];

    if (!membership) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'GET', 200, Date.now() - startTime);
      return NextResponse.json({
        found: true,
        enrolled: false,
        email: member.email,
        member_id: member.id,
        message: 'Member exists but not enrolled with this merchant'
      });
    }

    await logApiUsage(apiKeyId, '/api/v1/points', 'GET', 200, Date.now() - startTime);

    return NextResponse.json({
      found: true,
      enrolled: true,
      email: member.email,
      member_id: member.id,
      points: membership.points,
      tier: membership.tier,
      member_since: membership.createdAt
    });

  } catch (error: any) {
    console.error('[Points API] Error:', error);
    if (apiKeyId) {
      await logApiUsage(apiKeyId, '/api/v1/points', 'GET', 500, Date.now() - startTime);
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
