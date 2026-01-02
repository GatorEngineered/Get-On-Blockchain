import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
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

    if (!staff || staff.merchantId !== session.value) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        canManageMembers: updates.canManageMembers !== undefined ? updates.canManageMembers : staff.canManageMembers,
        canViewReports: updates.canViewReports !== undefined ? updates.canViewReports : staff.canViewReports,
        canManageSettings: updates.canManageSettings !== undefined ? updates.canManageSettings : staff.canManageSettings,
        isActive: updates.isActive !== undefined ? updates.isActive : staff.isActive,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
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

    if (!staff || staff.merchantId !== session.value) {
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
