// src/app/api/member/wallet/export/route.ts
/**
 * Export Member Wallet
 *
 * POST /api/member/wallet/export
 * Export wallet private key - converts to non-custodial
 *
 * SECURITY: This is a one-time operation. Private key can only be shown once.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exportMemberWallet } from '@/app/lib/wallet/wallet-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/member/wallet/export
 * Export wallet and get private key (one-time only)
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

    // Export wallet
    const result = await exportMemberWallet(memberId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Log for audit (without the key)
    console.log(`[Wallet Export] Member ${memberId} exported wallet ${result.walletAddress}`);

    return NextResponse.json({
      success: true,
      walletAddress: result.walletAddress,
      privateKey: result.privateKey,
      warning: result.warning,
      instructions: [
        '1. Copy your private key and store it securely (password manager, hardware wallet, etc.)',
        '2. Never share your private key with anyone',
        '3. This key will NOT be shown again - we do not store unencrypted keys',
        '4. You now have full control of this wallet',
        '5. Import this key into MetaMask or any Polygon-compatible wallet',
      ],
    });
  } catch (error: any) {
    console.error('[Wallet Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export wallet', details: error.message },
      { status: 500 }
    );
  }
}
