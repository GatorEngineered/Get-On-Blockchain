// src/app/lib/plan-limits.ts
// Centralized plan limits and member quota management

import { prisma } from '@/app/lib/prisma';

// Plan limits configuration
// Updated pricing structure (Jan 2026)
// Note: -1 means unlimited for members, locations, rewards, tokenSupply
// walletType: 'none' | 'non-custodial' | 'custodial' | 'hybrid'
export const PLAN_LIMITS = {
  STARTER: {
    members: 5,
    locations: 1, // Only Starter has location limit
    rewards: -1, // Unlimited rewards catalog
    maxTiers: 3, // Rookie, Soldier, General
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
    directMessaging: false, // Can only send to all members
    pointsReminderEmails: false,
    posIntegration: false, // No POS integration
    pointsPerDollar: false, // No points per dollar spent
    brandedToken: false, // No branded token
    tokenSupply: 0,
    walletType: 'none' as const,
  },
  BASIC: {
    members: 1000, // Increased from 150
    locations: -1, // Unlimited locations
    rewards: -1, // Unlimited rewards catalog
    maxTiers: 4, // Rookie, Soldier, Captain, General
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
    directMessaging: false, // Can only send to all members
    pointsReminderEmails: true, // Points reminder emails enabled
    posIntegration: false, // No POS integration
    pointsPerDollar: false, // No points per dollar spent
    brandedToken: false, // No branded token
    tokenSupply: 0,
    walletType: 'none' as const,
  },
  PREMIUM: {
    members: 25000, // Increased from 500
    locations: -1, // Unlimited locations
    rewards: -1, // Unlimited rewards catalog
    maxTiers: 6, // Rookie, Soldier, Sergeant, Captain, Major, General
    customTiers: false,
    multipleMilestones: false,
    customPointsRules: false,
    directMessaging: true, // Can message individual members
    pointsReminderEmails: true,
    posIntegration: true, // POS integration (Square, Toast, Clover, Shopify)
    pointsPerDollar: true, // Points per dollar spent
    brandedToken: false, // No branded token, USDC payouts only
    tokenSupply: 0,
    walletType: 'none' as const, // Uses standard USDC wallet connection
  },
  GROWTH: {
    members: 100000, // Increased from 2,000
    locations: -1, // Unlimited locations
    rewards: -1, // Unlimited rewards catalog
    maxTiers: 10, // Custom tiers allowed
    customTiers: true,
    multipleMilestones: true,
    customPointsRules: true,
    directMessaging: true,
    pointsReminderEmails: true,
    posIntegration: true, // POS integration (Square, Toast, Clover, Shopify)
    pointsPerDollar: true, // Points per dollar spent
    brandedToken: true, // Basic branded token (merchant name, basic design)
    tokenSupply: 1000000, // 1 million token supply
    walletType: 'non-custodial' as const, // Non-custodial for education
  },
  // PRO is internally called PRO but displayed as "Enterprise"
  PRO: {
    members: -1, // Unlimited members
    locations: -1, // Unlimited locations
    rewards: -1, // Unlimited rewards catalog
    maxTiers: 15, // Extended custom tiers
    customTiers: true,
    multipleMilestones: true,
    customPointsRules: true,
    directMessaging: true,
    pointsReminderEmails: true,
    posIntegration: true, // POS integration (Square, Toast, Clover, Shopify)
    pointsPerDollar: true, // Points per dollar spent
    brandedToken: true, // Full custom branded token
    tokenSupply: -1, // Unlimited token supply
    walletType: 'hybrid' as const, // Merchant chooses: custodial, non-custodial, or hybrid
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
 * Returns -1 for unlimited members
 */
export function getPlanMemberLimit(plan: string): number {
  const limit = PLAN_LIMITS[plan as PlanType]?.members;
  if (limit === undefined) return PLAN_LIMITS.STARTER.members;
  return limit; // Returns -1 for unlimited
}

/**
 * Get total member limit including addon slots
 * @param plan The merchant's current plan
 * @param additionalSlots Number of additional member slots purchased
 * Returns -1 for unlimited (PRO/Enterprise plan)
 */
export function getTotalMemberLimit(plan: string, additionalSlots: number = 0): number {
  const baseMemberLimit = getPlanMemberLimit(plan);
  // If unlimited, return -1 regardless of addons
  if (baseMemberLimit === -1) return -1;
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

  // Handle unlimited members (effectiveLimit === -1)
  const isUnlimited = effectiveLimit === -1;
  const remaining = isUnlimited ? -1 : Math.max(0, effectiveLimit - currentCount);
  const percentUsed = isUnlimited ? 0 : (effectiveLimit > 0 ? (currentCount / effectiveLimit) * 100 : 0);

  return {
    currentCount,
    baseLimit,
    addonSlots: merchant.additionalMemberSlots,
    addonMembers,
    totalLimit,
    effectiveLimit,
    remaining,
    percentUsed,
    isAtLimit: isUnlimited ? false : currentCount >= effectiveLimit,
    isNearLimit: isUnlimited ? false : percentUsed >= 80,
    inGracePeriod,
    gracePeriodDaysRemaining,
    canAddMembers: isUnlimited ? true : currentCount < effectiveLimit,
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

  // Unlimited plans (PRO/Enterprise) can always add members
  if (status.effectiveLimit === -1) {
    return { allowed: true, memberLimitStatus: status };
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
 * Check if plan has POS integration (Square, Toast, Clover, Shopify)
 */
export function hasPosIntegration(plan: string): boolean {
  return PLAN_LIMITS[plan as PlanType]?.posIntegration ?? false;
}

/**
 * Check if plan has points per dollar spent feature
 */
export function hasPointsPerDollar(plan: string): boolean {
  return PLAN_LIMITS[plan as PlanType]?.pointsPerDollar ?? false;
}

/**
 * Get location limit for a plan
 * Returns -1 for unlimited locations
 */
export function getLocationLimit(plan: string): number {
  const limit = PLAN_LIMITS[plan as PlanType]?.locations;
  if (limit === undefined) return PLAN_LIMITS.STARTER.locations;
  return limit; // Returns -1 for unlimited
}

/**
 * Check if plan has unlimited locations
 */
export function hasUnlimitedLocations(plan: string): boolean {
  return getLocationLimit(plan) === -1;
}

/**
 * Check if plan has branded token feature
 */
export function hasBrandedToken(plan: string): boolean {
  return PLAN_LIMITS[plan as PlanType]?.brandedToken ?? false;
}

/**
 * Get token supply limit for a plan
 * Returns -1 for unlimited, 0 for no tokens
 */
export function getTokenSupplyLimit(plan: string): number {
  return PLAN_LIMITS[plan as PlanType]?.tokenSupply ?? 0;
}

/**
 * Get wallet type for a plan
 */
export function getWalletType(plan: string): 'none' | 'non-custodial' | 'custodial' | 'hybrid' {
  return PLAN_LIMITS[plan as PlanType]?.walletType ?? 'none';
}

/**
 * Check if plan has unlimited members
 */
export function hasUnlimitedMembers(plan: string): boolean {
  return PLAN_LIMITS[plan as PlanType]?.members === -1;
}

/**
 * Check if plan has external API access (Premium+)
 * This includes: API keys, webhooks, widgets, product-specific points
 */
export function hasExternalApiAccess(plan: string): boolean {
  // PREMIUM, GROWTH, and PRO have API access
  return ['PREMIUM', 'GROWTH', 'PRO'].includes(plan);
}

/**
 * Check if plan has social engagement features (Premium+)
 * Allows members to earn points for social media actions
 */
export function hasSocialEngagement(plan: string): boolean {
  return ['PREMIUM', 'GROWTH', 'PRO'].includes(plan);
}

/**
 * Check if plan has product-specific points rules (Premium+)
 */
export function hasProductPointsRules(plan: string): boolean {
  return ['PREMIUM', 'GROWTH', 'PRO'].includes(plan);
}

/**
 * Get maximum number of tiers allowed for a plan
 * - STARTER: 3 tiers (Rookie, Soldier, General)
 * - BASIC: 4 tiers (Rookie, Soldier, Captain, General)
 * - PREMIUM: 6 tiers (Rookie, Soldier, Sergeant, Captain, Major, General)
 * - GROWTH: 10 tiers (custom)
 * - PRO: 15 tiers (custom)
 */
export function getMaxTiers(plan: string): number {
  return PLAN_LIMITS[plan as PlanType]?.maxTiers ?? 3;
}

/**
 * Check if plan allows custom tier names (GROWTH+ only)
 */
export function hasCustomTiers(plan: string): boolean {
  return PLAN_LIMITS[plan as PlanType]?.customTiers ?? false;
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
