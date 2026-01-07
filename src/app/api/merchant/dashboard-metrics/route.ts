import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Validate merchant session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("gob_merchant_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse session data from JSON
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (e) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 2. Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Check for businessId query parameter (for multi-location support)
    const { searchParams } = new URL(req.url);
    const requestedBusinessId = searchParams.get('businessId');

    // 2b. Select business based on query param or use first one
    let business = requestedBusinessId
      ? merchant.businesses.find(b => b.id === requestedBusinessId)
      : merchant.businesses[0];

    // If requested businessId doesn't match any of merchant's businesses, use first
    if (!business && requestedBusinessId) {
      business = merchant.businesses[0];
    }

    if (!business) {
      business = await prisma.business.create({
        data: {
          slug: `${merchant.slug}-main`,
          name: merchant.name,
          locationNickname: 'Main Location',
          address: 'Not set',
          contactEmail: merchant.loginEmail,
          merchantId: merchant.id,
        },
      });
    }

    // 3. Calculate date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // 4. Fetch active members count
    const activeMembers = await prisma.businessMember.count({
      where: { businessId: business.id },
    });

    // 5. Fetch scan events
    const scansToday = await prisma.event.count({
      where: {
        merchantId: merchant.id,
        type: "SCAN",
        createdAt: { gte: startOfToday },
      },
    });

    const scansWeek = await prisma.event.count({
      where: {
        merchantId: merchant.id,
        type: "SCAN",
        createdAt: { gte: startOfWeek },
      },
    });

    // 6. Fetch points issued (30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const pointsIssuedResult = await prisma.rewardTransaction.aggregate({
      where: {
        businessId: business.id,
        type: "EARN",
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        amount: true,
      },
    });

    const pointsIssued = pointsIssuedResult._sum.amount || 0;

    // 7. Fetch redemptions today
    const redemptionsToday = await prisma.rewardTransaction.count({
      where: {
        businessId: business.id,
        type: "REDEEM",
        createdAt: { gte: startOfToday },
      },
    });

    // 8. Fetch total USDC paid out (all time)
    const totalPayoutResult = await prisma.rewardTransaction.aggregate({
      where: {
        businessId: business.id,
        type: "PAYOUT",
        status: "SUCCESS",
      },
      _sum: {
        usdcAmount: true,
      },
    });

    const totalPayoutUSDC = totalPayoutResult._sum.usdcAmount || 0;

    // 9. Fetch recent activity (last 10 transactions with privacy protection)
    const recentTransactions = await prisma.rewardTransaction.findMany({
      where: { businessId: business.id },
      include: {
        member: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recentActivity = recentTransactions.map((tx) => {
      const firstName = tx.member.firstName || "Anonymous";
      const lastInitial = tx.member.lastName ? tx.member.lastName.charAt(0) + "." : "";
      const customerName = `${firstName} ${lastInitial}`;

      let action = "";
      if (tx.type === "EARN") {
        action = `Earned ${tx.amount} points`;
      } else if (tx.type === "REDEEM") {
        action = tx.reason || "Redeemed reward";
      } else if (tx.type === "PAYOUT") {
        action = `Claimed $${tx.usdcAmount?.toFixed(2)} USDC payout`;
      }

      const timeAgo = getTimeAgo(tx.createdAt);

      return {
        id: tx.id,
        customer: customerName,
        action,
        time: timeAgo,
        location: business.locationNickname || business.name,
      };
    });

    // 10. Fetch top customers (by points balance from MerchantMember)
    const topCustomers = await prisma.merchantMember.findMany({
      where: { merchantId: merchant.id },
      include: {
        member: true,
        rewardTransactions: {
          where: {
            type: "EARN",
            businessId: business.id,
          },
        },
      },
      orderBy: { points: "desc" },
      take: 10,
    });

    const topCustomersData = topCustomers.map((mm) => {
      const firstName = mm.member.firstName || "Anonymous";
      const lastInitial = mm.member.lastName ? mm.member.lastName.charAt(0) + "." : "";
      const fullName = `${firstName} ${lastInitial}`;
      const avatar = `${firstName.charAt(0)}${mm.member.lastName?.charAt(0) || ""}`;

      return {
        id: mm.id,
        name: fullName,
        visits: mm.rewardTransactions.length, // Count of EARN transactions for this business
        points: mm.points,
        tier: mm.tier,
        avatar,
      };
    });

    // 11. Fetch weekly scan activity (last 7 days)
    const weeklyScansData = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const scansCount = await prisma.event.count({
        where: {
          merchantId: merchant.id,
          type: "SCAN",
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      weeklyScansData.push({
        day: dayNames[date.getDay()],
        scans: scansCount,
      });
    }

    // 12. Return all metrics
    return NextResponse.json({
      businessName: business.name,
      businessId: business.id,
      locationNickname: business.locationNickname,
      stats: {
        activeMembers,
        totalScansToday: scansToday,
        totalScansWeek: scansWeek,
        pointsIssued,
        redemptionsToday,
        totalPayoutUSDC: totalPayoutUSDC.toFixed(2),
      },
      recentActivity,
      topCustomers: topCustomersData,
      weeklyScans: weeklyScansData,
    });
  } catch (error: any) {
    console.error("[Dashboard] Error:", error.message, error.stack);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard metrics",
        details: process.env.NODE_ENV === 'development' ? error.message : error.message,
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
