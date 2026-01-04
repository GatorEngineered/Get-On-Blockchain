// src/app/api/merchant/payout-wallet/setup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { generateWallet } from '@/app/lib/blockchain/wallet';

/**
 * POST /api/merchant/payout-wallet/setup
 *
 * Generate and setup a custodial payout wallet for the merchant
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    // Get current merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check if wallet already exists
    if (merchant.payoutWalletAddress && merchant.payoutWalletEncrypted) {
      return NextResponse.json(
        { error: 'Payout wallet already exists. Contact support to reset.' },
        { status: 400 }
      );
    }

    // Generate new wallet
    const wallet = generateWallet();

    // Update merchant with new wallet
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        payoutWalletAddress: wallet.address,
        payoutWalletEncrypted: wallet.encryptedPrivateKey,
        payoutEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      walletAddress: wallet.address,
      message: 'Payout wallet created successfully. Please fund this wallet with USDC to enable payouts.',
    });
  } catch (error: any) {
    console.error('[Setup Payout Wallet] Error:', error);
    return NextResponse.json(
      { error: 'Failed to setup payout wallet', details: error.message },
      { status: 500 }
    );
  }
}
