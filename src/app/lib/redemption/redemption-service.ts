// src/app/lib/redemption/redemption-service.ts
/**
 * Redemption Service
 *
 * Handles QR-verified reward redemptions for all plan types:
 * - Points redemptions (all plans)
 * - USDC payout redemptions (Premium+)
 * - Token redemptions (Growth+ - future)
 *
 * Flow:
 * 1. Member creates redemption request → gets QR code
 * 2. Staff scans QR → verifies member has balance
 * 3. Staff confirms → points deducted, reward granted
 */

import { prisma } from '@/app/lib/prisma';
import { randomBytes, createHash } from 'crypto';
import { RedemptionStatus, RewardKind } from '@prisma/client';
import { burnTokens } from '@/app/lib/token/token-minting-service';

// QR code expiry time in minutes
const QR_EXPIRY_MINUTES = 10;

// Types
export interface CreateRedemptionParams {
  memberId: string;
  merchantId: string;
  rewardId: string;
  businessId?: string; // Optional: specific location
}

export interface RedemptionResult {
  success: boolean;
  redemptionId?: string;
  qrCodeHash?: string;
  qrCodeData?: string; // Full data to encode in QR
  expiresAt?: Date;
  error?: string;
}

export interface VerifyRedemptionResult {
  success: boolean;
  redemption?: {
    id: string;
    status: RedemptionStatus;
    member: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    reward: {
      id: string;
      name: string;
      description: string | null;
      pointsCost: number;
      rewardType: RewardKind;
      usdcAmount: number | null;
    };
    memberBalance: number;
    memberTier: string;
    expiresAt: Date;
    createdAt: Date;
  };
  error?: string;
}

export interface ConfirmRedemptionResult {
  success: boolean;
  transaction?: {
    id: string;
    pointsDeducted: number;
    newBalance: number;
    rewardName: string;
    tokensBurned?: number;
    tokenBurnTxHash?: string | null;
  };
  error?: string;
}

/**
 * Generate a secure unique hash for QR code
 */
function generateQRHash(): string {
  const randomData = randomBytes(32);
  const timestamp = Date.now().toString();
  const combined = `${randomData.toString('hex')}-${timestamp}`;
  return createHash('sha256').update(combined).digest('hex').substring(0, 32);
}

/**
 * Create a redemption request and generate QR code
 *
 * Called when member wants to redeem a reward.
 * Returns QR data that member shows to staff.
 */
export async function createRedemptionRequest(
  params: CreateRedemptionParams
): Promise<RedemptionResult> {
  const { memberId, merchantId, rewardId, businessId } = params;

  try {
    // 1. Verify member exists and get their merchant membership
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId,
        },
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!merchantMember) {
      return {
        success: false,
        error: 'You are not a member of this merchant',
      };
    }

    // 2. Get the reward details
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    if (!reward.isActive) {
      return { success: false, error: 'This reward is no longer available' };
    }

    if (reward.merchantId !== merchantId) {
      return { success: false, error: 'Reward does not belong to this merchant' };
    }

    // 3. Check if member has enough points
    if (merchantMember.points < reward.pointsCost) {
      return {
        success: false,
        error: `Not enough points. You have ${merchantMember.points} points but need ${reward.pointsCost}`,
      };
    }

    // 4. Check for existing pending redemptions for this reward
    const existingPending = await prisma.redemptionRequest.findFirst({
      where: {
        memberId,
        merchantId,
        rewardId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingPending) {
      // Return existing QR instead of creating new one
      return {
        success: true,
        redemptionId: existingPending.id,
        qrCodeHash: existingPending.qrCodeHash,
        qrCodeData: `gob:redeem:${existingPending.qrCodeHash}`,
        expiresAt: existingPending.expiresAt,
      };
    }

    // 5. Generate QR hash and create redemption request
    const qrCodeHash = generateQRHash();
    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000);

    const redemption = await prisma.redemptionRequest.create({
      data: {
        merchantId,
        memberId,
        rewardId,
        businessId: businessId || null,
        pointsCost: reward.pointsCost,
        usdcCost: reward.rewardType === 'USDC_PAYOUT' ? reward.usdcAmount : null,
        qrCodeHash,
        expiresAt,
        status: 'PENDING',
      },
    });

    // QR code data format: gob:redeem:{hash}
    const qrCodeData = `gob:redeem:${qrCodeHash}`;

    return {
      success: true,
      redemptionId: redemption.id,
      qrCodeHash,
      qrCodeData,
      expiresAt,
    };
  } catch (error: any) {
    console.error('[Redemption] Create error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create redemption request',
    };
  }
}

/**
 * Verify a redemption QR code
 *
 * Called when staff scans member's QR code.
 * Returns member info, reward details, and balance for confirmation.
 */
