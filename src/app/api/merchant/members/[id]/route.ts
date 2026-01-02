import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id: memberId } = params;

    // Get merchant with business
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
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const businessId = merchant.businesses[0].id;

    // Get BusinessMember relationship
    const businessMember = await prisma.businessMember.findUnique({
      where: {
        businessId_memberId: {
          businessId,
          memberId,
        },
      },
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
          include: {
            qrCode: {
              select: {
                createdAt: true,
              },
            },
          },
        },
        rewardTransactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!businessMember) {
      return NextResponse.json(
        { error: "Member not found for this business" },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalVisits = businessMember.scans.length;
    const lastVisit = businessMember.scans[0]?.scannedAt || null;

    // Calculate tier progress
    const currentPoints = businessMember.points;
    const currentTier = businessMember.tier;

    let nextTier = null;
    let nextTierThreshold = null;
    let tierProgress = 0;

    if (currentTier === "BASE") {
      nextTier = "VIP";
      nextTierThreshold = merchant.vipThreshold;
      tierProgress = (currentPoints / nextTierThreshold) * 100;
    } else if (currentTier === "VIP") {
      nextTier = "SUPER";
      nextTierThreshold = merchant.superThreshold;
      tierProgress = (currentPoints / nextTierThreshold) * 100;
    } else {
      tierProgress = 100; // SUPER tier is max
    }

    return NextResponse.json({
      member: {
        id: businessMember.member.id,
        email: businessMember.member.email,
        firstName: businessMember.member.firstName,
        lastName: businessMember.member.lastName,
        fullName: `${businessMember.member.firstName} ${businessMember.member.lastName}`.trim() || "No name",
        phone: businessMember.member.phone,
        memberSince: businessMember.member.createdAt,
        joinedBusiness: businessMember.createdAt,
      },
      loyalty: {
        points: currentPoints,
        tier: currentTier,
        nextTier,
        nextTierThreshold,
        tierProgress: Math.min(tierProgress, 100),
        totalVisits,
        lastVisit,
      },
      scans: businessMember.scans.map((scan) => ({
        id: scan.id,
        scannedAt: scan.scannedAt,
        pointsAwarded: scan.pointsAwarded,
        status: scan.status,
      })),
      transactions: businessMember.rewardTransactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        reason: tx.reason,
        status: tx.status,
        createdAt: tx.createdAt,
        txHash: tx.txHash,
      })),
      business: {
        id: merchant.businesses[0].id,
        name: merchant.businesses[0].name,
      },
    });
  } catch (error: any) {
    console.error("Get member profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch member profile" },
      { status: 500 }
    );
  }
}
