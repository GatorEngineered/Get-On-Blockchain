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

    // Get merchant's first business
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        businesses: {
          take: 1,
        },
      },
    });

    if (!merchant || merchant.businesses.length === 0) {
      return NextResponse.json(
        { error: "No business found" },
        { status: 404 }
      );
    }

    const businessId = merchant.businesses[0].id;

    // Get search params for pagination
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status") || undefined; // Filter by status

    // Build where clause
    const where: any = {
      businessId,
      type: "PAYOUT",
    };

    if (status && ["SUCCESS", "FAILED", "PENDING"].includes(status)) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.rewardTransaction.count({ where });

    // Get payout transactions
    const transactions = await prisma.rewardTransaction.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Calculate summary stats
    const totalPayouts = await prisma.rewardTransaction.aggregate({
      where: {
        businessId,
        type: "PAYOUT",
        status: "SUCCESS",
      },
      _sum: {
        usdcAmount: true,
      },
      _count: true,
    });

    const failedPayouts = await prisma.rewardTransaction.count({
      where: {
        businessId,
        type: "PAYOUT",
        status: "FAILED",
      },
    });

    const pendingPayouts = await prisma.rewardTransaction.count({
      where: {
        businessId,
        type: "PAYOUT",
        status: "PENDING",
      },
    });

    // Format transactions for response
    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      memberId: tx.memberId,
      memberName: tx.member
        ? `${tx.member.firstName} ${tx.member.lastName}`.trim() || tx.member.email
        : "Unknown",
      memberEmail: tx.member?.email || null,
      amount: tx.usdcAmount,
      currency: tx.currency,
      pointsDeducted: tx.pointsDeducted,
      status: tx.status,
      txHash: tx.txHash,
      walletAddress: tx.walletAddress,
      errorMessage: tx.errorMessage,
      createdAt: tx.createdAt,
      reason: tx.reason,
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      summary: {
        totalPayouts: totalPayouts._count || 0,
        totalAmount: totalPayouts._sum.usdcAmount || 0,
        failedPayouts,
        pendingPayouts,
      },
    });
  } catch (error: any) {
    console.error("Payout history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payout history" },
      { status: 500 }
    );
  }
}
