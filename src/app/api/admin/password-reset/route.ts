// Admin API: Manual password reset for merchants, staff, and admins
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSuperAdmin } from "@/app/lib/adminAuth";
import { logAdminAction } from "@/app/lib/adminAudit";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

// Generate a random temporary password
function generateTempPassword(): string {
  const length = 10;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function POST(req: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminOrSuperAdmin();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = await req.json();
    const { email, userType } = body;

    if (!email || !userType) {
      return NextResponse.json(
        { error: "Email and user type are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let updated = false;
    let entityId = "";

    // Update password based on user type
    if (userType === "MERCHANT") {
      const merchant = await prisma.merchant.findUnique({
        where: { loginEmail: normalizedEmail },
      });

      if (!merchant) {
        return NextResponse.json(
          { error: "Merchant not found with this email" },
          { status: 404 }
        );
      }

      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { passwordHash },
      });

      entityId = merchant.id;
      updated = true;
    } else if (userType === "STAFF") {
      const staff = await prisma.staff.findUnique({
        where: { email: normalizedEmail },
      });

      if (!staff) {
        return NextResponse.json(
          { error: "Staff member not found with this email" },
          { status: 404 }
        );
      }

      await prisma.staff.update({
        where: { id: staff.id },
        data: { passwordHash },
      });

      entityId = staff.id;
      updated = true;
    } else if (userType === "ADMIN") {
      const admin = await prisma.admin.findUnique({
        where: { email: normalizedEmail },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Admin not found with this email" },
          { status: 404 }
        );
      }

      await prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash },
      });

      entityId = admin.id;
      updated = true;
    } else {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      );
    }

    if (updated) {
      // Log the action
      await logAdminAction({
        adminId: authResult.admin.id,
        action: "SEND_PASSWORD_RESET",
        entityType: userType === "MERCHANT" ? "Merchant" : userType === "STAFF" ? "Staff" : "Admin",
        entityId,
        changes: {
          after: { email: normalizedEmail, method: "manual_reset" },
        },
      });

      return NextResponse.json({
        success: true,
        tempPassword,
        email: normalizedEmail,
      });
    }

    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
