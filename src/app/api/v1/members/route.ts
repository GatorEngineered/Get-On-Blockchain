// src/app/api/v1/members/route.ts
// External Members API (PREMIUM+)
// Create and lookup members via API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateApiKey, hasPermission, logApiUsage, checkRateLimit } from '@/app/lib/api-keys';
import { hasExternalApiAccess } from '@/app/lib/plan-limits';

/**
 * POST /api/v1/members
 * Create or lookup a member and enroll with merchant
 *
 * Headers:
 *   Authorization: Bearer gob_live_xxx
 *
 * Body: {
 *   email: string;             // Customer email (required)
 *   first_name?: string;
 *   last_name?: string;
 *   phone?: string;
 *   enroll?: boolean;          // Auto-enroll with merchant (default: true)
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
      await logApiUsage(apiKeyId, '/api/v1/members', 'POST', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API access requires Premium plan or higher' },
        { status: 403 }
      );
    }

    if (!hasPermission(keyData.apiKey.permissions, 'write:members')) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'POST', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API key does not have write:members permission' },
        { status: 403 }
      );
    }

    const rateLimit = await checkRateLimit(apiKeyId, keyData.apiKey.rateLimit);
    if (!rateLimit.allowed) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'POST', 429, Date.now() - startTime);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { email, first_name, last_name, phone, enroll = true } = body;

    if (!email) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'POST', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const merchantId = keyData.merchant.id;

    // Get merchant settings
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        name: true,
        welcomePoints: true,
        businesses: { select: { id: true }, take: 1 }
      }
    });

    // Find or create member
    let member = await prisma.member.findUnique({
      where: { email: email.toLowerCase() }
    });

    let isNewMember = false;
    if (!member) {
      member = await prisma.member.create({
        data: {
          email: email.toLowerCase(),
          firstName: first_name || '',
          lastName: last_name || '',
          phone: phone || null,
        }
      });
      isNewMember = true;
    } else if (first_name || last_name || phone) {
      // Update existing member if new info provided
      member = await prisma.member.update({
        where: { id: member.id },
        data: {
          ...(first_name && !member.firstName ? { firstName: first_name } : {}),
          ...(last_name && !member.lastName ? { lastName: last_name } : {}),
          ...(phone && !member.phone ? { phone } : {}),
        }
      });
    }

    // Check enrollment
    let merchantMember = await prisma.merchantMember.findFirst({
      where: { merchantId, memberId: member.id }
    });

    let isNewEnrollment = false;
    if (!merchantMember && enroll) {
      merchantMember = await prisma.merchantMember.create({
        data: {
          merchantId,
          memberId: member.id,
          points: merchant?.welcomePoints || 0,
        }
      });
      isNewEnrollment = true;

      // Create welcome transaction if points awarded and business exists
      if (merchant?.welcomePoints && merchant.welcomePoints > 0 && merchant.businesses.length > 0) {
        await prisma.rewardTransaction.create({
          data: {
            merchantMemberId: merchantMember.id,
            businessId: merchant.businesses[0].id,
            memberId: member.id,
            type: 'EARN',
            amount: merchant.welcomePoints,
            reason: `Welcome bonus from ${merchant.name}`,
            status: 'SUCCESS',
          }
        });
      }
    }

    await logApiUsage(apiKeyId, '/api/v1/members', 'POST', 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      member_id: member.id,
      email: member.email,
      first_name: member.firstName || null,
      last_name: member.lastName || null,
      is_new_member: isNewMember,
      enrolled: !!merchantMember,
      is_new_enrollment: isNewEnrollment,
      points: merchantMember?.points ?? null,
      tier: merchantMember?.tier ?? null
    });

  } catch (error: any) {
    console.error('[Members API] Error:', error);
    if (apiKeyId) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'POST', 500, Date.now() - startTime);
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/v1/members
 * Get member information
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

    if (!hasPermission(keyData.apiKey.permissions, 'read:members')) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'GET', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API key does not have read:members permission' },
        { status: 403 }
      );
    }

    const rateLimit = await checkRateLimit(apiKeyId, keyData.apiKey.rateLimit);
    if (!rateLimit.allowed) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'GET', 429, Date.now() - startTime);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'GET', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'email query parameter is required' }, { status: 400 });
    }

    const merchantId = keyData.merchant.id;

    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        merchantMembers: {
          where: { merchantId },
          select: {
            points: true,
            tier: true,
            createdAt: true,
            referralCode: true,
          }
        }
      }
    });

    if (!member) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'GET', 404, Date.now() - startTime);
      return NextResponse.json({
        found: false,
        email: email.toLowerCase()
      });
    }

    const membership = member.merchantMembers[0];

    await logApiUsage(apiKeyId, '/api/v1/members', 'GET', 200, Date.now() - startTime);

    return NextResponse.json({
      found: true,
      member_id: member.id,
      email: member.email,
      first_name: member.firstName || null,
      last_name: member.lastName || null,
      phone: member.phone || null,
      member_created_at: member.createdAt,
      enrolled: !!membership,
      points: membership?.points ?? null,
      tier: membership?.tier ?? null,
      enrollment_date: membership?.createdAt ?? null,
      referral_code: membership?.referralCode ?? null
    });

  } catch (error: any) {
    console.error('[Members API] Error:', error);
    if (apiKeyId) {
      await logApiUsage(apiKeyId, '/api/v1/members', 'GET', 500, Date.now() - startTime);
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
