// Admin logout API endpoint
import { NextResponse } from "next/server";
import { getCurrentAdmin, ADMIN_CONFIG } from "@/app/lib/adminAuth";
import { logAdminAction } from "@/app/lib/adminAudit";

export async function POST() {
  try {
    // Get current admin before logging out
    const admin = await getCurrentAdmin();

    // Log the logout action if admin was authenticated
    if (admin) {
      await logAdminAction({
        adminId: admin.id,
        action: "LOGOUT",
        entityType: "Auth",
      });
    }

    // Create response
    const res = NextResponse.json({ success: true });

    // Clear the session cookie
    res.cookies.set(ADMIN_CONFIG.SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: false, // Set to false for development (localhost)
      sameSite: "lax",
      path: "/", // Match the login cookie path
      maxAge: 0, // Expire immediately
    });

    return res;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
