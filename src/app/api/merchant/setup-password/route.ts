import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/merchant/setup-password
 *
 * Sets password for a newly registered merchant
 *
 * Request body:
 * {
 *   merchantId: string;
 *   password: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { merchantId, password } = await req.json();

    // Validation
    if (!merchantId || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one lowercase letter" },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number" },
        { status: 400 }
      );
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one special character" },
        { status: 400 }
      );
    }

    // Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Check if password is already set
    if (merchant.passwordHash) {
      return NextResponse.json(
        { error: "Password already set. Use password reset if you forgot your password." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update merchant with password
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password set successfully",
    });
  } catch (error: any) {
    console.error("[Setup Password] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to set password",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
