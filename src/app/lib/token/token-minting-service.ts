// src/app/lib/token/token-minting-service.ts
/**
 * Token Minting Service
 *
 * Handles minting and burning branded tokens:
 * - Mint tokens when members earn (visit, referral, etc.)
 * - Burn tokens when members redeem TOKEN_REWARD
 * - Track all transactions in database
 *
 * Real-time minting: Tokens are minted immediately on each earn action
 * GOB relayer pays all gas fees
 */

import { ethers } from 'ethers';
import { prisma } from '@/app/lib/prisma';
import {
  getRelayerSigner,
  waitForTransaction,
  MERCHANT_TOKEN_ABI,
  type NetworkId,
  POLYGON_AMOY,
} from '@/app/lib/blockchain/polygon-client';
import { getOrCreateMemberWallet } from '@/app/lib/wallet/wallet-service';

export interface MintResult {
  success: boolean;
  transactionId?: string;
  txHash?: string;
  amount?: number;
  newBalance?: number;
  error?: string;
}

export interface BurnResult {
  success: boolean;
  transactionId?: string;
  txHash?: string;
  amount?: number;
  newBalance?: number;
  error?: string;
}

/**
 * Mint tokens to a member
 * Called when member earns points at a Growth plan merchant
 */
export async function mintTokens(params: {
  memberId: string;
  merchantId: string;
  amount: number;
  reason: string;
  relatedEntityId?: string;
}): Promise<MintResult> {
  const { memberId, merchantId, amount, reason, relatedEntityId } = params;

  if (amount <= 0) {
    return { success: false, error: 'Amount must be positive' };
  }

  try {
    // Get merchant token
    const merchantToken = await prisma.merchantToken.findUnique({
      where: { merchantId },
    });

    if (!merchantToken) {
      // No token for this merchant, just return success (points-only merchant)
      return { success: true, amount: 0 };
    }

    if (!merchantToken.contractAddress) {
      return { success: false, error: 'Token not yet deployed' };
    }

    if (!merchantToken.isActive || merchantToken.isPaused) {
      return { success: false, error: 'Token is paused or inactive' };
    }

    // Ensure member has a wallet
    const walletResult = await getOrCreateMemberWallet(memberId);
    if (!walletResult.success || !walletResult.walletAddress) {
      return { success: false, error: 'Failed to get member wallet' };
    }

    const memberWalletAddress = walletResult.walletAddress;
    const network = merchantToken.network as NetworkId;

    // Create transaction record
    const txRecord = await prisma.tokenTransaction.create({
      data: {
        merchantTokenId: merchantToken.id,
        memberId,
        type: 'MINT',
        amount,
        toAddress: memberWalletAddress,
        status: 'PENDING',
        reason,
        relatedEntityId,
      },
    });

    try {
      // Get relayer and contract
      const signer = getRelayerSigner(network);
      const contract = new ethers.Contract(merchantToken.contractAddress, MERCHANT_TOKEN_ABI, signer);

      console.log(
        `[Minting] Minting ${amount} ${merchantToken.tokenSymbol} to ${memberWalletAddress}...`
      );

      // Mint tokens
      const tx = await contract.mint(memberWalletAddress, amount);

      // Update with tx hash
      await prisma.tokenTransaction.update({
        where: { id: txRecord.id },
        data: { txHash: tx.hash },
      });

      // Wait for confirmation
      const receipt = await waitForTransaction(tx.hash, network);

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed on-chain');
      }

      // Update transaction record
      await prisma.tokenTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'CONFIRMED',
          blockNumber: receipt.blockNumber,
          gasUsed: Number(receipt.gasUsed),
          confirmedAt: new Date(),
        },
      });

      // Update token supply stats
      await prisma.merchantToken.update({
        where: { id: merchantToken.id },
        data: {
          totalMinted: { increment: amount },
          circulatingSupply: { increment: amount },
          lastSyncedAt: new Date(),
        },
      });

      // Update member's cached balance
      const tokenBalance = await prisma.tokenBalance.upsert({
        where: {
          merchantTokenId_memberId: {
            merchantTokenId: merchantToken.id,
            memberId,
          },
        },
        update: {
          balance: { increment: amount },
          lastSyncedAt: new Date(),
        },
        create: {
          merchantTokenId: merchantToken.id,
          memberId,
          balance: amount,
          lastSyncedAt: new Date(),
        },
      });

      console.log(
        `[Minting] Minted ${amount} ${merchantToken.tokenSymbol}. New balance: ${tokenBalance.balance}`
      );

      return {
        success: true,
        transactionId: txRecord.id,
        txHash: tx.hash,
        amount,
        newBalance: tokenBalance.balance,
      };
    } catch (txError: any) {
      // Update transaction as failed
      await prisma.tokenTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'FAILED',
          errorMessage: txError.message,
        },
      });
      throw txError;
    }
  } catch (error: any) {
    console.error('[Minting] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to mint tokens',
    };
  }
}

/**
 * Burn tokens from a member
 * Called when member redeems a TOKEN_REWARD
 */
