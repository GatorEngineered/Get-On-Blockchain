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

    const { welcomePoints, earnPerVisit, vipThreshold, superThreshold, primaryColor, accentColor } = await req.json();

    // Validation
    if (welcomePoints < 0 || earnPerVisit < 0 || vipThreshold < 0 || superThreshold < 0) {
      return NextResponse.json(
        { error: "Point values must be positive numbers" },
        { status: 400 }
      );
    }

    if (superThreshold <= vipThreshold) {
      return NextResponse.json(
        { error: "SUPER tier threshold must be greater than VIP tier threshold" },
        { status: 400 }
      );
    }

    // Update merchant loyalty program settings
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        welcomePoints,
        earnPerVisit,
        vipThreshold,
        superThreshold,
        primaryColor: primaryColor || undefined,
        accentColor: accentColor || undefined,
      },
    });

    return NextResponse.json({ success: true, merchant });
  } catch (error) {
    console.error("Update loyalty program error:", error);
    return NextResponse.json(
      { error: "Failed to update loyalty program" },
      { status: 500 }
    );
  }
}
