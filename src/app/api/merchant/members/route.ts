import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

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

    // Get merchant with businesses
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: {
          include: {
            members: {
              include: {
                member: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    createdAt: true,
                  },
                },
                scans: {
                  orderBy: {
                    scannedAt: "desc",
                  },
                  take: 1,
                },
              },
            },
          },
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

    // Transform data for response
    const members = business.members.map((bm) => ({
      id: bm.member.id,
      businessMemberId: bm.id,
      email: bm.member.email,
      firstName: bm.member.firstName,
      lastName: bm.member.lastName,
      fullName: `${bm.member.firstName} ${bm.member.lastName}`.trim() || "No name",
      phone: bm.member.phone,
      points: bm.points,
      tier: bm.tier,
      joinedAt: bm.createdAt,
      memberSince: bm.member.createdAt,
      lastVisit: bm.scans[0]?.scannedAt || null,
      totalVisits: bm.scans.length,
    }));

    // Sort by points descending
    members.sort((a, b) => b.points - a.points);

    return NextResponse.json({
      members,
      totalMembers: members.length,
      business: {
        id: business.id,
        name: business.name,
      },
    });
  } catch (error: any) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch members" },
      { status: 500 }
    );
  }
}
