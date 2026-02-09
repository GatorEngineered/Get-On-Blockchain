// Admin API: Get single merchant with detailed statistics & Update merchant
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSuperAdmin } from "@/app/lib/adminAuth";
import { logAdminAction } from "@/app/lib/adminAudit";
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
    const { id } = await params;

    // Fetch merchant with all related data
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        businesses: {
          include: {
            _count: {
              select: {
                members: true,
                rewardTransactions: true,
              },
            },
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 50,
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
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Get unique member count across all businesses
    const uniqueMemberCount = await prisma.member.count({
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

    // Get total points distributed
    const pointsStats = await prisma.rewardTransaction.aggregate({
      where: {
        business: {
          merchantId: merchant.id,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get points by type
    const earnedPoints = await prisma.rewardTransaction.aggregate({
      where: {
        business: { merchantId: merchant.id },
        type: "EARN",
      },
      _sum: { amount: true },
    });

    const redeemedPoints = await prisma.rewardTransaction.aggregate({
      where: {
        business: { merchantId: merchant.id },
        type: "REDEEM",
      },
      _sum: { amount: true },
    });

    const payoutCount = await prisma.rewardTransaction.count({
      where: {
        business: { merchantId: merchant.id },
        type: "PAYOUT",
      },
    });

    // Get recent transactions
    const recentTransactions = await prisma.rewardTransaction.findMany({
      where: {
        business: {
          merchantId: merchant.id,
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            locationNickname: true,
          },
        },
      },
    });

    // Calculate KPIs
    const kpis = {
      totalMembers: uniqueMemberCount,
      totalLocations: merchant.businesses.length,
      totalEvents: merchant.events.length,
      totalTransactions: pointsStats._count.id,
      totalPointsDistributed: pointsStats._sum.amount || 0,
      totalPointsEarned: earnedPoints._sum.amount || 0,
      totalPointsRedeemed: redeemedPoints._sum.amount || 0,
      totalPayouts: payoutCount,
      avgPointsPerMember:
        uniqueMemberCount > 0
          ? Math.round((pointsStats._sum.amount || 0) / uniqueMemberCount)
          : 0,
    };

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        slug: merchant.slug,
        name: merchant.name,
        tagline: merchant.tagline,
        loginEmail: merchant.loginEmail,
        plan: merchant.plan,
        welcomePoints: merchant.welcomePoints,
        earnPerVisit: merchant.earnPerVisit,
        vipThreshold: merchant.vipThreshold,
        primaryColor: merchant.primaryColor,
        accentColor: merchant.accentColor,
        payoutEnabled: merchant.payoutEnabled,
        payoutMilestonePoints: merchant.payoutMilestonePoints,
        payoutAmountUSD: merchant.payoutAmountUSD,
        payoutNetwork: merchant.payoutNetwork,
        usdcBalance: merchant.usdcBalance,
        lowBalanceThreshold: merchant.lowBalanceThreshold,
        notificationEmail: merchant.notificationEmail,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
      },
      businesses: merchant.businesses,
      recentEvents: merchant.events,
      recentTransactions,
      kpis,
    });
  } catch (error) {
    console.error("Error fetching merchant details:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminOrSuperAdmin();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Fetch existing merchant
    const existingMerchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!existingMerchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Extract update fields
    const {
      name,
      tagline,
      plan,
      welcomePoints,
      earnPerVisit,
      vipThreshold,
      primaryColor,
      accentColor,
      payoutEnabled,
      payoutMilestonePoints,
      payoutAmountUSD,
      payoutNetwork,
      lowBalanceThreshold,
      notificationEmail,
    } = body;

    // Update the merchant
    const merchant = await prisma.merchant.update({
      where: { id },
      data: {
        name,
        tagline,
        plan,
        welcomePoints,
        earnPerVisit,
        vipThreshold,
        primaryColor,
        accentColor,
        payoutEnabled,
        payoutMilestonePoints,
        payoutAmountUSD,
        payoutNetwork,
        lowBalanceThreshold,
        notificationEmail,
      },
    });

    // Log the action
    await logAdminAction({
      adminId: authResult.admin.id,
      action: "EDIT_MERCHANT",
      entityType: "Merchant",
      entityId: merchant.id,
      changes: {
        before: {
          plan: existingMerchant.plan,
          welcomePoints: existingMerchant.welcomePoints,
          earnPerVisit: existingMerchant.earnPerVisit,
        },
        after: {
          plan: merchant.plan,
          welcomePoints: merchant.welcomePoints,
          earnPerVisit: merchant.earnPerVisit,
        },
      },
    });

    return NextResponse.json({ merchant });
  } catch (error) {
    console.error("Error updating merchant:", error);
    return NextResponse.json(
      { error: "Failed to update merchant" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/merchants/[id]
 *
 * Permanently deletes a merchant and all associated data.
 * Admin-only endpoint.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminOrSuperAdmin();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const { id } = await params;

    // Fetch merchant to get details for logging
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        loginEmail: true,
        plan: true,
        _count: {
          select: {
            businesses: true,
            staff: true,
            merchantMembers: true,
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

    console.log(`[Admin Delete] Deleting merchant ${merchant.id} (${merchant.name} - ${merchant.loginEmail})`);
    console.log(`[Admin Delete] Cascade will remove: ${merchant._count.businesses} businesses, ${merchant._count.staff} staff, ${merchant._count.merchantMembers} member relationships`);

    // Try to delete merchant - cascades handle related records
    let deleteSuccessful = false;
    try {
      await prisma.merchant.delete({
        where: { id },
      });
      deleteSuccessful = true;
    } catch (deleteError: any) {
      // If deletion fails, deactivate the account by changing the email
      console.error(`[Admin Delete] Delete failed for ${merchant.id}, deactivating account:`, deleteError);

      const deactivatedEmail = `deleted_${merchant.id}@deleteaccount.getonblockchain.com`;

      await prisma.merchant.update({
        where: { id },
        data: {
          loginEmail: deactivatedEmail,
          passwordHash: `DELETED_${Date.now()}_${Math.random().toString(36)}`,
        },
      });

      console.log(`[Admin Delete] Merchant ${merchant.id} deactivated with email ${deactivatedEmail}`);
    }

    // Log the action
    await logAdminAction({
      adminId: authResult.admin.id,
      action: "DELETE_MERCHANT",
      entityType: "Merchant",
      entityId: merchant.id,
      changes: {
        before: {
          name: merchant.name,
          email: merchant.loginEmail,
          plan: merchant.plan,
          businessCount: merchant._count.businesses,
          staffCount: merchant._count.staff,
          memberCount: merchant._count.merchantMembers,
        },
        after: deleteSuccessful ? null : { status: "deactivated" },
      },
    });

    console.log(`[Admin Delete] Merchant ${merchant.id} ${deleteSuccessful ? 'deleted' : 'deactivated'} by admin ${authResult.admin.id}`);

    return NextResponse.json({
      success: true,
      message: deleteSuccessful
        ? `Merchant "${merchant.name}" deleted successfully`
        : `Merchant "${merchant.name}" has been deactivated (full deletion not possible)`,
    });
  } catch (error: any) {
    console.error("[Admin Delete] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete merchant" },
      { status: 500 }
    );
  }
}
