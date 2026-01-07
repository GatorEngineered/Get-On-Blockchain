import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { randomBytes } from "crypto";
import { sendStaffInviteEmail } from "@/lib/email/notifications";

/**
 * GET /api/merchant/staff
 * Get all staff members for the current merchant
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const staff = await prisma.staff.findMany({
      where: { merchantId },
      select: {
        id: true,
        email: true,
        fullName: true,
        canManageMembers: true,
        canViewReports: true,
        canManageSettings: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        inviteSentAt: true,
        inviteAcceptedAt: true,
        inviteExpiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Add status field for UI display
    const staffWithStatus = staff.map((s) => ({
      ...s,
      status: s.inviteAcceptedAt
        ? "active"
        : s.inviteExpiresAt && new Date() > s.inviteExpiresAt
        ? "expired"
        : "pending",
    }));

    return NextResponse.json({ staff: staffWithStatus });
  } catch (error: any) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant/staff
 * Create a new staff member and send email invitation
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Get merchant info for the invitation email
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true, loginEmail: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const { fullName, email, canManageMembers, canViewReports, canManageSettings } = await req.json();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check for existing staff
    const existing = await prisma.staff.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Staff member with this email already exists" },
        { status: 400 }
      );
    }

    // Generate secure invite token
    const inviteToken = randomBytes(32).toString("hex");
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 days to accept

    // Create staff record with pending invitation
    const staff = await prisma.staff.create({
      data: {
        merchantId,
        fullName,
        email,
        passwordHash: null, // Will be set when invite is accepted
        canManageMembers: canManageMembers ?? false,
        canViewReports: canViewReports ?? true,
        canManageSettings: canManageSettings ?? false,
        inviteToken,
        inviteExpiresAt,
        inviteSentAt: new Date(),
        invitedById: merchantId, // Track who invited them
      },
    });

    // Send invitation email
    const emailSent = await sendStaffInviteEmail({
      staffName: fullName,
      staffEmail: email,
      merchantName: merchant.name,
      inviterName: merchant.name, // Could be the merchant owner name
      inviteToken,
      expiresAt: inviteExpiresAt,
      permissions: {
        canManageMembers: canManageMembers ?? false,
        canViewReports: canViewReports ?? true,
        canManageSettings: canManageSettings ?? false,
      },
    });

    if (!emailSent) {
      console.warn(`[Staff] Email failed to send for ${email}, but invite was created`);
    }

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        email: staff.email,
        fullName: staff.fullName,
        canManageMembers: staff.canManageMembers,
        canViewReports: staff.canViewReports,
        canManageSettings: staff.canManageSettings,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        inviteSentAt: staff.inviteSentAt,
        inviteExpiresAt: staff.inviteExpiresAt,
        status: "pending",
      },
      emailSent,
    });
  } catch (error: any) {
    console.error("Add staff error:", error);

    let errorMessage = "Failed to add staff member";
    if (error.code === 'P2002') errorMessage = "Email already exists";
    else if (error.code === 'P2003') errorMessage = "Invalid merchant";
    else if (error.message) errorMessage = error.message;

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
