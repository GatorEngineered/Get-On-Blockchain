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

    const { locationNickname, address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Get merchant's first business
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { businesses: { take: 1 } },
    });

    if (!merchant || !merchant.businesses[0]) {
      return NextResponse.json(
        { error: "No business found for merchant" },
        { status: 404 }
      );
    }

    // Update the business location (name is managed in Account Settings only)
    const business = await prisma.business.update({
      where: { id: merchant.businesses[0].id },
      data: {
        locationNickname: locationNickname || null,
        address,
      },
    });

    return NextResponse.json({ success: true, business });
  } catch (error) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
