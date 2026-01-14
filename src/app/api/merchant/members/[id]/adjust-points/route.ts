import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export async function POST(
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
    const { amount, reason } = await req.json();

    if (!amount || amount === 0) {
      return NextResponse.json(
        { error: "Amount is required and cannot be zero" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

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
        { error: "Unable to process request. Please try again or contact support." },
        { status: 404 }
      );
    }

    const businessId = merchant.businesses[0].id;

    // Get MerchantMember relationship (merchant-level points)
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: {
          merchantId,
          memberId,
        },
      },
    });

    if (!merchantMember) {
      return NextResponse.json(
        { error: "Unable to process request. Please try again or contact support." },
        { status: 404 }
      );
    }

    // Calculate new points (can't go below 0)
    const newPoints = Math.max(0, merchantMember.points + amount);

    // Update points (merchant-level aggregation)
    await prisma.merchantMember.update({
      where: { id: merchantMember.id },
      data: {
        points: newPoints,
      },
    });

    // Check tier upgrade/downgrade
    let newTier = merchantMember.tier;
    if (newPoints >= merchant.superThreshold && newTier !== "SUPER") {
      newTier = "SUPER";
    } else if (newPoints >= merchant.vipThreshold && newPoints < merchant.superThreshold && newTier !== "VIP") {
      newTier = "VIP";
    } else if (newPoints < merchant.vipThreshold && newTier !== "BASE") {
      newTier = "BASE";
    }

    // Update tier if changed
    if (newTier !== merchantMember.tier) {
      await prisma.merchantMember.update({
        where: { id: merchantMember.id },
        data: { tier: newTier },
      });
    }

    // Create transaction record (linked to MerchantMember)
    await prisma.rewardTransaction.create({
      data: {
        merchantMemberId: merchantMember.id,
        businessId,
        memberId,
        type: "ADJUST",
        amount: Math.abs(amount),
        reason,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Points ${amount > 0 ? 'added' : 'removed'} successfully`,
      member: {
        id: memberId,
        points: newPoints,
        tier: newTier,
        tierChanged: newTier !== merchantMember.tier,
        adjustment: amount,
      },
    });
  } catch (error: any) {
    console.error("Adjust points error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or contact support." },
      { status: 500 }
    );
  }
}
