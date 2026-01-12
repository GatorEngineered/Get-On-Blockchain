// src/app/lib/plan-limits.ts
// Centralized plan limits and member quota management

import { prisma } from '@/app/lib/prisma';

// Plan limits configuration
// Updated pricing structure (Jan 2026)
export const PLAN_LIMITS = {
  STARTER: {
    members: 5,
    locations: 1,
    rewards: 1,
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
  },
  BASIC: {
    members: 150,
    locations: 1,
    rewards: 3,
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
  },
  PREMIUM: {
    members: 500,
    locations: 3,
    rewards: 7,
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
  },
  GROWTH: {
    members: 2000,
    locations: 10,
    rewards: 25,
    customTiers: true,
    multipleMilestones: true,
    customPointsRules: true,
  },
  PRO: {
    members: 35000,
    locations: 100,
    rewards: 100,
    customTiers: true,
    multipleMilestones: true,
    customPointsRules: true,
  },
} as const;

// Member addon pricing
export const MEMBER_ADDON = {
  price: 10, // $10 per slot
  membersPerSlot: 500, // 500 members per $10
};

// Grace period configuration
export const GRACE_PERIOD_DAYS = 15;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Get the base member limit for a plan
 */
export function getPlanMemberLimit(plan: string): number {
  return PLAN_LIMITS[plan as PlanType]?.members || PLAN_LIMITS.STARTER.members;
}

/**
 * Get total member limit including addon slots
 * @param plan The merchant's current plan
 * @param additionalSlots Number of additional member slots purchased
 */
export function getTotalMemberLimit(plan: string, additionalSlots: number = 0): number {
  const baseMemberLimit = getPlanMemberLimit(plan);
  const addonMembers = additionalSlots * MEMBER_ADDON.membersPerSlot;
  return baseMemberLimit + addonMembers;
}

/**
 * Check if merchant is in grace period after downgrade
 */
export function isInGracePeriod(gracePeriodEndsAt: Date | null): boolean {
  if (!gracePeriodEndsAt) return false;
  return new Date() < new Date(gracePeriodEndsAt);
}

/**
 * Get days remaining in grace period
 */
export function getGracePeriodDaysRemaining(gracePeriodEndsAt: Date | null): number {
  if (!gracePeriodEndsAt) return 0;
  const now = new Date();
  const end = new Date(gracePeriodEndsAt);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Get effective member limit (considers grace period)
 * During grace period, use the previous plan's limit
 */
export function getEffectiveMemberLimit(
  plan: string,
  additionalSlots: number,
  previousPlan: string | null,
  gracePeriodEndsAt: Date | null
): number {
  // If in grace period, use the higher of current or previous plan limit
  if (previousPlan && isInGracePeriod(gracePeriodEndsAt)) {
    const currentLimit = getTotalMemberLimit(plan, additionalSlots);
    const previousLimit = getPlanMemberLimit(previousPlan);
    return Math.max(currentLimit, previousLimit);
  }

  return getTotalMemberLimit(plan, additionalSlots);
}

/**
 * Get member limit status for a merchant
 */
export interface MemberLimitStatus {
  currentCount: number;
  baseLimit: number;
  addonSlots: number;
  addonMembers: number;
  totalLimit: number;
  effectiveLimit: number;
  remaining: number;
  percentUsed: number;
  isAtLimit: boolean;
  isNearLimit: boolean; // > 80% used
  inGracePeriod: boolean;
  gracePeriodDaysRemaining: number;
  canAddMembers: boolean;
  plan: string;
  previousPlan: string | null;
}

export async function getMemberLimitStatus(merchantId: string): Promise<MemberLimitStatus | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      plan: true,
      additionalMemberSlots: true,
      previousPlan: true,
      downgradeGracePeriodEndsAt: true,
    },
  });

  if (!merchant) return null;

  const currentCount = await prisma.merchantMember.count({
    where: { merchantId },
  });

  const baseLimit = getPlanMemberLimit(merchant.plan);
  const addonMembers = merchant.additionalMemberSlots * MEMBER_ADDON.membersPerSlot;
  const totalLimit = getTotalMemberLimit(merchant.plan, merchant.additionalMemberSlots);
  const effectiveLimit = getEffectiveMemberLimit(
    merchant.plan,
    merchant.additionalMemberSlots,
    merchant.previousPlan,
    merchant.downgradeGracePeriodEndsAt
  );
  const inGracePeriod = isInGracePeriod(merchant.downgradeGracePeriodEndsAt);
  const gracePeriodDaysRemaining = getGracePeriodDaysRemaining(merchant.downgradeGracePeriodEndsAt);

  const remaining = Math.max(0, effectiveLimit - currentCount);
  const percentUsed = effectiveLimit > 0 ? (currentCount / effectiveLimit) * 100 : 0;

  return {
    currentCount,
    baseLimit,
    addonSlots: merchant.additionalMemberSlots,
    addonMembers,
    totalLimit,
    effectiveLimit,
    remaining,
    percentUsed,
    isAtLimit: currentCount >= effectiveLimit,
    isNearLimit: percentUsed >= 80,
    inGracePeriod,
    gracePeriodDaysRemaining,
    canAddMembers: currentCount < effectiveLimit,
    plan: merchant.plan,
    previousPlan: merchant.previousPlan,
  };
}

