import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/**
 * GET /api/merchant/info?id=MERCHANT_ID
 *
 * Get basic merchant info (for password setup page)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get("id");

    if (!merchantId) {
      return NextResponse.json(
        { error: "Missing merchant ID" },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        loginEmail: true,
        subscriptionStatus: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant);
  } catch (error: any) {
    console.error("[Merchant Info] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch merchant info",
      },
      { status: 500 }
    );
  }
}
