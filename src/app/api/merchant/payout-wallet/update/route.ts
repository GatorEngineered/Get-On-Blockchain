// src/app/api/merchant/payout-wallet/update/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { generateWallet } from '@/app/lib/blockchain/wallet';

/**
 * POST /api/merchant/payout-wallet/update
 *
 * Update the merchant's payout wallet
 * - Can set a custom external wallet address (no private key stored)
 * - Or generate a new custodial wallet
 *
 * Body:
 * - walletAddress?: string (custom address, if provided we don't store private key)
 * - generateNew?: boolean (if true, generate new custodial wallet)
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

    // Check plan restrictions - Starter and Basic plans cannot configure wallet
    if (merchant.plan === "STARTER" || merchant.plan === "BASIC") {
      return NextResponse.json(
        {
          error: 'Wallet configuration requires a Premium plan or higher. Please upgrade your plan to enable USDC payouts.',
          planRestricted: true,
          currentPlan: merchant.plan,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { walletAddress, generateNew } = body;

    // Validate request
    if (!walletAddress && !generateNew) {
      return NextResponse.json(
        { error: 'Must provide either walletAddress or set generateNew to true' },
        { status: 400 }
      );
    }

    // Validate wallet address format if provided
    if (walletAddress) {
      // Basic Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return NextResponse.json(
          { error: 'Invalid wallet address format. Must be a valid Ethereum address.' },
          { status: 400 }
        );
      }

      // Update with custom wallet address (no private key - external wallet)
      await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          payoutWalletAddress: walletAddress.toLowerCase(),
          payoutWalletEncrypted: null, // No private key for external wallets
          payoutEnabled: true,
        },
      });

      console.log(`[Update Payout Wallet] Merchant ${merchantId} set custom wallet: ${walletAddress}`);

      return NextResponse.json({
        success: true,
        walletAddress: walletAddress.toLowerCase(),
        walletType: 'external',
        message: 'Custom payout wallet set successfully. Send USDC to this address to fund payouts.',
      });
    }

    // Generate new custodial wallet
    if (generateNew) {
      const wallet = generateWallet();

      await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          payoutWalletAddress: wallet.address,
          payoutWalletEncrypted: wallet.encryptedPrivateKey,
          payoutEnabled: true,
        },
      });

      console.log(`[Update Payout Wallet] Merchant ${merchantId} generated new custodial wallet: ${wallet.address}`);

      return NextResponse.json({
        success: true,
        walletAddress: wallet.address,
        walletType: 'custodial',
        message: 'New payout wallet generated successfully. Please fund this wallet with USDC to enable payouts.',
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('[Update Payout Wallet] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update payout wallet', details: error.message },
      { status: 500 }
    );
  }
}
