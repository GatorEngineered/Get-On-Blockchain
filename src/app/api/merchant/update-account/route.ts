import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse session data from JSON
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

    const { name, loginEmail } = await req.json();

    if (!name || !loginEmail) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email is already in use by another merchant
    if (loginEmail) {
      const existing = await prisma.merchant.findFirst({
        where: {
          loginEmail,
          NOT: {
            id: merchantId,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 }
        );
      }
    }

    // Update merchant account
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        name,
        loginEmail,
      },
    });

    // Also update the first business name to keep them in sync
    const business = await prisma.business.findFirst({
      where: { merchantId },
    });

    if (business) {
      await prisma.business.update({
        where: { id: business.id },
        data: { name },
      });
    }

    return NextResponse.json({ success: true, merchant });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}
