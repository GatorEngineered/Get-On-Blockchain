// src/app/api/member/payout-notify/route.ts
// API for members to request notification when merchant has funds or budget available

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

/**
 * Calculate the start of the current budget cycle based on reset day
 */
function getBudgetCycleStart(resetDay: number): Date {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const safeResetDay = Math.min(Math.max(resetDay, 1), 28);

  if (currentDay >= safeResetDay) {
    return new Date(currentYear, currentMonth, safeResetDay, 0, 0, 0, 0);
  } else {
    return new Date(currentYear, currentMonth - 1, safeResetDay, 0, 0, 0, 0);
  }
}

/**
 * Calculate when to send notification (3 days after next budget reset)
 */
function getNotifyAfterDate(resetDay: number): Date {
  const cycleStart = getBudgetCycleStart(resetDay);
  const nextCycleStart = new Date(cycleStart);
  nextCycleStart.setMonth(nextCycleStart.getMonth() + 1);
  const notifyAfter = new Date(nextCycleStart);
  notifyAfter.setDate(notifyAfter.getDate() + 3);
  return notifyAfter;
}

// POST - Create notification request
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_member_session");

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

    const memberId = sessionData.memberId;
    if (!memberId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { merchantId, notificationType = "low_balance" } = await req.json();

    if (!merchantId) {
      return NextResponse.json(
        { error: "Merchant ID is required" },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!["low_balance", "budget_exhausted"].includes(notificationType)) {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      );
    }

    // Get member info
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { email: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, name: true, payoutAmountUSD: true, payoutBudgetResetDay: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Get member's current points with this merchant
    const merchantMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_memberId: { merchantId, memberId },
      },
      select: { points: true },
    });

    if (!merchantMember) {
      return NextResponse.json(
        { error: "Not a member of this merchant" },
        { status: 404 }
      );
    }

    // Calculate budget-specific fields
    let budgetCycleStart: Date | null = null;
    let notifyAfter: Date | null = null;

    if (notificationType === "budget_exhausted" && merchant.payoutBudgetResetDay) {
      budgetCycleStart = getBudgetCycleStart(merchant.payoutBudgetResetDay);
      notifyAfter = getNotifyAfterDate(merchant.payoutBudgetResetDay);
    }

    // Check for existing request of this type
    const existingRequest = await prisma.payoutNotificationRequest.findFirst({
      where: {
        merchantId,
        memberId,
        notificationType,
      },
    });

    let notificationRequest;
    if (existingRequest) {
      // Update existing request
      notificationRequest = await prisma.payoutNotificationRequest.update({
        where: { id: existingRequest.id },
        data: {
          memberEmail: member.email,
          pointsEarned: merchantMember.points,
          payoutAmount: merchant.payoutAmountUSD,
          budgetCycleStart,
          notifyAfter,
          notified: false,
          notifiedAt: null,
        },
      });
    } else {
      // Create new request
      notificationRequest = await prisma.payoutNotificationRequest.create({
        data: {
          merchantId,
          memberId,
          memberEmail: member.email,
          pointsEarned: merchantMember.points,
          payoutAmount: merchant.payoutAmountUSD,
          notificationType,
          budgetCycleStart,
          notifyAfter,
          notified: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "You'll be notified when your payout is ready to claim!",
      notificationRequest: {
        id: notificationRequest.id,
        merchantName: merchant.name,
        pointsEarned: notificationRequest.pointsEarned,
        payoutAmount: notificationRequest.payoutAmount,
      },
    });
  } catch (error: any) {
    console.error("[Payout Notify] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create notification request" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel notification request
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("gob_member_session");

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

    const memberId = sessionData.memberId;
    if (!memberId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get("merchantId");
    const notificationType = searchParams.get("notificationType");

    if (!merchantId) {
      return NextResponse.json(
        { error: "Merchant ID is required" },
        { status: 400 }
      );
    }

    // Delete specific type or all if no type specified
    await prisma.payoutNotificationRequest.deleteMany({
      where: {
        merchantId,
        memberId,
        ...(notificationType ? { notificationType } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification request cancelled",
    });
  } catch (error: any) {
    console.error("[Payout Notify Delete] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel notification request" },
      { status: 500 }
    );
  }
}
