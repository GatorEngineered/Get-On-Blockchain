// src/app/lib/trial.ts
// Trial management utilities

import { prisma } from '@/app/lib/prisma';
import { sendTrialExpiringEmail } from '@/lib/email/notifications';

/**
 * Check if a merchant's trial has expired
 */
export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return new Date() > new Date(trialEndsAt);
}

/**
 * Get trial days remaining
 */
export function getTrialDaysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const now = new Date();
  const end = new Date(trialEndsAt);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check and update merchant trial status
 * If trial has expired and no active subscription, downgrade to STARTER
 * Returns the updated merchant data
 */
export async function checkAndUpdateTrialStatus(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      paypalSubscriptionId: true,
      paymentVerified: true,
    },
  });

  if (!merchant) {
    return null;
  }

  // Only check merchants who are in TRIAL status
  if (merchant.subscriptionStatus !== 'TRIAL') {
    return merchant;
  }

  // Check if trial has expired
  if (merchant.trialEndsAt && isTrialExpired(merchant.trialEndsAt)) {
    // Trial expired - check if they have an active PayPal subscription
    if (merchant.paypalSubscriptionId && merchant.paymentVerified) {
      // They have a subscription, update to ACTIVE
      const updated = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          subscriptionStatus: 'ACTIVE',
        },
      });
      return updated;
    } else {
      // No subscription - downgrade to STARTER plan
      const updated = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          plan: 'STARTER',
          subscriptionStatus: 'EXPIRED',
          // Keep trial end date for record
        },
      });

      console.log(`[Trial] Merchant ${merchantId} trial expired, downgraded to STARTER`);
      return updated;
    }
  }

  return merchant;
}

/**
 * Batch process expired trials
 * Can be called by a cron job or scheduled task
 */
export async function processExpiredTrials() {
  const now = new Date();

  // Find all merchants with expired trials who haven't been downgraded
  const expiredTrials = await prisma.merchant.findMany({
    where: {
      subscriptionStatus: 'TRIAL',
      trialEndsAt: {
        lt: now,
      },
      paymentVerified: false, // No verified payment
    },
    select: {
      id: true,
      name: true,
      loginEmail: true,
    },
  });

  console.log(`[Trial] Processing ${expiredTrials.length} expired trials`);

  const results = {
    processed: 0,
    errors: [] as string[],
  };

  for (const merchant of expiredTrials) {
    try {
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          plan: 'STARTER',
          subscriptionStatus: 'EXPIRED',
        },
      });
      results.processed++;
      console.log(`[Trial] Downgraded ${merchant.name} (${merchant.loginEmail}) to STARTER`);
    } catch (error: any) {
      results.errors.push(`Failed to process ${merchant.id}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Trial feature check - returns whether a feature is available
 * During trial, merchants get Premium features
 * After trial/on Starter, features are restricted
 */
export function getTrialFeatureAccess(
  plan: string,
  subscriptionStatus: string,
  trialEndsAt: Date | null
): {
  effectivePlan: string;
  isTrialing: boolean;
  trialDaysRemaining: number;
  hasFullAccess: boolean;
} {
  const isTrialing = subscriptionStatus === 'TRIAL' && !isTrialExpired(trialEndsAt);
  const trialDaysRemaining = getTrialDaysRemaining(trialEndsAt);

  // During active trial, give Premium access
  if (isTrialing) {
    return {
      effectivePlan: 'PREMIUM',
      isTrialing: true,
      trialDaysRemaining,
      hasFullAccess: true,
    };
  }

  // After trial or with subscription, use actual plan
  return {
    effectivePlan: plan,
    isTrialing: false,
    trialDaysRemaining: 0,
    hasFullAccess: ['PREMIUM', 'GROWTH', 'PRO'].includes(plan),
  };
}

/**
 * Send trial expiring emails to merchants whose trials are ending soon
 * Call this from a cron job daily
 * Sends emails at 7 days, 3 days, and 1 day before expiration
 */
export async function sendTrialExpiringEmails() {
  const now = new Date();
  const results = {
    sent: 0,
    errors: [] as string[],
  };

  // Find merchants in trial with upcoming expiration
  const trialing = await prisma.merchant.findMany({
    where: {
      subscriptionStatus: 'TRIAL',
      trialEndsAt: { not: null },
      paymentVerified: false,
    },
    select: {
      id: true,
      name: true,
      loginEmail: true,
      plan: true,
      trialEndsAt: true,
      lastTrialEmailSent: true,
    },
  });

  for (const merchant of trialing) {
    if (!merchant.trialEndsAt) continue;

    const daysRemaining = getTrialDaysRemaining(merchant.trialEndsAt);

    // Send emails at 7, 3, and 1 day(s) remaining
    const emailDays = [7, 3, 1];
    if (!emailDays.includes(daysRemaining)) continue;

    // Check if we already sent an email for this threshold
    // lastTrialEmailSent stores the last day count we sent an email for
    const lastSent = merchant.lastTrialEmailSent;
    if (lastSent && lastSent <= daysRemaining) continue;

    try {
      await sendTrialExpiringEmail(merchant.loginEmail, {
        merchantName: merchant.name,
        daysRemaining,
        trialEndsAt: merchant.trialEndsAt,
        currentPlan: merchant.plan,
      });

      // Update last email sent marker
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { lastTrialEmailSent: daysRemaining },
      });

      results.sent++;
      console.log(`[Trial] Sent expiring email to ${merchant.loginEmail} (${daysRemaining} days remaining)`);
    } catch (error: any) {
      results.errors.push(`Failed to email ${merchant.loginEmail}: ${error.message}`);
    }
  }

  return results;
}