export async function burnTokens(params: {
  memberId: string;
  merchantId: string;
  amount: number;
  reason: string;
  relatedEntityId?: string;
}): Promise<BurnResult> {
  const { memberId, merchantId, amount, reason, relatedEntityId } = params;

  if (amount <= 0) {
    return { success: false, error: 'Amount must be positive' };
  }

  try {
    // Get merchant token
    const merchantToken = await prisma.merchantToken.findUnique({
      where: { merchantId },
    });

    if (!merchantToken || !merchantToken.contractAddress) {
      return { success: false, error: 'Token not found or not deployed' };
    }

    // Get member's current balance
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: {
        merchantTokenId_memberId: {
          merchantTokenId: merchantToken.id,
          memberId,
        },
      },
    });

    if (!tokenBalance || tokenBalance.balance < amount) {
      return {
        success: false,
        error: `Insufficient token balance. Have: ${tokenBalance?.balance || 0}, Need: ${amount}`,
      };
    }

    // Get member wallet
    const memberWallet = await prisma.memberWallet.findUnique({
      where: { memberId },
    });

    if (!memberWallet) {
      return { success: false, error: 'Member wallet not found' };
    }

    const network = merchantToken.network as NetworkId;

    // Create transaction record
    const txRecord = await prisma.tokenTransaction.create({
      data: {
        merchantTokenId: merchantToken.id,
        memberId,
        type: 'BURN',
        amount,
        fromAddress: memberWallet.walletAddress,
        status: 'PENDING',
        reason,
        relatedEntityId,
      },
    });

    try {
      // For burning, we need the member's wallet to sign (if custodial)
      // For now, we'll use burnFrom with relayer (requires approval setup)
      // Simpler approach: Transfer to burn address, then admin burns
      // Even simpler for custodial: Just update balances and let admin burn later

      // Since we control custodial wallets, we can:
      // 1. Deduct from cached balance immediately
      // 2. Queue actual on-chain burn for batch processing (gas optimization)
      // For MVP, we'll mark as pending and update balance

      // Update member's cached balance immediately
      const updatedBalance = await prisma.tokenBalance.update({
        where: {
          merchantTokenId_memberId: {
            merchantTokenId: merchantToken.id,
            memberId,
          },
        },
        data: {
          balance: { decrement: amount },
          lastSyncedAt: new Date(),
        },
      });

      // Update token supply stats
      await prisma.merchantToken.update({
        where: { id: merchantToken.id },
        data: {
          totalBurned: { increment: amount },
          circulatingSupply: { decrement: amount },
          lastSyncedAt: new Date(),
        },
      });

      // Mark transaction as confirmed (balance updated)
      // Actual on-chain burn can be batched later
      await prisma.tokenTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      console.log(
        `[Burn] Burned ${amount} ${merchantToken.tokenSymbol}. New balance: ${updatedBalance.balance}`
      );

      return {
        success: true,
        transactionId: txRecord.id,
        amount,
        newBalance: updatedBalance.balance,
      };
    } catch (txError: any) {
      await prisma.tokenTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'FAILED',
          errorMessage: txError.message,
        },
      });
      throw txError;
    }
  } catch (error: any) {
    console.error('[Burn] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to burn tokens',
    };
  }
}

/**
 * Get member's token balance for a merchant
 */
export async function getTokenBalance(memberId: string, merchantId: string): Promise<number> {
  const merchantToken = await prisma.merchantToken.findUnique({
    where: { merchantId },
    select: { id: true },
  });

  if (!merchantToken) {
    return 0;
  }

  const balance = await prisma.tokenBalance.findUnique({
    where: {
      merchantTokenId_memberId: {
        merchantTokenId: merchantToken.id,
        memberId,
      },
    },
    select: { balance: true },
  });

  return balance?.balance || 0;
}

/**
 * Get token transaction history for a member
 */
export async function getTokenTransactionHistory(
  memberId: string,
  merchantId: string,
  limit = 20
) {
  const merchantToken = await prisma.merchantToken.findUnique({
    where: { merchantId },
    select: { id: true, tokenSymbol: true },
  });

  if (!merchantToken) {
    return [];
  }

  return prisma.tokenTransaction.findMany({
    where: {
      merchantTokenId: merchantToken.id,
      memberId,
    },
    select: {
      id: true,
      type: true,
      amount: true,
      txHash: true,
      status: true,
      reason: true,
      createdAt: true,
      confirmedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Check if merchant has a deployed token
 */
export async function merchantHasToken(merchantId: string): Promise<boolean> {
  const token = await prisma.merchantToken.findUnique({
    where: { merchantId },
    select: { contractAddress: true },
  });
  return !!token?.contractAddress;
}

/**
 * Mint tokens as part of a check-in (called from scan flow)
 * Convenience wrapper that handles Growth plan check
 */
export async function mintTokensOnCheckIn(params: {
  memberId: string;
  merchantId: string;
  pointsEarned: number;
  scanId: string;
}): Promise<MintResult> {
  const { memberId, merchantId, pointsEarned, scanId } = params;

  // Check if merchant is Growth plan with token
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { plan: true },
  });

  if (merchant?.plan !== 'GROWTH' && merchant?.plan !== 'PRO') {
    // Not a token merchant
    return { success: true, amount: 0 };
  }

  // Mint tokens equal to points earned
  return mintTokens({
    memberId,
    merchantId,
    amount: pointsEarned,
    reason: `Check-in: Earned ${pointsEarned} tokens`,
    relatedEntityId: scanId,
  });
}
