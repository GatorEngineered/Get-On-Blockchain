import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

// GET - Get a single event with scan details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

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

    const event = await prisma.eventQRCode.findUnique({
      where: { id: eventId },
      include: {
        eventScans: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { scannedAt: "desc" },
        },
        _count: {
          select: { eventScans: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (event.merchantId !== merchantId) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const now = new Date();
    const isExpired = new Date(event.scanWindowEnd) < now;
    const isUpcoming = new Date(event.scanWindowStart) > now;
    const isActive = !isExpired && !isUpcoming && event.isActive;

    return NextResponse.json({
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
        status: isExpired ? "expired" : isUpcoming ? "upcoming" : isActive ? "active" : "inactive",
        scanCount: event._count.eventScans,
        scans: event.eventScans.map((scan) => ({
          id: scan.id,
          member: {
            id: scan.member.id,
            name: `${scan.member.firstName} ${scan.member.lastName}`.trim() || scan.member.email,
            email: scan.member.email,
          },
          pointsAwarded: scan.pointsAwarded,
          status: scan.status,
          scannedAt: scan.scannedAt,
        })),
        createdAt: event.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Get event error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get event" },
      { status: 500 }
    );
  }
}

// PUT - Update an event
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

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

    // Get existing event
    const existingEvent = await prisma.eventQRCode.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingEvent.merchantId !== merchantId) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      eventDate,
      scanWindowStart,
      scanWindowEnd,
      pointsAwarded,
      isActive,
    } = body;

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (scanWindowStart !== undefined) updateData.scanWindowStart = new Date(scanWindowStart);
    if (scanWindowEnd !== undefined) updateData.scanWindowEnd = new Date(scanWindowEnd);
    if (pointsAwarded !== undefined) updateData.pointsAwarded = pointsAwarded;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Validate dates if both are provided
    const newStart = updateData.scanWindowStart || existingEvent.scanWindowStart;
    const newEnd = updateData.scanWindowEnd || existingEvent.scanWindowEnd;

    if (new Date(newEnd) <= new Date(newStart)) {
      return NextResponse.json(
        { error: "Scan window end must be after scan window start" },
        { status: 400 }
      );
    }

    // Update the event
    const event = await prisma.eventQRCode.update({
      where: { id: eventId },
      data: updateData,
      include: {
        _count: {
          select: { eventScans: true },
        },
      },
    });

    const now = new Date();
    const isExpired = new Date(event.scanWindowEnd) < now;
    const isUpcoming = new Date(event.scanWindowStart) > now;
    const eventIsActive = !isExpired && !isUpcoming && event.isActive;

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
        status: isExpired ? "expired" : isUpcoming ? "upcoming" : eventIsActive ? "active" : "inactive",
        scanCount: event._count.eventScans,
        createdAt: event.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an event
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

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

    // Get existing event
    const existingEvent = await prisma.eventQRCode.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { eventScans: true },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingEvent.merchantId !== merchantId) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Warn if event has scans (but still allow deletion)
    const hadScans = existingEvent._count.eventScans > 0;

    // Delete the event (cascades to eventScans)
    await prisma.eventQRCode.delete({
      where: { id: eventId },
    });

    return NextResponse.json({
      success: true,
      message: hadScans
        ? `Event deleted. ${existingEvent._count.eventScans} scan records were also removed.`
        : "Event deleted successfully.",
    });
  } catch (error: any) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}
