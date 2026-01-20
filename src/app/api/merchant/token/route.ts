// src/app/api/merchant/token/route.ts
/**
 * Merchant Token API
 *
 * GET  - Get merchant's branded token info
 * POST - Create new branded token (settings only, not deployed)
 * PUT  - Update token settings (before deployment)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import {
  createMerchantToken,
  getMerchantToken,
  updateMerchantToken,
  generateTokenSymbol,
} from '@/app/lib/token/token-factory-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/merchant/token
 * Get merchant's branded token info
 */
export async function GET() {
  try {
    // Get merchant from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse session cookie (JSON with merchantId)
    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check merchant plan
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { plan: true, name: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (merchant.plan !== 'GROWTH' && merchant.plan !== 'PRO') {
      return NextResponse.json({
        error: 'Branded tokens require Growth or Pro plan',
        currentPlan: merchant.plan,
      }, { status: 403 });
    }

    // Get token info
    const token = await getMerchantToken(merchantId);

    if (!token) {
      // No token yet - suggest a symbol
      const suggestedSymbol = generateTokenSymbol(merchant.name);
      return NextResponse.json({
        hasToken: false,
        suggestedName: `${merchant.name} Token`,
        suggestedSymbol,
      });
    }

    return NextResponse.json({
      hasToken: true,
      token,
    });
  } catch (error: any) {
    console.error('[Token API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get token info', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant/token
 * Create branded token (settings only)
 */
export async function POST(req: NextRequest) {
  try {
    // Get merchant from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse session cookie (JSON with merchantId)
    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { tokenName, tokenSymbol } = body;

    if (!tokenName || typeof tokenName !== 'string') {
      return NextResponse.json({ error: 'tokenName is required' }, { status: 400 });
    }

    if (tokenName.length < 3 || tokenName.length > 50) {
      return NextResponse.json({ error: 'tokenName must be 3-50 characters' }, { status: 400 });
    }

    // Generate symbol if not provided
    const symbol = tokenSymbol || generateTokenSymbol(tokenName);

    // Create token
    const result = await createMerchantToken({
      merchantId,
      tokenName,
      tokenSymbol: symbol,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      merchantTokenId: result.merchantTokenId,
      message: 'Token created. Deploy when ready.',
    });
  } catch (error: any) {
    console.error('[Token API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create token', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/merchant/token
 * Update token settings (before deployment only)
 */
export async function PUT(req: NextRequest) {
  try {
    // Get merchant from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse session cookie (JSON with merchantId)
    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get merchant's token
    const token = await prisma.merchantToken.findUnique({
      where: { merchantId },
    });

    if (!token) {
      return NextResponse.json({ error: 'No token found. Create one first.' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { tokenName, tokenSymbol } = body;

    const updates: { tokenName?: string; tokenSymbol?: string } = {};

    if (tokenName) {
      if (tokenName.length < 3 || tokenName.length > 50) {
        return NextResponse.json({ error: 'tokenName must be 3-50 characters' }, { status: 400 });
      }
      updates.tokenName = tokenName;
    }

    if (tokenSymbol) {
      updates.tokenSymbol = tokenSymbol;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const result = await updateMerchantToken(token.id, updates);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Token settings updated',
    });
  } catch (error: any) {
    console.error('[Token API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update token', details: error.message },
      { status: 500 }
    );
  }
}
