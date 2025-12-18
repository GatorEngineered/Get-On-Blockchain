// src/app/api/merchant/setup-payout-wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '@/lib/crypto/encryption';
import { getPayoutWalletBalance } from '@/lib/blockchain/polygon';

const prisma = new PrismaClient();

/**
 * POST /api/merchant/setup-payout-wallet
 *
 * Allow business owner to set up their payout wallet
 *
 * Body:
 * - merchantSlug: string
 * - privateKey: string (0x-prefixed)
 * - milestonePoints: number (optional, default 100)
 * - payoutAmount: number (optional, default 5.0)
 * - network: "polygon" | "mumbai" (optional, default "mumbai" for testing)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      merchantSlug,
      privateKey,
      milestonePoints,
      payoutAmount,
      network,
    } = await req.json();

    // Validation
    if (!merchantSlug || !privateKey) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantSlug, privateKey' },
        { status: 400 }
      );
    }

    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      return NextResponse.json(
        {
          error: 'Invalid private key format. Must be 0x-prefixed 64-character hex string.',
        },
        { status: 400 }
      );
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Verify Premium plan
    if (merchant.plan !== 'PREMIUM') {
      return NextResponse.json(
        {
          error: 'Stablecoin payouts require Premium plan. Upgrade at /pricing',
        },
        { status: 403 }
      );
    }

    // Verify wallet by checking balance (ensures valid private key)
    let walletAddress: string;
    let usdcBalance: number;
    let maticBalance: number;

    try {
      const balance = await getPayoutWalletBalance(
        privateKey,
        network || 'mumbai'
      );
      walletAddress = balance.address;
      usdcBalance = balance.usdcBalance;
      maticBalance = balance.maticBalance;

      console.log(`[Setup] Wallet verified: ${walletAddress}`);
      console.log(`[Setup] USDC Balance: ${usdcBalance}`);
      console.log(`[Setup] MATIC Balance: ${maticBalance}`);
    } catch (error: any) {
      console.error('[Setup] Failed to verify wallet:', error);
      return NextResponse.json(
        {
          error: 'Failed to verify wallet. Please check your private key.',
          ...(process.env.NODE_ENV === 'development' && { details: error.message }),
        },
        { status: 400 }
      );
    }

    // Encrypt private key before storing
    const encryptedPrivateKey = encrypt(privateKey);

    // Update merchant with payout configuration
    const updatedMerchant = await prisma.merchant.update({
      where: { slug: merchantSlug },
      data: {
        payoutEnabled: true,
        payoutWalletAddress: walletAddress,
        payoutWalletEncrypted: encryptedPrivateKey,
        payoutMilestonePoints: milestonePoints || 100,
        payoutAmountUSD: payoutAmount || 5.0,
        payoutNetwork: network || 'mumbai',
        usdcBalance,
        lastBalanceCheck: new Date(),
        lowBalanceAlertSent: false,
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        merchantId: merchant.id,
        type: 'REWARD_EARNED', // Reusing existing enum, ideally add PAYOUT_WALLET_SETUP
        source: 'merchant_dashboard',
        metadata: {
          action: 'PAYOUT_WALLET_SETUP',
          walletAddress,
          network: network || 'mumbai',
          milestonePoints: milestonePoints || 100,
          payoutAmount: payoutAmount || 5.0,
        },
      },
    });

    console.log(`[Setup] Payout wallet configured for ${merchantSlug}`);

    return NextResponse.json({
      success: true,
      message: 'Payout wallet configured successfully!',
      wallet: {
        address: walletAddress,
        network: network || 'mumbai',
        usdcBalance,
        maticBalance,
      },
      settings: {
        milestonePoints: updatedMerchant.payoutMilestonePoints,
        payoutAmount: updatedMerchant.payoutAmountUSD,
      },
    });
  } catch (error: any) {
    console.error('[Setup] Error setting up payout wallet:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/merchant/setup-payout-wallet?merchantSlug=xxx
 *
 * Get current payout wallet status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantSlug = searchParams.get('merchantSlug');

    if (!merchantSlug) {
      return NextResponse.json(
        { error: 'Merchant slug is required' },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      payoutEnabled: merchant.payoutEnabled,
      walletAddress: merchant.payoutWalletAddress || null,
      network: merchant.payoutNetwork,
      milestonePoints: merchant.payoutMilestonePoints,
      payoutAmount: merchant.payoutAmountUSD,
      usdcBalance: merchant.usdcBalance || 0,
      lastBalanceCheck: merchant.lastBalanceCheck,
      lowBalanceAlertSent: merchant.lowBalanceAlertSent,
    });
  } catch (error: any) {
    console.error('[Setup] Error fetching payout wallet status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
