import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentAdmin } from "@/app/lib/adminAuth";
import { logAdminAction } from "@/app/lib/adminAudit";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (currentAdmin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { role, isActive } = await req.json();

    if (id === currentAdmin.id && isActive === false) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 },
      );
    }

    if (role && !["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { id },
      select: { email: true, role: true, isActive: true },
    });

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    const changes = [];
    if (role && role !== existingAdmin.role) {
      changes.push("role: " + existingAdmin.role + " to " + role);
    }
    if (isActive !== undefined && isActive !== existingAdmin.isActive) {
      const oldStatus = existingAdmin.isActive ? "active" : "inactive";
      const newStatus = isActive ? "active" : "inactive";
      changes.push("status: " + oldStatus + " to " + newStatus);
    }

    await logAdminAction({
      adminId: currentAdmin.id,
      action: "EDIT_ADMIN",
      entityType: "Admin",
      entityId: updatedAdmin.id,
      changes: {
        before: {
          role: existingAdmin.role,
          isActive: existingAdmin.isActive,
        },
        after: {
          role: role ?? existingAdmin.role,
          isActive: isActive ?? existingAdmin.isActive,
        },
      },
    });

    return NextResponse.json({ admin: updatedAdmin });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
