import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/merchant/auth/login
 *
 * Unified login endpoint for merchants and staff
 * Automatically detects user type based on email
 *
 * Request body:
 * {
 *   email: string;
 *   password: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // First, try to find a merchant with this email
    const merchant = await prisma.merchant.findUnique({
      where: { loginEmail: email },
      select: {
        id: true,
        loginEmail: true,
        passwordHash: true,
        name: true,
        slug: true,
        subscriptionStatus: true,
      },
    });

    if (merchant) {
      // Merchant login flow
      if (!merchant.passwordHash) {
        return NextResponse.json(
          { error: "Password not set. Please complete your account setup." },
          { status: 401 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, merchant.passwordHash);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Create session data for merchant (owner)
      const sessionData = {
        merchantId: merchant.id,
        email: merchant.loginEmail,
        name: merchant.name,
        role: "owner",
        permissions: {
          canManageMembers: true,
          canViewReports: true,
          canManageSettings: true,
        },
      };

      const response = NextResponse.json({
        success: true,
        userType: "merchant",
        merchant: {
          id: merchant.id,
          name: merchant.name,
          email: merchant.loginEmail,
          slug: merchant.slug,
          subscriptionStatus: merchant.subscriptionStatus,
        },
      });

      response.cookies.set("gob_merchant_session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    // If not a merchant, try to find staff with this email
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if staff account is active
    if (!staff.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact your manager." },
        { status: 401 }
      );
    }

    // Check if staff has accepted their invitation
    if (!staff.passwordHash) {
      if (staff.inviteAcceptedAt === null) {
        return NextResponse.json(
          { error: "Please accept your invitation first by clicking the link in your email." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Password not set. Please contact your manager." },
        { status: 401 }
      );
    }

    // Verify staff password
    const isPasswordValid = await bcrypt.compare(password, staff.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session data for staff
    const sessionData = {
      merchantId: staff.merchant.id,
      staffId: staff.id,
      email: staff.email,
      name: staff.fullName,
      role: "staff",
      permissions: {
        canManageMembers: staff.canManageMembers,
        canViewReports: staff.canViewReports,
        canManageSettings: staff.canManageSettings,
      },
    };

    const response = NextResponse.json({
      success: true,
      userType: "staff",
      staff: {
        id: staff.id,
        name: staff.fullName,
        email: staff.email,
        permissions: {
          canManageMembers: staff.canManageMembers,
          canViewReports: staff.canViewReports,
          canManageSettings: staff.canManageSettings,
        },
      },
      merchant: {
        id: staff.merchant.id,
        name: staff.merchant.name,
        slug: staff.merchant.slug,
        subscriptionStatus: staff.merchant.subscriptionStatus,
      },
    });

    response.cookies.set("gob_merchant_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Login] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Login failed",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
