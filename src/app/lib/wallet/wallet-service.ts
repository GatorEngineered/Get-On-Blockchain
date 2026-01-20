// src/app/lib/wallet/wallet-service.ts
/**
 * Wallet Service
 *
 * Handles member wallet management for the branded token system:
 * - Create custodial wallets for members
 * - Export wallets to non-custodial (member takes control)
 * - Get wallet balances (token + MATIC)
 *
 * Hybrid Custody Model:
 * - All wallets start as CUSTODIAL (GOB manages keys)
 * - Members can export keys to become NON_CUSTODIAL
 * - Once exported, members have full control
 */

import { prisma } from '@/app/lib/prisma';
import { generateWallet, decryptPrivateKey, encryptPrivateKey } from '@/app/lib/blockchain/wallet';
import {
  getProvider,
  getTokenBalance,
  formatAddress,
  type NetworkId,
  POLYGON_AMOY,
} from '@/app/lib/blockchain/polygon-client';
import { ethers } from 'ethers';

export interface CreateWalletResult {
  success: boolean;
  walletId?: string;
  walletAddress?: string;
  error?: string;
}

export interface ExportWalletResult {
  success: boolean;
  privateKey?: string;
  walletAddress?: string;
  warning?: string;
  error?: string;
}

export interface WalletBalanceResult {
  walletAddress: string;
  maticBalance: string;
  tokenBalances: {
    merchantId: string;
    merchantName: string;
    tokenName: string;
    tokenSymbol: string;
    balance: number;
    contractAddress: string;
  }[];
}

/**
 * Create a custodial wallet for a member
 * Called when member joins a Growth plan merchant
 */
export async function createMemberWallet(memberId: string): Promise<CreateWalletResult> {
  try {
    // Check if member already has a wallet
    const existing = await prisma.memberWallet.findUnique({
      where: { memberId },
    });

    if (existing) {
      return {
        success: true,
        walletId: existing.id,
        walletAddress: existing.walletAddress,
      };
    }

    // Generate new wallet
    const { address, encryptedPrivateKey } = generateWallet();

    // Save to database
    const wallet = await prisma.memberWallet.create({
      data: {
        memberId,
        walletAddress: address,
        privateKeyEnc: encryptedPrivateKey,
        network: 'polygon',
        walletType: 'CUSTODIAL',
        isExported: false,
      },
    });

    console.log(`[Wallet] Created custodial wallet for member ${memberId}: ${formatAddress(address)}`);

    return {
      success: true,
      walletId: wallet.id,
      walletAddress: wallet.walletAddress,
    };
  } catch (error: any) {
    console.error('[Wallet] Create error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create wallet',
    };
  }
}

/**
 * Get or create wallet for a member
 * Ensures member has a wallet before token operations
 */
export async function getOrCreateMemberWallet(memberId: string): Promise<CreateWalletResult> {
  const existing = await prisma.memberWallet.findUnique({
    where: { memberId },
    select: { id: true, walletAddress: true },
  });

  if (existing) {
    return {
      success: true,
      walletId: existing.id,
      walletAddress: existing.walletAddress,
    };
  }

  return createMemberWallet(memberId);
}

/**
 * Export wallet - member claims their private key
 * After export, wallet becomes NON_CUSTODIAL
 */
export async function exportMemberWallet(memberId: string): Promise<ExportWalletResult> {
  try {
    const wallet = await prisma.memberWallet.findUnique({
      where: { memberId },
    });

    if (!wallet) {
      return {
        success: false,
        error: 'No wallet found for this member',
      };
    }

    if (wallet.isExported) {
      return {
        success: false,
        error: 'Wallet has already been exported. For security, private keys can only be shown once.',
      };
    }

    // Decrypt the private key
    const privateKey = decryptPrivateKey(wallet.privateKeyEnc);

    // Mark as exported (non-custodial)
    await prisma.memberWallet.update({
      where: { memberId },
      data: {
        walletType: 'NON_CUSTODIAL',
        isExported: true,
        exportedAt: new Date(),
      },
    });

    console.log(`[Wallet] Member ${memberId} exported wallet ${formatAddress(wallet.walletAddress)}`);

    return {
      success: true,
      privateKey,
      walletAddress: wallet.walletAddress,
      warning:
        'IMPORTANT: Save this private key securely. It will NOT be shown again. ' +
        'Anyone with this key has full control of your wallet.',
    };
  } catch (error: any) {
    console.error('[Wallet] Export error:', error);
    return {
      success: false,
      error: error.message || 'Failed to export wallet',
    };
  }
}

