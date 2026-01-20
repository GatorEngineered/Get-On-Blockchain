// src/app/api/merchant/token/deploy/route.ts
/**
 * Deploy Merchant Token
 *
 * POST /api/merchant/token/deploy
 * Deploy the branded token to Polygon blockchain
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import {
  deployMerchantToken,
  isTokenFactoryConfigured,
} from '@/app/lib/token/token-factory-service';
import { getRelayerBalance, POLYGON_AMOY } from '@/app/lib/blockchain/polygon-client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/merchant/token/deploy
 * Deploy token to blockchain
 */
export async function POST() {
  try {
    // Get merchant from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const merchantId = session.merchantId;
    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check factory is configured
    if (!isTokenFactoryConfigured()) {
      return NextResponse.json(
        { error: 'Token factory not yet deployed. Please contact support.' },
        { status: 503 }
      );
    }

    // Get merchant's token
    const token = await prisma.merchantToken.findUnique({
      where: { merchantId },
    });

    if (!token) {
      return NextResponse.json(
        { error: 'No token configured. Create token settings first.' },
        { status: 404 }
      );
    }

    if (token.contractAddress) {
      return NextResponse.json(
        {
          error: 'Token already deployed',
          contractAddress: token.contractAddress,
        },
        { status: 400 }
      );
    }

    // Check relayer has gas
    try {
      const balance = await getRelayerBalance(POLYGON_AMOY);
      if (balance.isLow) {
        console.warn('[Token Deploy] Relayer balance is low:', balance.balanceMatic);
        // Don't block, but log for monitoring
      }
    } catch (balanceError) {
      console.error('[Token Deploy] Could not check relayer balance:', balanceError);
    }

    // Deploy token
    const result = await deployMerchantToken(token.id, POLYGON_AMOY);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      contractAddress: result.contractAddress,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      message: 'Token deployed successfully!',
    });
  } catch (error: any) {
    console.error('[Token Deploy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy token', details: error.message },
      { status: 500 }
    );
  }
}
