// src/app/api/merchant-settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const MERCHANT_SLUG = "demo-coffee-shop";

// GET /api/merchant-settings
// Returns the current merchant + loyalty settings for the demo merchant
export async function GET() {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { slug: MERCHANT_SLUG },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        welcomePoints: true,
        earnPerVisit: true,
        vipThreshold: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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
// Allows updating welcomePoints, earnPerVisit, and vipThreshold
export async function PATCH(req: Request) {
  try {
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
      where: { slug: MERCHANT_SLUG },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        welcomePoints: true,
        earnPerVisit: true,
        vipThreshold: true,
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
