// Admin audit logging for compliance and security
import { prisma } from "./prisma";
import { headers } from "next/headers";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_ADMIN"
  | "EDIT_ADMIN"
  | "DELETE_ADMIN"
  | "CREATE_MERCHANT"
  | "EDIT_MERCHANT"
  | "DELETE_MERCHANT"
  | "CREATE_STAFF"
  | "EDIT_STAFF"
  | "DELETE_STAFF"
  | "CREATE_BLOG_POST"
  | "EDIT_BLOG_POST"
  | "DELETE_BLOG_POST"
  | "PUBLISH_BLOG_POST"
  | "UNPUBLISH_BLOG_POST"
  | "SEND_PASSWORD_RESET"
  | "VIEW_MERCHANT_DATA"
  | "VIEW_MEMBER_DATA";

export type AuditEntityType =
  | "Admin"
  | "Merchant"
  | "Staff"
  | "BlogPost"
  | "Member"
  | "Auth";

interface LogAdminActionParams {
  adminId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

/**
 * Log an admin action to the audit trail
 * Captures IP address, action details, and before/after changes
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  try {
    const { adminId, action, entityType, entityId, changes } = params;

    // Get IP address from request headers
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        changes: changes || undefined,
        ipAddress,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should never break the app
    console.error("Error logging admin action:", error);
  }
}

/**
 * Get recent audit logs for an admin
 */
export async function getAdminAuditLogs(
  adminId: string,
  limit: number = 50
) {
  return prisma.adminAuditLog.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: {
        select: {
          email: true,
          fullName: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Get all audit logs (super admin only)
 */
export async function getAllAuditLogs(limit: number = 100) {
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: {
        select: {
          email: true,
          fullName: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Get audit logs for a specific entity (e.g., all changes to a merchant)
 */
export async function getEntityAuditLogs(
  entityType: AuditEntityType,
  entityId: string
) {
  return prisma.adminAuditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      admin: {
        select: {
          email: true,
          fullName: true,
          role: true,
        },
      },
    },
  });
}
