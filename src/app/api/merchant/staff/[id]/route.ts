import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { randomBytes } from "crypto";
import { sendStaffInviteEmail } from "@/lib/email/notifications";

/**
 * Helper to get merchant ID from session
 */
async function getMerchantIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("gob_merchant_session");

  if (!session?.value) return null;

  try {
    const sessionData = JSON.parse(session.value);
    return sessionData.merchantId || null;
  } catch {
    return null;
  }
}

/**
 * PUT /api/merchant/staff/[id]
 * Update staff member permissions
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantId = await getMerchantIdFromSession();
    if (!merchantId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const updates = await req.json();

    // Verify staff belongs to this merchant
    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff || staff.merchantId !== merchantId) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        canManageMembers: updates.canManageMembers ?? staff.canManageMembers,
        canViewReports: updates.canViewReports ?? staff.canViewReports,
        canManageSettings: updates.canManageSettings ?? staff.canManageSettings,
        isActive: updates.isActive ?? staff.isActive,
      },
    });

    return NextResponse.json({ success: true, staff: updatedStaff });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchant/staff/[id]
 * Delete a staff member
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantId = await getMerchantIdFromSession();
    if (!merchantId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify staff belongs to this merchant
    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff || staff.merchantId !== merchantId) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant/staff/[id]
 * Resend invitation email to staff member
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantId = await getMerchantIdFromSession();
    if (!merchantId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { action } = await req.json();

    if (action !== "resend-invite") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // Get staff member
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        merchant: {
          select: { name: true },
        },
      },
    });

    if (!staff || staff.merchantId !== merchantId) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Check if invite was already accepted
    if (staff.inviteAcceptedAt) {
      return NextResponse.json(
        { error: "This staff member has already accepted their invitation" },
        { status: 400 }
      );
    }

    // Generate new invite token
    const inviteToken = randomBytes(32).toString("hex");
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

    // Update staff with new token
    await prisma.staff.update({
      where: { id },
      data: {
        inviteToken,
        inviteExpiresAt,
        inviteSentAt: new Date(),
      },
    });

    // Send invitation email
    const emailSent = await sendStaffInviteEmail({
      staffName: staff.fullName,
      staffEmail: staff.email,
      merchantName: staff.merchant.name,
      inviterName: staff.merchant.name,
      inviteToken,
      expiresAt: inviteExpiresAt,
      permissions: {
        canManageMembers: staff.canManageMembers,
        canViewReports: staff.canViewReports,
        canManageSettings: staff.canManageSettings,
      },
    });

    console.log(`[Staff] Resent invitation to ${staff.email}`);

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? "Invitation email sent successfully"
        : "Staff updated but email failed to send",
    });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}