export async function verifyRedemptionQR(
  qrCodeHash: string,
  merchantId: string
): Promise<VerifyRedemptionResult> {
  try {
    // 1. Find redemption request by QR hash
    const redemption = await prisma.redemptionRequest.findUnique({
      where: { qrCodeHash },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reward: true,
      },
    });

    if (!redemption) {
      return { success: false, error: 'Invalid QR code' };
    }

    // 2. Verify merchant owns this redemption
    if (redemption.merchantId !== merchantId) {
      return { success: false, error: 'This redemption is for a different merchant' };
    }

    // 3. Check status
    if (redemption.status === 'CONFIRMED') {
      return { success: false, error: 'This reward has already been redeemed' };
    }

    if (redemption.status === 'DECLINED') {
      return { success: false, error: 'This redemption was declined' };
    }

    if (redemption.status === 'CANCELLED') {
      return { success: false, error: 'This redemption was cancelled by the member' };
    }

    // 4. Check if expired
    if (redemption.expiresAt < new Date()) {
      // Mark as expired
      await prisma.redemptionRequest.update({
        where: { id: redemption.id },
        data: { status: 'EXPIRED' },
      });
      return {
        success: false,
        error: 'This QR code has expired. Please ask the member to generate a new one.',
      };
    }

    // 5. Get current member balance
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId: redemption.memberId,
        },
      },
    });

    if (!merchantMember) {
      return { success: false, error: 'Member not found in merchant records' };
    }

    // 6. Verify member still has enough points
    if (merchantMember.points < redemption.pointsCost) {
      return {
        success: false,
        error: `Member no longer has enough points. Balance: ${merchantMember.points}, Required: ${redemption.pointsCost}`,
      };
    }

    return {
      success: true,
      redemption: {
        id: redemption.id,
        status: redemption.status,
        member: redemption.member,
        reward: {
          id: redemption.reward.id,
          name: redemption.reward.name,
          description: redemption.reward.description,
          pointsCost: redemption.reward.pointsCost,
          rewardType: redemption.reward.rewardType,
          usdcAmount: redemption.reward.usdcAmount,
        },
        memberBalance: merchantMember.points,
        memberTier: merchantMember.tier,
        expiresAt: redemption.expiresAt,
        createdAt: redemption.createdAt,
      },
    };
  } catch (error: any) {
    console.error('[Redemption] Verify error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify redemption',
    };
  }
}

/**
 * Confirm a redemption (deduct points, grant reward)
 *
 * Called when staff confirms the redemption.
 * Deducts points and creates transaction record.
 */
export async function confirmRedemption(
  redemptionId: string,
  merchantId: string,
  staffId?: string,
  businessId?: string
): Promise<ConfirmRedemptionResult> {
  try {
    // 1. Get redemption request
    const redemption = await prisma.redemptionRequest.findUnique({
      where: { id: redemptionId },
      include: {
        reward: true,
        member: true,
      },
    });

    if (!redemption) {
      return { success: false, error: 'Redemption request not found' };
    }

    // 2. Verify merchant
    if (redemption.merchantId !== merchantId) {
      return { success: false, error: 'Unauthorized' };
    }

    // 3. Check status
    if (redemption.status !== 'PENDING') {
      return { success: false, error: `Cannot confirm - status is ${redemption.status}` };
    }

    // 4. Check expiry
    if (redemption.expiresAt < new Date()) {
      await prisma.redemptionRequest.update({
        where: { id: redemptionId },
        data: { status: 'EXPIRED' },
      });
      return { success: false, error: 'Redemption has expired' };
    }

    // 5. Get merchant member and verify balance
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId: redemption.memberId,
        },
      },
    });

    if (!merchantMember) {
      return { success: false, error: 'Member not found' };
    }

    if (merchantMember.points < redemption.pointsCost) {
      return {
        success: false,
        error: `Insufficient points. Balance: ${merchantMember.points}, Required: ${redemption.pointsCost}`,
      };
    }

    // 6. Get first business for transaction record if not provided
    const targetBusinessId = businessId || redemption.businessId;
    let txBusinessId = targetBusinessId;

    if (!txBusinessId) {
      const firstBusiness = await prisma.business.findFirst({
        where: { merchantId },
        select: { id: true },
      });
      txBusinessId = firstBusiness?.id ?? null;
    }

    if (!txBusinessId) {
      return { success: false, error: 'No business location found for merchant' };
    }

    // 7. Perform the redemption in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct points
      const updatedMember = await tx.merchantMember.update({
        where: { id: merchantMember.id },
        data: {
          points: { decrement: redemption.pointsCost },
        },
      });

      // Mark redemption as confirmed
      await tx.redemptionRequest.update({
        where: { id: redemptionId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          confirmedByStaffId: staffId || null,
          businessId: targetBusinessId,
        },
      });

      // Create reward transaction record
      const transaction = await tx.rewardTransaction.create({
        data: {
          merchantMemberId: merchantMember.id,
          businessId: txBusinessId!,
          memberId: redemption.memberId,
          type: 'REDEEM',
          amount: redemption.pointsCost,
          pointsDeducted: redemption.pointsCost,
          usdcAmount: redemption.usdcCost,
          status: 'SUCCESS',
          reason: `Redeemed: ${redemption.reward.name}`,
        },
      });

      // Create event log
      await tx.event.create({
        data: {
          merchantId,
          memberId: redemption.memberId,
          type: 'REWARD_REDEEMED',
          source: 'qr_verification',
          metadata: {
            redemptionId,
            rewardId: redemption.rewardId,
            rewardName: redemption.reward.name,
            pointsDeducted: redemption.pointsCost,
            newBalance: updatedMember.points,
            staffId: staffId || null,
            businessId: targetBusinessId,
            verificationMethod: 'qr_scan',
          },
        },
      });

      return {
        transactionId: transaction.id,
        newBalance: updatedMember.points,
      };
    });

    console.log(
      `[Redemption] Confirmed: ${redemption.reward.name} for member ${redemption.memberId}. ` +
        `Points: ${merchantMember.points} → ${result.newBalance}`
    );

    // Burn tokens if this is a token-based reward (Growth/Pro plan)
    // Also burn if merchant has tokens and the reward has a tokenCost
    let tokensBurned = 0;
    let tokenBurnTxHash: string | null = null;

    const tokenCost = (redemption.reward as any).tokenCost;
    if (redemption.reward.rewardType === 'TOKEN_REWARD' || tokenCost > 0) {
      try {
        const burnAmount = tokenCost || redemption.pointsCost;
        const burnResult = await burnTokens({
          memberId: redemption.memberId,
          merchantId,
          amount: burnAmount,
          reason: `Redeemed: ${redemption.reward.name}`,
          relatedEntityId: redemptionId,
        });
        if (burnResult.success && burnResult.amount) {
          tokensBurned = burnResult.amount;
          tokenBurnTxHash = burnResult.txHash ?? null;
          console.log(`[Redemption] Burned ${tokensBurned} tokens for redemption ${redemptionId}`);
        }
      } catch (tokenError) {
        // Log but don't fail the redemption - points were already deducted
        console.error('[Redemption] Token burning error (non-blocking):', tokenError);
      }
    }

    return {
      success: true,
      transaction: {
        id: result.transactionId,
        pointsDeducted: redemption.pointsCost,
        newBalance: result.newBalance,
        rewardName: redemption.reward.name,
        tokensBurned,
        tokenBurnTxHash,
      },
    };
  } catch (error: any) {
    console.error('[Redemption] Confirm error:', error);
    return {
      success: false,
      error: error.message || 'Failed to confirm redemption',
    };
  }
}

