// API Route: Delete merchant's own account
// DELETE /api/merchant/delete-account

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getMerchantFromSession } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

/**
 * DELETE /api/merchant/delete-account
 *
 * Allows a merchant to permanently delete their account.
 * Requires password confirmation for security.
 *
 * Request body:
 * {
 *   password: string;        // Current password for confirmation
 *   confirmText: string;     // Must be "DELETE" to confirm
 * }
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated merchant
    const merchant = await getMerchantFromSession();
    if (!merchant) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { password, confirmText } = body;

    // Validate confirmation text
    if (confirmText !== "DELETE") {
      return NextResponse.json(
        { error: 'Please type "DELETE" to confirm account deletion' },
        { status: 400 }
      );
    }

    // Validate password
    if (!password) {
      return NextResponse.json(
        { error: "Password is required to delete your account" },
        { status: 400 }
      );
    }

    // Fetch full merchant record with password hash
    const fullMerchant = await prisma.merchant.findUnique({
      where: { id: merchant.id },
      select: {
        id: true,
        passwordHash: true,
        name: true,
        loginEmail: true,
      },
    });

    if (!fullMerchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, fullMerchant.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Log for audit purposes before deletion
    console.log(`[Account Deletion] Merchant ${fullMerchant.id} (${fullMerchant.name} - ${fullMerchant.loginEmail}) initiated self-deletion`);

    // Delete merchant - cascades will handle related records
    // Based on schema, these cascade automatically:
    // - Business (onDelete: Cascade)
    // - Staff (onDelete: Cascade)
    // - Events (onDelete: Cascade)
    // - MerchantMember (onDelete: Cascade)
    // - Rewards (onDelete: Cascade)
    // - MerchantToken (onDelete: Cascade)
    // - EventQRCode (onDelete: Cascade)
    // - ApiKey (onDelete: Cascade)
    // - ExternalOrder (onDelete: Cascade)
    // - PointsRule (onDelete: Cascade)
    // And their nested relations cascade from there

    await prisma.merchant.delete({
      where: { id: merchant.id },
    });

    console.log(`[Account Deletion] Merchant ${fullMerchant.id} successfully deleted`);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error: any) {
    console.error("[Account Deletion] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
