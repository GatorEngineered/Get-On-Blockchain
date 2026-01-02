import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: memberId } = await params;

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

    // Get MerchantMember relationship (merchant-level points aggregation)
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
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
        rewardTransactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!merchantMember) {
      return NextResponse.json(
        { error: "Member not found for this merchant" },
        { status: 404 }
      );
    }

    // Get BusinessMember for visit tracking (per-location analytics)
    const businessMember = await prisma.businessMember.findUnique({
      where: {
        businessId_memberId: {
          businessId,
          memberId,
        },
      },
      include: {
        business: {
          select: {
            scans: {
              where: { memberId },
              orderBy: {
                scannedAt: "desc",
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const scans = businessMember?.business.scans || [];
    const totalVisits = scans.length;
    const lastVisit = scans[0]?.scannedAt || null;

    // Calculate tier progress
    const currentPoints = merchantMember.points;
    const currentTier = merchantMember.tier;

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
        id: merchantMember.member.id,
        email: merchantMember.member.email,
        firstName: merchantMember.member.firstName,
        lastName: merchantMember.member.lastName,
        fullName: `${merchantMember.member.firstName} ${merchantMember.member.lastName}`.trim() || "No name",
        phone: merchantMember.member.phone,
        memberSince: merchantMember.member.createdAt,
        joinedBusiness: merchantMember.createdAt,
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
      scans: scans.map((scan) => ({
        id: scan.id,
        scannedAt: scan.scannedAt,
        pointsAwarded: scan.pointsAwarded,
        status: scan.status,
      })),
      transactions: merchantMember.rewardTransactions.map((tx) => ({
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
