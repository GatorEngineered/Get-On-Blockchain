// Admin API: Get audit logs with filtering
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/app/lib/adminAuth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  // Require super admin authentication
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const adminId = searchParams.get("adminId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    // Fetch audit logs with filters
    const [logs, totalCount] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
