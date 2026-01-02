// Admin authentication middleware and helpers
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
};

// Admin-specific configuration
export const ADMIN_CONFIG = {
  SESSION_COOKIE_NAME: "gob_admin_session",
  SESSION_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
} as const;

/**
 * Get the currently authenticated admin from session cookie
 * Returns null if not authenticated
 */
export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_CONFIG.SESSION_COOKIE_NAME);

    if (!session?.value) {
      return null;
    }

    const admin = await prisma.admin.findUnique({
      where: {
        id: session.value,
        isActive: true, // Only allow active admins
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    return admin;
  } catch (error) {
    console.error("Error getting current admin:", error);
    return null;
  }
}

/**
 * Middleware to require admin authentication
 * Returns authenticated admin or error response
 */
export async function requireAdminAuth(): Promise<
  { admin: AuthenticatedAdmin } | { error: NextResponse }
> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      error: NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      ),
    };
  }

  return { admin };
}

/**
 * Middleware to require SUPER_ADMIN role
 * Returns authenticated admin or error response
 */
export async function requireSuperAdmin(): Promise<
  { admin: AuthenticatedAdmin } | { error: NextResponse }
> {
  const result = await requireAdminAuth();

  if ("error" in result) {
    return result;
  }

  if (result.admin.role !== "SUPER_ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/**
 * Middleware to require ADMIN or SUPER_ADMIN role (not EDITOR)
 * Returns authenticated admin or error response
 */
export async function requireAdminOrSuperAdmin(): Promise<
  { admin: AuthenticatedAdmin } | { error: NextResponse }
> {
  const result = await requireAdminAuth();

  if ("error" in result) {
    return result;
  }

  if (result.admin.role === "EDITOR") {
    return {
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return result;
}