/**
 * Get member wallet info
 */
export async function getMemberWallet(memberId: string) {
  return prisma.memberWallet.findUnique({
    where: { memberId },
    select: {
      id: true,
      walletAddress: true,
      network: true,
      walletType: true,
      isExported: true,
      exportedAt: true,
      balance: true,
      createdAt: true,
    },
  });
}

/**
 * Get member wallet balances (MATIC + all tokens)
 */
export async function getMemberWalletBalances(
  memberId: string,
  network: NetworkId = POLYGON_AMOY
): Promise<WalletBalanceResult | null> {
  const wallet = await prisma.memberWallet.findUnique({
    where: { memberId },
  });

  if (!wallet) {
    return null;
  }

  // Get MATIC balance
  const provider = getProvider(network);
  const maticBalanceWei = await provider.getBalance(wallet.walletAddress);
  const maticBalance = ethers.formatEther(maticBalanceWei);

  // Get all token balances for this member
  const tokenBalances = await prisma.tokenBalance.findMany({
    where: { memberId },
    include: {
      merchantToken: {
        include: {
          merchant: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return {
    walletAddress: wallet.walletAddress,
    maticBalance,
    tokenBalances: tokenBalances.map((tb) => ({
      merchantId: tb.merchantToken.merchant.id,
      merchantName: tb.merchantToken.merchant.name,
      tokenName: tb.merchantToken.tokenName,
      tokenSymbol: tb.merchantToken.tokenSymbol,
      balance: tb.balance,
      contractAddress: tb.merchantToken.contractAddress || '',
    })),
  };
}

/**
 * Get token balance for a specific member + merchant token
 */
export async function getMemberTokenBalance(
  memberId: string,
  merchantTokenId: string
): Promise<number> {
  const balance = await prisma.tokenBalance.findUnique({
    where: {
      merchantTokenId_memberId: {
        merchantTokenId,
        memberId,
      },
    },
    select: { balance: true },
  });

  return balance?.balance || 0;
}

/**
 * Sync token balance from on-chain
 * Updates cached balance in database
 */
export async function syncTokenBalance(
  memberId: string,
  merchantTokenId: string,
  network: NetworkId = POLYGON_AMOY
): Promise<number> {
  // Get wallet and token
  const [wallet, token] = await Promise.all([
    prisma.memberWallet.findUnique({ where: { memberId } }),
    prisma.merchantToken.findUnique({ where: { id: merchantTokenId } }),
  ]);

  if (!wallet || !token || !token.contractAddress) {
    return 0;
  }

  // Get on-chain balance
  const onChainBalance = await getTokenBalance(token.contractAddress, wallet.walletAddress, network);
  const balance = Number(onChainBalance); // 0 decimals, safe to convert

  // Update cached balance
  await prisma.tokenBalance.upsert({
    where: {
      merchantTokenId_memberId: {
        merchantTokenId,
        memberId,
      },
    },
    update: {
      balance,
      lastSyncedAt: new Date(),
    },
    create: {
      merchantTokenId,
      memberId,
      balance,
      lastSyncedAt: new Date(),
    },
  });

  return balance;
}

/**
 * Get wallet signer for custodial operations
 * Only works for CUSTODIAL wallets
 */
export async function getCustodialWalletSigner(
  memberId: string,
  network: NetworkId = POLYGON_AMOY
): Promise<ethers.Wallet | null> {
  const wallet = await prisma.memberWallet.findUnique({
    where: { memberId },
  });

  if (!wallet || wallet.walletType !== 'CUSTODIAL') {
    return null;
  }

  const privateKey = decryptPrivateKey(wallet.privateKeyEnc);
  const provider = getProvider(network);
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Check if member has a wallet
 */
export async function memberHasWallet(memberId: string): Promise<boolean> {
  const wallet = await prisma.memberWallet.findUnique({
    where: { memberId },
    select: { id: true },
  });
  return !!wallet;
}

/**
 * Get wallet address for a member
 */
export async function getMemberWalletAddress(memberId: string): Promise<string | null> {
  const wallet = await prisma.memberWallet.findUnique({
    where: { memberId },
    select: { walletAddress: true },
  });
  return wallet?.walletAddress || null;
}
