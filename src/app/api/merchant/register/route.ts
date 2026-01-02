import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";

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
 *   planType: 'BASIC_MONTHLY' | 'PREMIUM_MONTHLY' | 'BASIC_ANNUAL' | 'PREMIUM_ANNUAL';
 * }
 */
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

    // Determine initial subscription status based on plan
    // All plans start with TRIAL status when created via signup
    const subscriptionStatus = "TRIAL";

    // Create merchant and first business location
    // Password will be set later via setup-password flow
    const merchant = await prisma.merchant.create({
      data: {
        name,
        slug,
        loginEmail,
        // passwordHash omitted - will be set later via setup-password flow
        // subscriptionStatus will be updated by PayPal webhook
        subscriptionStatus,
        paymentVerified: false,
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

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        loginEmail: merchant.loginEmail,
        subscriptionStatus: merchant.subscriptionStatus,
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
