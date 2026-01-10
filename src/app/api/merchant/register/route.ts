import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";
import { sendMerchantWelcomeEmail, sendAdminNewMerchantNotification } from "@/lib/email/notifications";
import { Plan, SubscriptionStatus } from "@prisma/client";

/**
 * POST /api/merchant/register
 *
 * Creates a new merchant account for signup flow
 * Note: Password will be set later via email verification
 *
 * Request body:
 * {
 *   name: string;
 *   slug: string;
 *   loginEmail: string;
 *   ownerName: string;
 *   phone?: string;
 *   address: string;
 *   planType: 'STARTER' | 'BASIC_MONTHLY' | 'PREMIUM_MONTHLY' | 'GROWTH_MONTHLY' | 'PRO_MONTHLY' | etc;
 * }
 *
 * Trial Logic:
 * - STARTER ($0): No trial, immediately active on Starter plan
 * - All paid plans: 7-day trial on selected plan, then downgrades to Starter if no payment
 */

// Map planType to plan enum
function getPlanFromPlanType(planType: string): Plan {
  const planMap: Record<string, Plan> = {
    'STARTER': Plan.STARTER,
    'BASIC_MONTHLY': Plan.BASIC,
    'BASIC_ANNUAL': Plan.BASIC,
    'PREMIUM_MONTHLY': Plan.PREMIUM,
    'PREMIUM_ANNUAL': Plan.PREMIUM,
    'GROWTH_MONTHLY': Plan.GROWTH,
    'GROWTH_ANNUAL': Plan.GROWTH,
    'PRO_MONTHLY': Plan.PRO,
    'PRO_ANNUAL': Plan.PRO,
  };
  return planMap[planType] || Plan.STARTER;
}
export async function POST(req: NextRequest) {
  try {
    const { name, slug, loginEmail, ownerName, phone, address, planType } = await req.json();

    // Validation
    if (!name || !slug || !loginEmail || !ownerName || !address || !planType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if merchant with this email already exists
    const existingMerchant = await prisma.merchant.findUnique({
      where: { loginEmail },
    });

    if (existingMerchant) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Check if slug is taken
    const existingSlug = await prisma.merchant.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      // Generate a unique slug by appending random string
      const randomSuffix = crypto.randomBytes(3).toString("hex");
      const uniqueSlug = `${slug}-${randomSuffix}`;

      return NextResponse.json(
        { error: `Slug '${slug}' is taken. Try '${uniqueSlug}' instead` },
        { status: 400 }
      );
    }

    // Determine plan and trial status based on selected planType
    const selectedPlan = getPlanFromPlanType(planType);
    const isStarterPlan = selectedPlan === Plan.STARTER;

    // Starter plan: No trial, immediately active
    // All paid plans: 7-day trial, then downgrade to Starter if no payment
    let subscriptionStatus: SubscriptionStatus;
    let trialEndsAt: Date | null = null;

    if (isStarterPlan) {
      subscriptionStatus = SubscriptionStatus.ACTIVE; // Starter is free, always active
    } else {
      subscriptionStatus = SubscriptionStatus.TRIAL;
      trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial
    }

    // Create merchant and first business location
    // Password will be set later via setup-password flow
    const merchant = await prisma.merchant.create({
      data: {
        name,
        slug,
        loginEmail,
        passwordHash: "", // Empty placeholder - will be set later via setup-password flow
        plan: selectedPlan,
        subscriptionStatus,
        trialEndsAt,
        paymentVerified: isStarterPlan, // Starter doesn't need payment verification
        businesses: {
          create: {
            name: name, // Use merchant name for first location
            slug: slug, // Use same slug for first business
            address: address,
            contactEmail: loginEmail,
          },
        },
      },
      include: {
        businesses: true,
      },
    });

    // Send welcome email (non-blocking)
    sendMerchantWelcomeEmail(merchant.loginEmail, {
      merchantName: ownerName || name,
      businessName: name,
      plan: selectedPlan,
      trialDays: isStarterPlan ? 0 : 7,
      trialEndsAt: trialEndsAt || new Date(),
    }).catch((err) => {
      console.error('[Merchant Register] Failed to send welcome email:', err);
    });

    // Send admin notification (non-blocking)
    sendAdminNewMerchantNotification({
      merchantName: ownerName || name,
      businessName: name,
      ownerEmail: merchant.loginEmail,
      plan: selectedPlan,
      isTrialing: !isStarterPlan,
      trialEndsAt: trialEndsAt || undefined,
    }).catch((err) => {
      console.error('[Merchant Register] Failed to send admin notification:', err);
    });

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        loginEmail: merchant.loginEmail,
        plan: merchant.plan,
        subscriptionStatus: merchant.subscriptionStatus,
        trialEndsAt: merchant.trialEndsAt,
        isTrialing: !isStarterPlan,
      },
    });
  } catch (error: any) {
    console.error("[Merchant Register] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to register merchant",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
