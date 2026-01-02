import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/merchant/auth/login
 *
 * Merchant login endpoint
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

    // Find merchant by email
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

    if (!merchant) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if password is set
    if (!merchant.passwordHash) {
      return NextResponse.json(
        { error: "Password not set. Please complete your account setup." },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, merchant.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session data (JSON format matching existing dashboard expectations)
    const sessionData = {
      merchantId: merchant.id,
      email: merchant.loginEmail,
      name: merchant.name,
    };

    // Create response
    const response = NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.loginEmail,
        slug: merchant.slug,
        subscriptionStatus: merchant.subscriptionStatus,
      },
    });

    // Set HTTP-only cookie with session data (matching existing format)
    response.cookies.set("gob_merchant_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Merchant Login] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Login failed",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
