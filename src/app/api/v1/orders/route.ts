// src/app/api/v1/orders/route.ts
// External Order Webhook API (PREMIUM+)
// Receives orders from external systems and awards points

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateApiKey, hasPermission, logApiUsage, checkRateLimit } from '@/app/lib/api-keys';
import { hasExternalApiAccess } from '@/app/lib/plan-limits';

/**
 * POST /api/v1/orders
 * Create an order and award points
 *
 * Headers:
 *   Authorization: Bearer gob_live_xxx
 *
 * Body: {
 *   external_id: string;       // Your order ID
 *   source?: string;           // "shopify", "woocommerce", "custom"
 *   customer_email: string;    // Customer email for matching
 *   order_total: number;       // Total amount (for point calculation)
 *   currency?: string;         // Default: "USD"
 *   order_date?: string;       // ISO date, default: now
 *   line_items?: Array<{       // Optional: for product-specific points
 *     sku: string;
 *     name: string;
 *     quantity: number;
 *     price: number;
 *     category?: string;
 *   }>;
 *   idempotency_key?: string;  // Prevent duplicate processing
 * }
 *
 * Response: {
 *   success: boolean;
 *   order_id: string;
 *   member_id?: string;
 *   points_awarded: number;
 *   message: string;
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let apiKeyId: string | null = null;

  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Bearer gob_live_xxx' },
        { status: 401 }
      );
    }

    const apiKeyValue = authHeader.substring(7); // Remove "Bearer "

    // Validate the API key
    const keyData = await validateApiKey(apiKeyValue);
    if (!keyData) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    apiKeyId = keyData.apiKey.id;

    // Check plan access
    if (!hasExternalApiAccess(keyData.merchant.plan)) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API access requires Premium plan or higher' },
        { status: 403 }
      );
    }

    // Check permission
    if (!hasPermission(keyData.apiKey.permissions, 'write:orders')) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API key does not have write:orders permission' },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(apiKeyId, keyData.apiKey.rateLimit);
    if (!rateLimit.allowed) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 429, Date.now() - startTime);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retry_after: rateLimit.resetAt.toISOString(),
          limit: keyData.apiKey.rateLimit,
          remaining: rateLimit.remaining
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(keyData.apiKey.rateLimit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
          }
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      external_id,
      source = 'api',
      customer_email,
      order_total,
      currency = 'USD',
      order_date,
      line_items,
      idempotency_key
    } = body;

    // Validate required fields
    if (!external_id) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'external_id is required' }, { status: 400 });
    }
    if (!customer_email) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'customer_email is required' }, { status: 400 });
    }
    if (typeof order_total !== 'number' || order_total < 0) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 400, Date.now() - startTime);
      return NextResponse.json({ error: 'order_total must be a positive number' }, { status: 400 });
    }

    const merchantId = keyData.merchant.id;

    // Check for duplicate order (by idempotency_key or external_id+source)
    const existingOrder = await prisma.externalOrder.findFirst({
      where: {
        OR: [
          idempotency_key ? { idempotencyKey: idempotency_key } : {},
          { merchantId, externalId: external_id, externalSource: source }
        ].filter(c => Object.keys(c).length > 0)
      }
    });

    if (existingOrder) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 200, Date.now() - startTime);
      // Return success but indicate it was a duplicate
      return NextResponse.json({
        success: true,
        order_id: existingOrder.id,
        member_id: existingOrder.memberId,
        points_awarded: existingOrder.pointsAwarded || 0,
        message: 'Order already processed (duplicate)',
        duplicate: true
      });
    }

    // Get merchant settings for points calculation
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        name: true,
        posPointsPerDollar: true,
        welcomePoints: true,
        businesses: { select: { id: true }, take: 1 }
      }
    });

    if (!merchant) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 404, Date.now() - startTime);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Find or create member
    let member = await prisma.member.findUnique({
      where: { email: customer_email.toLowerCase() }
    });

    let isNewMember = false;
    if (!member) {
      // Create new member
      member = await prisma.member.create({
        data: {
          email: customer_email.toLowerCase(),
          firstName: '',
          lastName: '',
        }
      });
      isNewMember = true;
    }

    // Find or create merchant membership
    let merchantMember = await prisma.merchantMember.findFirst({
      where: { merchantId, memberId: member.id }
    });

    if (!merchantMember) {
      merchantMember = await prisma.merchantMember.create({
        data: {
          merchantId,
          memberId: member.id,
          points: isNewMember ? merchant.welcomePoints : 0,
        }
      });
    }

    // Calculate base points (round to nearest whole number)
    let pointsToAward = Math.round(order_total * merchant.posPointsPerDollar);

    // TODO: Apply product-specific points rules here
    // For now, use base calculation

    // Create the external order record
    const externalOrder = await prisma.externalOrder.create({
      data: {
        merchantId,
        externalId: external_id,
        externalSource: source,
        customerEmail: customer_email.toLowerCase(),
        memberId: member.id,
        orderTotal: order_total,
        currency,
        orderDate: order_date ? new Date(order_date) : new Date(),
        lineItems: line_items || null,
        idempotencyKey: idempotency_key || null,
        pointsAwarded: pointsToAward,
        pointsAwardedAt: new Date(),
        status: 'processed',
      }
    });

    // Award points to member
    await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: { increment: pointsToAward }
      }
    });

    // Create reward transaction for audit if business exists
    if (merchant.businesses.length > 0) {
      await prisma.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          businessId: merchant.businesses[0].id,
          memberId: member.id,
          type: 'EARN',
          amount: pointsToAward,
          reason: `Order ${external_id} via ${source} (${merchant.name})`,
          status: 'SUCCESS',
        }
      });
    }

    // Log successful usage
    await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      order_id: externalOrder.id,
      member_id: member.id,
      points_awarded: pointsToAward,
      message: isNewMember
        ? `New member created and awarded ${pointsToAward} points`
        : `Awarded ${pointsToAward} points to existing member`,
      new_member: isNewMember,
      total_points: merchantMember.points + pointsToAward
    });

  } catch (error: any) {
    console.error('[Orders API] Error:', error);

    if (apiKeyId) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'POST', 500, Date.now() - startTime);
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/orders
 * List orders for the merchant
 *
 * Query params:
 *   limit?: number (default 50, max 100)
 *   offset?: number (default 0)
 *   status?: string
 *   email?: string
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

    if (!hasPermission(keyData.apiKey.permissions, 'read:orders')) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'GET', 403, Date.now() - startTime);
      return NextResponse.json(
        { error: 'API key does not have read:orders permission' },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(apiKeyId, keyData.apiKey.rateLimit);
    if (!rateLimit.allowed) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'GET', 429, Date.now() - startTime);
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status');
    const email = url.searchParams.get('email');

    const where: any = { merchantId: keyData.merchant.id };
    if (status) where.status = status;
    if (email) where.customerEmail = email.toLowerCase();

    const [orders, total] = await Promise.all([
      prisma.externalOrder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          externalId: true,
          externalSource: true,
          customerEmail: true,
          memberId: true,
          orderTotal: true,
          currency: true,
          orderDate: true,
          pointsAwarded: true,
          status: true,
          createdAt: true,
        }
      }),
      prisma.externalOrder.count({ where })
    ]);

    await logApiUsage(apiKeyId, '/api/v1/orders', 'GET', 200, Date.now() - startTime);

    return NextResponse.json({
      orders,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + orders.length < total
      }
    });

  } catch (error: any) {
    console.error('[Orders API] Error:', error);
    if (apiKeyId) {
      await logApiUsage(apiKeyId, '/api/v1/orders', 'GET', 500, Date.now() - startTime);
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
