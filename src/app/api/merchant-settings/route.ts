// src/app/api/merchant-settings/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

// Helper to get current merchant from session cookie
async function getCurrentMerchant() {
  // ⬇⬇⬇ this was `const cookieStore = cookies();`
  const cookieStore = await cookies();
  const session = cookieStore.get("gob_merchant_session");
  const merchantId = session?.value;

  if (!merchantId) {
    return null;
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      welcomePoints: true,
      earnPerVisit: true,
      vipThreshold: true,
      primaryColor: true,
      accentColor: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return merchant;
}


// GET /api/merchant-settings
export async function GET() {
  try {
    const merchant = await getCurrentMerchant();

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("Error loading merchant settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/merchant-settings
export async function PATCH(req: Request) {
  try {
    const merchant = await getCurrentMerchant();

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { welcomePoints, earnPerVisit, vipThreshold } = body ?? {};

    // Build a partial update object with only valid numeric fields
    const data: {
      welcomePoints?: number;
      earnPerVisit?: number;
      vipThreshold?: number;
    } = {};

    if (typeof welcomePoints === "number") {
      data.welcomePoints = welcomePoints;
    }

    if (typeof earnPerVisit === "number") {
      data.earnPerVisit = earnPerVisit;
    }

    if (typeof vipThreshold === "number") {
      data.vipThreshold = vipThreshold;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id }, // use the logged-in merchant, not a slug constant
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        welcomePoints: true,
        earnPerVisit: true,
        vipThreshold: true,
        primaryColor: true,
        accentColor: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedMerchant);
  } catch (error) {
    console.error("Error updating merchant settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