/**
 * Check if a new member can be added (for scan routes)
 * Returns { allowed: boolean, reason?: string }
 */
export async function canAddNewMember(merchantId: string): Promise<{
  allowed: boolean;
  reason?: string;
  memberLimitStatus?: MemberLimitStatus;
}> {
  const status = await getMemberLimitStatus(merchantId);

  if (!status) {
    return { allowed: false, reason: 'Merchant not found' };
  }

  // Starter plan: strict limit, no addons, no grace period
  if (status.plan === 'STARTER' && status.currentCount >= status.baseLimit) {
    return {
      allowed: false,
      reason: `This business is on a free Starter plan with a limit of ${status.baseLimit} members. Please ask them to upgrade for more members.`,
      memberLimitStatus: status,
    };
  }

  // Other plans: check effective limit (includes grace period)
  if (!status.canAddMembers) {
    return {
      allowed: false,
      reason: `This merchant has reached their member limit (${status.effectiveLimit.toLocaleString()}). Please ask them to upgrade or purchase additional member slots.`,
      memberLimitStatus: status,
    };
  }

  return { allowed: true, memberLimitStatus: status };
}

/**
 * Get reward limit for a plan
 */
export function getRewardLimit(plan: string): number {
  return PLAN_LIMITS[plan as PlanType]?.rewards || PLAN_LIMITS.STARTER.rewards;
}

/**
 * Get location limit for a plan
 */
export function getLocationLimit(plan: string): number {
  return PLAN_LIMITS[plan as PlanType]?.locations || PLAN_LIMITS.STARTER.locations;
}

/**
 * Check if a reward is over the plan limit
 * Used to determine if reward should be greyed out
 */
export async function getRewardVisibility(merchantId: string): Promise<{
  activeRewardIds: string[];
  greyedRewardIds: string[];
  limit: number;
}> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { plan: true },
  });

  if (!merchant) {
    return { activeRewardIds: [], greyedRewardIds: [], limit: 0 };
  }

  const limit = getRewardLimit(merchant.plan);

  // Get all active rewards ordered by creation date
  const rewards = await prisma.reward.findMany({
    where: { merchantId, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  const activeRewardIds = rewards.slice(0, limit).map(r => r.id);
  const greyedRewardIds = rewards.slice(limit).map(r => r.id);

  return { activeRewardIds, greyedRewardIds, limit };
}

/**
 * Handle plan downgrade - set grace period
 */
export async function handlePlanDowngrade(
  merchantId: string,
  oldPlan: string,
  newPlan: string
): Promise<void> {
  // Only set grace period if downgrading (not upgrading)
  const oldLimit = getPlanMemberLimit(oldPlan);
  const newLimit = getPlanMemberLimit(newPlan);

  if (newLimit < oldLimit) {
    const gracePeriodEndsAt = new Date();
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS);

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        previousPlan: oldPlan,
        downgradeGracePeriodEndsAt: gracePeriodEndsAt,
      },
    });
  }
}

/**
 * Clear grace period (when merchant upgrades or grace period expires)
 */
export async function clearGracePeriod(merchantId: string): Promise<void> {
  await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      previousPlan: null,
      downgradeGracePeriodEndsAt: null,
    },
  });
}

/**
 * Calculate cost for additional member slots
 */
export function calculateAddonCost(slotsNeeded: number): {
  slots: number;
  membersAdded: number;
  cost: number;
} {
  return {
    slots: slotsNeeded,
    membersAdded: slotsNeeded * MEMBER_ADDON.membersPerSlot,
    cost: slotsNeeded * MEMBER_ADDON.price,
  };
}
