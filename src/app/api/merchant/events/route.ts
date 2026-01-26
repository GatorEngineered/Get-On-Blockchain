import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET || "default-secret-change-in-production";

// GET - List all events for the merchant
export async function GET(req: NextRequest) {
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

    // Get all events for merchant with scan counts
    const events = await prisma.eventQRCode.findMany({
      where: { merchantId },
      include: {
        _count: {
          select: { eventScans: true },
        },
      },
      orderBy: { eventDate: "desc" },
    });

    // Transform events to include scan count and status
    const now = new Date();
    const transformedEvents = events.map((event) => {
      const isExpired = new Date(event.scanWindowEnd) < now;
      const isUpcoming = new Date(event.scanWindowStart) > now;
      const isActive = !isExpired && !isUpcoming && event.isActive;

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        eventDate: event.eventDate,
        scanWindowStart: event.scanWindowStart,
        scanWindowEnd: event.scanWindowEnd,
        pointsAwarded: event.pointsAwarded,
        code: event.code,
        isActive: event.isActive,
        status: isExpired ? "expired" : isUpcoming ? "upcoming" : isActive ? "active" : "inactive",
        scanCount: event._count.eventScans,
        createdAt: event.createdAt,
      };
    });

    return NextResponse.json({ events: transformedEvents });
  } catch (error: any) {
    console.error("Get events error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get events" },
      { status: 500 }
    );
  }
}

// POST - Create a new event
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

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      eventDate,
      scanWindowStart,
      scanWindowEnd,
      pointsAwarded = 50,
    } = body;

    // Validate required fields
    if (!name || !eventDate || !scanWindowStart || !scanWindowEnd) {
      return NextResponse.json(
        { error: "Name, event date, scan window start and end are required" },
        { status: 400 }
      );
    }

    // Validate dates
    const eventDateObj = new Date(eventDate);
    const scanStartObj = new Date(scanWindowStart);
    const scanEndObj = new Date(scanWindowEnd);

    if (scanEndObj <= scanStartObj) {
      return NextResponse.json(
        { error: "Scan window end must be after scan window start" },
        { status: 400 }
      );
    }

    // Generate unique QR code data
    const codeData = {
      eventId: crypto.randomBytes(8).toString("hex"),
      merchantId,
      timestamp: Date.now(),
      type: "event",
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
    const scanUrl = `${baseUrl}/m/${merchant.slug}/scan-event?code=${encodeURIComponent(code)}`;

    // Create the event
    const event = await prisma.eventQRCode.create({
      data: {
        merchantId,
        name,
        description: description || null,
        eventDate: eventDateObj,
        scanWindowStart: scanStartObj,
        scanWindowEnd: scanEndObj,
        pointsAwarded,
        code: scanUrl,
        signature,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        eventDate: event.eventDate,
        scanWindowStart: event.scanWindowStart,
        scanWindowEnd: event.scanWindowEnd,
        pointsAwarded: event.pointsAwarded,
        code: event.code,
        isActive: event.isActive,
        status: "upcoming",
        scanCount: 0,
        createdAt: event.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
