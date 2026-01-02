// Admin API: Get all merchants with statistics
import { NextResponse } from "next/server";
import { requireAdminOrSuperAdmin } from "@/app/lib/adminAuth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  // Require admin authentication
  const authResult = await requireAdminOrSuperAdmin();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    // Fetch all merchants with related data
    const merchants = await prisma.merchant.findMany({
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            locationNickname: true,
          },
        },
        events: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            businesses: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get member counts for each merchant
    const merchantsWithStats = await Promise.all(
      merchants.map(async (merchant) => {
        // Count unique members across all businesses
        const memberCount = await prisma.member.count({
          where: {
            businesses: {
              some: {
                business: {
                  merchantId: merchant.id,
                },
              },
            },
          },
        });

        // Calculate total points distributed across all businesses
        const totalPointsDistributed = await prisma.rewardTransaction.aggregate({
          where: {
            business: {
              merchantId: merchant.id,
            },
            type: "EARN",
          },
          _sum: {
            amount: true,
          },
        });

        return {
          id: merchant.id,
          slug: merchant.slug,
          name: merchant.name,
          loginEmail: merchant.loginEmail,
          plan: merchant.plan,
          welcomePoints: merchant.welcomePoints,
          earnPerVisit: merchant.earnPerVisit,
          payoutEnabled: merchant.payoutEnabled,
          businessCount: merchant._count.businesses,
          memberCount,
          eventCount: merchant._count.events,
          totalPointsDistributed: totalPointsDistributed._sum.amount || 0,
          lastActivity: merchant.events[0]?.createdAt || null,
          createdAt: merchant.createdAt,
          businesses: merchant.businesses,
        };
      })
    );

    return NextResponse.json({ merchants: merchantsWithStats });
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchants" },
      { status: 500 }
    );
  }
}
