// src/app/api/track-scan/route.ts

import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { merchant, source = "qr", metadata = {} } = body;

    if (!merchant) {
      return NextResponse.json({ error: "Missing merchant" }, { status: 400 });
    }

    // Find merchant
    const merchantRecord = await prisma.merchant.findUnique({
      where: { slug: merchant },
    });

    if (!merchantRecord) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Create event
    await prisma.event.create({
      data: {
        merchantId: merchantRecord.id,
        type: "SCAN",
        source,
        metadata,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track scan error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
