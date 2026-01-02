// Admin API: Get all members for a specific merchant
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSuperAdmin } from "@/app/lib/adminAuth";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminOrSuperAdmin();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const { id: merchantId } = await params;

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, name: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Get all members associated with this merchant's businesses
    const members = await prisma.member.findMany({
      where: {
        businesses: {
          some: {
            business: {
              merchantId: merchantId,
            },
          },
        },
      },
      include: {
        businesses: {
          where: {
            business: {
              merchantId: merchantId,
            },
          },
          include: {
            business: {
              select: {
                id: true,
                name: true,
                locationNickname: true,
              },
            },
          },
        },
        rewardTransactions: {
          where: {
            business: {
              merchantId: merchantId,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            business: {
              select: {
                name: true,
                locationNickname: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats for each member
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        // Get transaction stats
        const earnedPoints = await prisma.rewardTransaction.aggregate({
          where: {
            memberId: member.id,
            business: { merchantId: merchantId },
            type: "EARN",
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        const redeemedPoints = await prisma.rewardTransaction.aggregate({
          where: {
            memberId: member.id,
            business: { merchantId: merchantId },
            type: "REDEEM",
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        // Calculate current points across all businesses for this merchant
        const currentPoints = member.businesses.reduce((sum, bm) => sum + bm.points, 0);

        return {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          address: member.address,
          walletAddress: member.walletAddress,
          tier: member.tier,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
          businesses: member.businesses.map((bm) => ({
            businessId: bm.businessId,
            businessName: bm.business.name,
            locationNickname: bm.business.locationNickname,
            points: bm.points,
            tier: bm.tier,
            walletAddress: bm.walletAddress,
            walletNetwork: bm.walletNetwork,
            isCustodial: bm.isCustodial,
          })),
          stats: {
            currentPoints,
            totalEarned: earnedPoints._sum.amount || 0,
            totalRedeemed: redeemedPoints._sum.amount || 0,
            earnTransactions: earnedPoints._count.id,
            redeemTransactions: redeemedPoints._count.id,
            totalTransactions: earnedPoints._count.id + redeemedPoints._count.id,
          },
          recentTransactions: member.rewardTransactions,
        };
      })
    );

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
      },
      members: membersWithStats,
      totalMembers: membersWithStats.length,
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
