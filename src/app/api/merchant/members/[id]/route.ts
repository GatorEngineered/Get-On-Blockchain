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
        { error: "Please log in to continue." },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch (e) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
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
        { error: "Unable to load member. Please try again or contact support." },
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
            birthMonth: true,
            birthDay: true,
            anniversaryDate: true,
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
        { error: "Unable to load member. Please try again or contact support." },
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
      select: {
        visitCount: true,
        lastVisitAt: true,
        firstVisitAt: true,
      },
    });

    // Calculate statistics from BusinessMember visit tracking
    const totalVisits = businessMember?.visitCount || 0;
    const lastVisit = businessMember?.lastVisitAt || null;

    // Get referral count for this member (how many people they've referred to this merchant)
    const referralCount = await prisma.referral.count({
      where: {
        referrerId: memberId,
        merchantId: merchantId,
        status: 'CONVERTED', // Only count successful referrals
      },
    });

    // Get member's email preferences (to show if they're opted in for communications)
    const memberPreferences = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        emailMerchantPromotional: true,
        emailMerchantAnnouncements: true,
        emailMerchantPointsUpdates: true,
      },
    });

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

    // Helper to convert month number to name
    const getMonthName = (month: number | null): string | null => {
      if (!month) return null;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return monthNames[month - 1] || null;
    };

    return NextResponse.json({
      member: {
        id: merchantMember.member.id,
        // Email is intentionally hidden to protect member privacy
        // Merchants can contact members through the platform's announcement feature
        firstName: merchantMember.member.firstName,
        lastName: merchantMember.member.lastName,
        fullName: `${merchantMember.member.firstName} ${merchantMember.member.lastName}`.trim() || "No name",
        phone: merchantMember.member.phone,
        memberSince: merchantMember.member.createdAt,
        joinedBusiness: merchantMember.createdAt,
        // Special dates for merchant view
        birthdayMonth: getMonthName(merchantMember.member.birthMonth),
        relationshipAnniversary: merchantMember.member.anniversaryDate,
        memberAnniversary: merchantMember.createdAt, // When they joined this merchant
      },
      loyalty: {
        points: currentPoints,
        tier: currentTier,
        nextTier,
        nextTierThreshold,
        tierProgress: Math.min(tierProgress, 100),
        totalVisits,
        lastVisit,
        referralCount, // Number of successful referrals made by this member
      },
      // Notes
      notes: {
        memberNote: merchantMember.memberNote, // What member wrote about themselves
        merchantNote: merchantMember.merchantNote, // Merchant's private note
      },
      emailPreferences: {
        // Used to show if member is reachable via platform communications
        canReceivePromotional: memberPreferences?.emailMerchantPromotional ?? false,
        canReceiveAnnouncements: memberPreferences?.emailMerchantAnnouncements ?? false,
        canReceivePointsUpdates: memberPreferences?.emailMerchantPointsUpdates ?? false,
      },
      // Scans are now tracked via RewardTransactions with reason "QR code scan"
      scans: merchantMember.rewardTransactions
        .filter((tx) => tx.reason === "QR code scan")
        .map((tx) => ({
          id: tx.id,
          scannedAt: tx.createdAt,
          pointsAwarded: tx.amount,
          status: tx.status,
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
      { error: "Something went wrong. Please try again or contact support." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/merchant/members/[id]
 * Update merchant's private note about a member
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_merchant_session");

    if (!session?.value) {
      return NextResponse.json(
        { error: "Please log in to continue." },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch (e) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;
    const body = await req.json();
    const { merchantNote } = body;

    // Validate note length (max 500 characters for merchant notes)
    if (merchantNote && merchantNote.length > 500) {
      return NextResponse.json(
        { error: "Note cannot exceed 500 characters." },
        { status: 400 }
      );
    }

    // Update the merchant's note about this member
    const updated = await prisma.merchantMember.update({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId,
        },
      },
      data: {
        merchantNote: merchantNote || null,
      },
      select: {
        merchantNote: true,
      },
    });

    return NextResponse.json({
      success: true,
      merchantNote: updated.merchantNote,
    });
  } catch (error: any) {
    console.error("Update merchant note error:", error);
    return NextResponse.json(
      { error: "Failed to update note. Please try again." },
      { status: 500 }
    );
  }
}