/**
 * Decline a redemption
 *
 * Called when staff declines the redemption.
 */
export async function declineRedemption(
  redemptionId: string,
  merchantId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const redemption = await prisma.redemptionRequest.findUnique({
      where: { id: redemptionId },
    });

    if (!redemption) {
      return { success: false, error: 'Redemption request not found' };
    }

    if (redemption.merchantId !== merchantId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (redemption.status !== 'PENDING') {
      return { success: false, error: `Cannot decline - status is ${redemption.status}` };
    }

    await prisma.redemptionRequest.update({
      where: { id: redemptionId },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: reason || 'Declined by staff',
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Redemption] Decline error:', error);
    return {
      success: false,
      error: error.message || 'Failed to decline redemption',
    };
  }
}

/**
 * Cancel a redemption (member-initiated)
 */
export async function cancelRedemption(
  redemptionId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const redemption = await prisma.redemptionRequest.findUnique({
      where: { id: redemptionId },
    });

    if (!redemption) {
      return { success: false, error: 'Redemption request not found' };
    }

    if (redemption.memberId !== memberId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (redemption.status !== 'PENDING') {
      return { success: false, error: `Cannot cancel - status is ${redemption.status}` };
    }

    await prisma.redemptionRequest.update({
      where: { id: redemptionId },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Redemption] Cancel error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel redemption',
    };
  }
}

/**
 * Get pending redemptions for a member
 */
export async function getMemberPendingRedemptions(memberId: string, merchantId: string) {
  return prisma.redemptionRequest.findMany({
    where: {
      memberId,
      merchantId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    include: {
      reward: {
        select: {
          id: true,
          name: true,
          description: true,
          pointsCost: true,
          rewardType: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get redemption history for a member
 */
export async function getMemberRedemptionHistory(
  memberId: string,
  merchantId: string,
  limit = 20
) {
  return prisma.redemptionRequest.findMany({
    where: {
      memberId,
      merchantId,
      status: { in: ['CONFIRMED', 'DECLINED', 'EXPIRED', 'CANCELLED'] },
    },
    include: {
      reward: {
        select: {
          id: true,
          name: true,
          pointsCost: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Cleanup expired redemption requests (called by cron)
 */
export async function cleanupExpiredRedemptions() {
  const result = await prisma.redemptionRequest.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  if (result.count > 0) {
    console.log(`[Redemption] Marked ${result.count} expired redemptions`);
  }

  return result.count;
}
