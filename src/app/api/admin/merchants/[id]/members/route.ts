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

    // Get all members associated with this merchant
    const members = await prisma.member.findMany({
      where: {
        merchantMembers: {
          some: {
            merchantId: merchantId,
          },
        },
      },
      include: {
        merchantMembers: {
          where: {
            merchantId: merchantId,
          },
        },
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

        // Get points from MerchantMember (merchant-level aggregation)
        const merchantMember = member.merchantMembers[0]; // Should only be one per merchant
        const currentPoints = merchantMember?.points || 0;
        const tier = merchantMember?.tier || 'BASE';

        return {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          address: member.address,
          walletAddress: merchantMember?.walletAddress || member.walletAddress,
          tier: tier,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
          businesses: member.businesses.map((bm) => ({
            businessId: bm.businessId,
            businessName: bm.business.name,
            locationNickname: bm.business.locationNickname,
            visitCount: bm.visitCount,
            lastVisitAt: bm.lastVisitAt,
            firstVisitAt: bm.firstVisitAt,
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
