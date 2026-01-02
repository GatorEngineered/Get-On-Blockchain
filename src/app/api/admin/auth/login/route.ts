// Admin login API endpoint
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ADMIN_CONFIG } from "@/app/lib/adminAuth";
import { logAdminAction } from "@/app/lib/adminAudit";
import { adminLoginLimiter, checkRateLimit } from "@/app/lib/ratelimit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                req.headers.get("x-real-ip") ||
                "unknown";

    // Check rate limit
    const rateLimitResult = await checkRateLimit(ip, adminLoginLimiter);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if admin is active
    if (!admin.isActive) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Log the login action
    await logAdminAction({
      adminId: admin.id,
      action: "LOGIN",
      entityType: "Auth",
    });

    // Create response with session cookie
    const res = NextResponse.json({ success: true });

    res.cookies.set(ADMIN_CONFIG.SESSION_COOKIE_NAME, admin.id, {
      httpOnly: true,
      secure: false, // Set to false for development (localhost)
      sameSite: "lax",
      path: "/", // Changed to "/" to ensure cookie works
      maxAge: ADMIN_CONFIG.SESSION_MAX_AGE,
    });

    return res;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
