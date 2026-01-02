import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET || "default-secret-change-in-production";

export async function POST() {
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

    // Get merchant with first business
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: {
          take: 1,
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const business = merchant.businesses[0];
    if (!business) {
      return NextResponse.json(
        { error: "No business found" },
        { status: 404 }
      );
    }

    // Invalidate all existing QR codes for this business
    await prisma.qRCode.updateMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      data: {
        isActive: false,
        invalidAt: new Date(),
      },
    });

    // Generate new QR code
    const codeData = {
      businessId: business.id,
      timestamp: Date.now(),
      salt: crypto.randomBytes(16).toString("hex"),
    };

    const codeString = JSON.stringify(codeData);
    const signature = crypto
      .createHmac("sha256", QR_SECRET)
      .update(codeString)
      .digest("hex");

    const code = Buffer.from(codeString).toString("base64");

    // Create the scan URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const scanUrl = `${baseUrl}/m/${merchant.slug}/scan?code=${encodeURIComponent(code)}`;

    const qrCode = await prisma.qRCode.create({
      data: {
        businessId: business.id,
        code: scanUrl, // Store the full URL
        signature,
      },
    });

    return NextResponse.json({
      success: true,
      message: "QR code regenerated successfully. Previous QR codes have been invalidated.",
      qrCode: {
        id: qrCode.id,
        code: qrCode.code,
        createdAt: qrCode.createdAt,
        isActive: qrCode.isActive,
      },
    });
  } catch (error: any) {
    console.error("Regenerate QR code error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate QR code" },
      { status: 500 }
    );
  }
}
