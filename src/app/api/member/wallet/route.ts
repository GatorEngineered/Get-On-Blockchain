// src/app/api/member/wallet/route.ts
/**
 * Member Wallet API
 *
 * GET  - Get wallet info and balances
 * POST - Create wallet (if doesn't exist)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getMemberWallet,
  getMemberWalletBalances,
  createMemberWallet,
} from '@/app/lib/wallet/wallet-service';
import { formatAddress, POLYGON_AMOY } from '@/app/lib/blockchain/polygon-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/member/wallet
 * Get member's wallet info and token balances
 */
export async function GET() {
  try {
    // Get member from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const memberId = session.memberId;
    if (!memberId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get wallet info
    const wallet = await getMemberWallet(memberId);

    if (!wallet) {
      return NextResponse.json({
        hasWallet: false,
        message: 'No wallet yet. Create one to receive tokens.',
      });
    }

    // Get balances
    const balances = await getMemberWalletBalances(memberId, POLYGON_AMOY);

    return NextResponse.json({
      hasWallet: true,
      wallet: {
        id: wallet.id,
        address: wallet.walletAddress,
        addressShort: formatAddress(wallet.walletAddress),
        network: wallet.network,
        walletType: wallet.walletType,
        isExported: wallet.isExported,
        exportedAt: wallet.exportedAt?.toISOString(),
        createdAt: wallet.createdAt.toISOString(),
      },
      balances: {
        matic: balances?.maticBalance || '0',
        tokens: balances?.tokenBalances || [],
      },
    });
  } catch (error: any) {
    console.error('[Member Wallet] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet info', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/member/wallet
 * Create wallet for member
 */
export async function POST() {
  try {
    // Get member from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_member_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const memberId = session.memberId;
    if (!memberId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Create wallet
    const result = await createMemberWallet(memberId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      walletId: result.walletId,
      walletAddress: result.walletAddress,
      addressShort: formatAddress(result.walletAddress!),
      message: 'Wallet created successfully!',
    });
  } catch (error: any) {
    console.error('[Member Wallet] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet', details: error.message },
      { status: 500 }
    );
  }
}
