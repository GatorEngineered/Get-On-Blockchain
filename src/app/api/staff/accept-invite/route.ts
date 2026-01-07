import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/staff/accept-invite?token=xxx
 * Validate invite token and get staff/merchant info
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        email: true,
        fullName: true,
        inviteExpiresAt: true,
        inviteAcceptedAt: true,
        canManageMembers: true,
        canViewReports: true,
        canManageSettings: true,
        merchant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Invalid invite token", code: "INVALID_TOKEN" },
        { status: 404 }
      );
    }

    // Check if invite already accepted
    if (staff.inviteAcceptedAt) {
      return NextResponse.json(
        { error: "This invitation has already been accepted", code: "ALREADY_ACCEPTED" },
        { status: 400 }
      );
    }

    // Check if invite expired
    if (staff.inviteExpiresAt && new Date() > staff.inviteExpiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired", code: "EXPIRED" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      staffName: staff.fullName,
      staffEmail: staff.email,
      merchantName: staff.merchant.name,
      permissions: {
        canManageMembers: staff.canManageMembers,
        canViewReports: staff.canViewReports,
        canManageSettings: staff.canManageSettings,
      },
      expiresAt: staff.inviteExpiresAt,
    });
  } catch (error: any) {
    console.error("Validate invite error:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff/accept-invite
 * Accept invitation and set password
 */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { inviteToken: token },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    // Check if invite already accepted
    if (staff.inviteAcceptedAt) {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 400 }
      );
    }

    // Check if invite expired
    if (staff.inviteExpiresAt && new Date() > staff.inviteExpiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired. Please contact your manager for a new invite." },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update staff record
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        passwordHash,
        inviteAcceptedAt: new Date(),
        inviteToken: null, // Clear token after use for security
        isActive: true,
      },
    });

    console.log(`[Staff] Invite accepted for ${staff.email} at ${staff.merchant.name}`);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      merchantName: staff.merchant.name,
      merchantSlug: staff.merchant.slug,
    });
  } catch (error: any) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
