// src/app/lib/plan-limits.ts
// Centralized plan limits and member quota management

import { prisma } from '@/app/lib/prisma';

// Plan limits configuration
// Updated pricing structure (Jan 2026)
// Note: rewards = -1 means unlimited
export const PLAN_LIMITS = {
  STARTER: {
    members: 5,
    locations: 1,
    rewards: -1, // Unlimited rewards catalog
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
    directMessaging: false, // Can only send to all members
    pointsReminderEmails: false,
  },
  BASIC: {
    members: 150,
    locations: 1,
    rewards: -1, // Unlimited rewards catalog
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
    directMessaging: false, // Can only send to all members
    pointsReminderEmails: true, // Points reminder emails enabled
  },
  PREMIUM: {
    members: 500,
    locations: 3,
    rewards: -1, // Unlimited rewards catalog
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
    directMessaging: true, // Can message individual members
    pointsReminderEmails: true,
  },
  GROWTH: {
    members: 2000,
    locations: 10,
    rewards: -1, // Unlimited rewards catalog
    customTiers: true,
    multipleMilestones: true,
    customPointsRules: true,
    directMessaging: true,
    pointsReminderEmails: true,
  },
  PRO: {
    members: 35000,
    locations: 100,
    rewards: -1, // Unlimited rewards catalog
    customTiers: true,
    multipleMilestones: true,
    customPointsRules: true,
    directMessaging: true,
    pointsReminderEmails: true,
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
 * Returns -1 for unlimited
 */
export function getRewardLimit(plan: string): number {
  const limit = PLAN_LIMITS[plan as PlanType]?.rewards;
  // -1 means unlimited, return as-is
  if (limit === -1) return -1;
  return limit ?? PLAN_LIMITS.STARTER.rewards;
}

/**
 * Check if plan has unlimited rewards
 */
export function hasUnlimitedRewards(plan: string): boolean {
  return getRewardLimit(plan) === -1;
}

/**
 * Check if plan allows direct individual messaging
 */
export function canDirectMessage(plan: string): boolean {
  return PLAN_LIMITS[plan as PlanType]?.directMessaging ?? false;
}

/**
 * Check if plan has points reminder emails
 */
export function hasPointsReminderEmails(plan: string): boolean {
  return PLAN_LIMITS[plan as PlanType]?.pointsReminderEmails ?? false;
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
 * Note: -1 limit means unlimited (all rewards active)
 */
export async function getRewardVisibility(merchantId: string): Promise<{
  activeRewardIds: string[];
  greyedRewardIds: string[];
  limit: number;
  isUnlimited: boolean;
}> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { plan: true },
  });

  if (!merchant) {
    return { activeRewardIds: [], greyedRewardIds: [], limit: 0, isUnlimited: false };
  }

  const limit = getRewardLimit(merchant.plan);
  const isUnlimited = limit === -1;

  // Get all active rewards ordered by creation date
  const rewards = await prisma.reward.findMany({
    where: { merchantId, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  // If unlimited, all rewards are active
  if (isUnlimited) {
    return {
      activeRewardIds: rewards.map(r => r.id),
      greyedRewardIds: [],
      limit: -1,
      isUnlimited: true,
    };
  }

  const activeRewardIds = rewards.slice(0, limit).map(r => r.id);
  const greyedRewardIds = rewards.slice(limit).map(r => r.id);

  return { activeRewardIds, greyedRewardIds, limit, isUnlimited: false };
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
