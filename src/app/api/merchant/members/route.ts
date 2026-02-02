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

    // Get merchant with first business for display
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: {
          take: 1,
        },
      },
    });

    if (!merchant || !merchant.businesses[0]) {
      return NextResponse.json(
        { error: "Merchant or business not found" },
        { status: 404 }
      );
    }

    const business = merchant.businesses[0];

    // Get all MerchantMembers for this merchant (merchant-level points aggregation)
    const merchantMembers = await prisma.merchantMember.findMany({
      where: { merchantId },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
            birthMonth: true,
            anniversaryDate: true,
          },
        },
      },
      orderBy: {
        points: "desc", // Sort by points descending
      },
    });

    // For each merchant member, get their visit data from BusinessMember
    const membersWithVisits = await Promise.all(
      merchantMembers.map(async (mm) => {
        // Get BusinessMember for visit tracking (per-location analytics)
        const businessMember = await prisma.businessMember.findUnique({
          where: {
            businessId_memberId: {
              businessId: business.id,
              memberId: mm.member.id,
            },
          },
          include: {
            business: {
              select: {
                scans: {
                  where: { memberId: mm.member.id },
                  orderBy: {
                    scannedAt: "desc",
                  },
                  take: 1,
                },
              },
            },
          },
        });

        const lastScan = businessMember?.business.scans[0];

        return {
          id: mm.member.id,
          merchantMemberId: mm.id,
          businessMemberId: businessMember?.id || null,
          email: mm.member.email,
          firstName: mm.member.firstName,
          lastName: mm.member.lastName,
          fullName: `${mm.member.firstName} ${mm.member.lastName}`.trim() || "No name",
          phone: mm.member.phone,
          points: mm.points,
          tier: mm.tier,
          joinedAt: mm.createdAt,
          memberSince: mm.member.createdAt,
          lastVisit: lastScan?.scannedAt || null,
          visitCount: businessMember?.visitCount || 0,
          // For sorting by special dates
          birthMonth: mm.member.birthMonth, // 1-12 or null
          relationshipAnniversaryMonth: mm.member.anniversaryDate
            ? new Date(mm.member.anniversaryDate).getMonth() + 1
            : null, // 1-12 or null
          memberAnniversaryMonth: new Date(mm.createdAt).getMonth() + 1, // 1-12
          // Member's note about themselves (for tooltip preview)
          memberNote: mm.memberNote,
        };
      })
    );

    return NextResponse.json({
      members: membersWithVisits,
      totalMembers: membersWithVisits.length,
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
