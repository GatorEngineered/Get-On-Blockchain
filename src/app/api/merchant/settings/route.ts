// src/app/api/merchant/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { checkAndUpdateTrialStatus, getTrialDaysRemaining } from '@/app/lib/trial';
import { getMemberLimitStatus, MEMBER_ADDON, getLocationLimit, getRewardLimit } from '@/app/lib/plan-limits';

/**
 * GET /api/merchant/settings
 *
 * Fetch merchant data for settings page
 */
export async function GET(req: NextRequest) {
  try {
    // Get merchant session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check and update trial status (downgrades to Starter if trial expired)
    await checkAndUpdateTrialStatus(merchantId);

    // Fetch merchant with all businesses (after trial check)
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Separate main business from additional locations
    const mainBusiness = merchant.businesses[0];
    const additionalLocations = merchant.businesses.slice(1);

    // Calculate trial info
    const isTrialing = merchant.subscriptionStatus === 'TRIAL';
    const trialDaysRemaining = getTrialDaysRemaining(merchant.trialEndsAt);

    // Get member limit status with warnings
    const memberLimitStatus = await getMemberLimitStatus(merchantId);

    // Get plan limits
    const locationLimit = getLocationLimit(merchant.plan);
    const rewardLimit = getRewardLimit(merchant.plan);

    // Build warnings array
    const warnings: string[] = [];

    if (memberLimitStatus) {
      if (memberLimitStatus.isAtLimit) {
        warnings.push(`You've reached your member limit (${memberLimitStatus.effectiveLimit.toLocaleString()}). New members cannot join until you upgrade or purchase additional slots.`);
      } else if (memberLimitStatus.isNearLimit) {
        warnings.push(`You're approaching your member limit (${memberLimitStatus.percentUsed.toFixed(0)}% used). Consider upgrading or purchasing additional member slots.`);
      }

      if (memberLimitStatus.inGracePeriod) {
        warnings.push(`You have ${memberLimitStatus.gracePeriodDaysRemaining} days left in your grace period before new restrictions take effect.`);
      }
    }

    if (merchant.businesses.length >= locationLimit) {
      warnings.push(`You've reached your location limit (${locationLimit}). Upgrade to add more locations.`);
    }

    return NextResponse.json({
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
      loginEmail: merchant.loginEmail,
      plan: merchant.plan,
      subscriptionStatus: merchant.subscriptionStatus,
      paymentVerified: merchant.paymentVerified,
      // Trial info
      isTrialing,
      trialEndsAt: merchant.trialEndsAt,
      trialDaysRemaining,
      // Plan limits
      planLimits: {
        members: memberLimitStatus?.effectiveLimit || 0,
        locations: locationLimit,
        rewards: rewardLimit,
      },
      // Member limit status with warnings
      memberLimitStatus: memberLimitStatus ? {
        currentCount: memberLimitStatus.currentCount,
        baseLimit: memberLimitStatus.baseLimit,
        addonSlots: memberLimitStatus.addonSlots,
        addonMembers: memberLimitStatus.addonMembers,
        totalLimit: memberLimitStatus.totalLimit,
        effectiveLimit: memberLimitStatus.effectiveLimit,
        remaining: memberLimitStatus.remaining,
        percentUsed: memberLimitStatus.percentUsed,
        isAtLimit: memberLimitStatus.isAtLimit,
        isNearLimit: memberLimitStatus.isNearLimit,
        inGracePeriod: memberLimitStatus.inGracePeriod,
        gracePeriodDaysRemaining: memberLimitStatus.gracePeriodDaysRemaining,
        canAddMembers: memberLimitStatus.canAddMembers,
      } : null,
      // Addon purchase info
      memberAddon: {
        pricePerSlot: MEMBER_ADDON.price,
        membersPerSlot: MEMBER_ADDON.membersPerSlot,
        canPurchase: merchant.plan !== 'STARTER',
      },
      // System warnings
      warnings,
      mainBusiness: mainBusiness ? {
        id: mainBusiness.id,
        name: mainBusiness.name,
        address: mainBusiness.address,
        suite: mainBusiness.suite,
        city: mainBusiness.city,
        state: mainBusiness.state,
        zipCode: mainBusiness.zipCode,
      } : null,
      additionalLocations: additionalLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        locationNickname: loc.locationNickname,
        address: loc.address,
        suite: loc.suite,
        city: loc.city,
        state: loc.state,
        zipCode: loc.zipCode,
      })),
      // All businesses (for QR codes)
      businesses: merchant.businesses.map(biz => ({
        id: biz.id,
        slug: biz.slug,
        name: biz.name,
        locationNickname: biz.locationNickname,
        address: biz.address,
        suite: biz.suite,
        city: biz.city,
        state: biz.state,
        zipCode: biz.zipCode,
      })),
      // Payout settings
      payoutEnabled: merchant.payoutEnabled,
      payoutWalletAddress: merchant.payoutWalletAddress,
      payoutMilestonePoints: merchant.payoutMilestonePoints,
      payoutAmountUSD: merchant.payoutAmountUSD,
      // Reward tier settings
      welcomePoints: merchant.welcomePoints,
      earnPerVisit: merchant.earnPerVisit,
      vipThreshold: merchant.vipThreshold,
      superThreshold: merchant.superThreshold,
      customTierThresholds: merchant.customTierThresholds,
      // Email settings
      notificationEmail: merchant.notificationEmail,
      // Referral settings
      referralEnabled: merchant.referralEnabled,
      referralPointsValue: merchant.referralPointsValue,
      // Happy Hour settings
      happyHourEnabled: merchant.happyHourEnabled,
      happyHourMultiplier: merchant.happyHourMultiplier,
      happyHourStartTime: merchant.happyHourStartTime,
      happyHourEndTime: merchant.happyHourEndTime,
      happyHourDaysOfWeek: merchant.happyHourDaysOfWeek,
      happyHourTimezone: merchant.happyHourTimezone,
      // Social Links
      instagramUrl: merchant.instagramUrl,
      facebookUrl: merchant.facebookUrl,
      twitterUrl: merchant.twitterUrl,
      tiktokUrl: merchant.tiktokUrl,
    });
  } catch (error: any) {
    console.error('[Merchant Settings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/merchant/settings
 *
 * Update merchant settings (referral settings, etc.)
 */
export async function PUT(req: NextRequest) {
  try {
    // Get merchant session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const {
      referralEnabled,
      referralPointsValue,
      // Happy Hour settings
      happyHourEnabled,
      happyHourMultiplier,
      happyHourStartTime,
      happyHourEndTime,
      happyHourDaysOfWeek,
      happyHourTimezone,
      // Social Links
      instagramUrl,
      facebookUrl,
      twitterUrl,
      tiktokUrl,
      // POS Settings
      posPointsPerDollar,
    } = body;

    // Build update data (only include fields that are provided)
    const updateData: any = {};

    if (typeof referralEnabled === 'boolean') {
      updateData.referralEnabled = referralEnabled;
    }

    if (typeof referralPointsValue === 'number') {
      // Validate points value
      if (referralPointsValue < 1 || referralPointsValue > 1000) {
        return NextResponse.json(
          { error: 'Referral points value must be between 1 and 1000' },
          { status: 400 }
        );
      }
      updateData.referralPointsValue = referralPointsValue;
    }

    // Happy Hour settings
    if (typeof happyHourEnabled === 'boolean') {
      updateData.happyHourEnabled = happyHourEnabled;
    }

    if (typeof happyHourMultiplier === 'number') {
      if (happyHourMultiplier < 1 || happyHourMultiplier > 10) {
        return NextResponse.json(
          { error: 'Happy Hour multiplier must be between 1 and 10' },
          { status: 400 }
        );
      }
      updateData.happyHourMultiplier = happyHourMultiplier;
    }

    if (typeof happyHourStartTime === 'string') {
      // Validate time format (HH:mm)
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(happyHourStartTime)) {
        return NextResponse.json(
          { error: 'Invalid start time format. Use HH:mm (e.g., 14:00)' },
          { status: 400 }
        );
      }
      updateData.happyHourStartTime = happyHourStartTime;
    }

    if (typeof happyHourEndTime === 'string') {
      // Validate time format (HH:mm)
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(happyHourEndTime)) {
        return NextResponse.json(
          { error: 'Invalid end time format. Use HH:mm (e.g., 17:00)' },
          { status: 400 }
        );
      }
      updateData.happyHourEndTime = happyHourEndTime;
    }

    if (Array.isArray(happyHourDaysOfWeek)) {
      // Validate days (0-6)
      const validDays = happyHourDaysOfWeek.every(
        (d) => typeof d === 'number' && d >= 0 && d <= 6
      );
      if (!validDays) {
        return NextResponse.json(
          { error: 'Invalid days of week. Use 0-6 (0=Sunday, 6=Saturday)' },
          { status: 400 }
        );
      }
      updateData.happyHourDaysOfWeek = happyHourDaysOfWeek;
    }

    if (typeof happyHourTimezone === 'string') {
      updateData.happyHourTimezone = happyHourTimezone;
    }

    // Social Links (accept string or null to clear)
    if (instagramUrl !== undefined) {
      updateData.instagramUrl = instagramUrl || null;
    }
    if (facebookUrl !== undefined) {
      updateData.facebookUrl = facebookUrl || null;
    }
    if (twitterUrl !== undefined) {
      updateData.twitterUrl = twitterUrl || null;
    }
    if (tiktokUrl !== undefined) {
      updateData.tiktokUrl = tiktokUrl || null;
    }

    // POS Points per Dollar (allow decimals, e.g. 0.5 points per dollar)
    if (typeof posPointsPerDollar === 'number') {
      if (posPointsPerDollar < 0.01 || posPointsPerDollar > 100) {
        return NextResponse.json(
          { error: 'Points per dollar must be between 0.01 and 100' },
          { status: 400 }
        );
      }
      updateData.posPointsPerDollar = posPointsPerDollar;
    }

    // Update merchant settings
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        id: true,
        referralEnabled: true,
        referralPointsValue: true,
        happyHourEnabled: true,
        happyHourMultiplier: true,
        happyHourStartTime: true,
        happyHourEndTime: true,
        happyHourDaysOfWeek: true,
        happyHourTimezone: true,
        instagramUrl: true,
        facebookUrl: true,
        twitterUrl: true,
        tiktokUrl: true,
        posPointsPerDollar: true,
      },
    });

    console.log(`[Merchant Settings] Updated settings for merchant ${merchantId}`);

    return NextResponse.json({
      success: true,
      referralEnabled: merchant.referralEnabled,
      referralPointsValue: merchant.referralPointsValue,
      happyHourEnabled: merchant.happyHourEnabled,
      happyHourMultiplier: merchant.happyHourMultiplier,
      happyHourStartTime: merchant.happyHourStartTime,
      happyHourEndTime: merchant.happyHourEndTime,
      happyHourDaysOfWeek: merchant.happyHourDaysOfWeek,
      happyHourTimezone: merchant.happyHourTimezone,
      instagramUrl: merchant.instagramUrl,
      facebookUrl: merchant.facebookUrl,
      twitterUrl: merchant.twitterUrl,
      tiktokUrl: merchant.tiktokUrl,
      posPointsPerDollar: merchant.posPointsPerDollar,
    });
  } catch (error: any) {
    console.error('[Merchant Settings] Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}
