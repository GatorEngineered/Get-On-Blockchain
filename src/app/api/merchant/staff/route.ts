import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";

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
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

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

    const { fullName, email, canManageMembers, canViewReports, canManageSettings } = await req.json();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.staff.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Staff member with this email already exists" },
        { status: 400 }
      );
    }

    // Generate a temporary password hash
    // TODO: In future phase, send email invite for staff to set their own password
    const tempPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const staff = await prisma.staff.create({
      data: {
        merchantId,
        fullName,
        email,
        passwordHash,
        canManageMembers: canManageMembers || false,
        canViewReports: canViewReports !== undefined ? canViewReports : true,
        canManageSettings: canManageSettings || false,
      },
    });

    // TODO Phase: Email Invitation System
    // - Send email to staff member with secure invite link
    // - Link should allow staff to set their own password
    // - Staff login uses same merchant dashboard at /dashboard/login
    // - Add 'role' field to distinguish merchant owner vs staff
    // - Temporary password approach is placeholder only

    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    console.error("Add staff error:", error);
    
    let errorMessage = "Failed to add staff member";
    if (error.code === 'P2002') errorMessage = "Email already exists";
    else if (error.code === 'P2003') errorMessage = "Invalid merchant";
    else if (error.message) errorMessage = error.message;

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
