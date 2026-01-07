// src/app/api/member/payout-notify/route.ts
// API for members to request notification when merchant has funds available

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

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

    const { merchantId } = await req.json();

    if (!merchantId) {
      return NextResponse.json(
        { error: "Merchant ID is required" },
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
      select: { id: true, name: true, payoutAmountUSD: true },
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

    // Create or update notification request
    const notificationRequest = await prisma.payoutNotificationRequest.upsert({
      where: {
        merchantId_memberId: { merchantId, memberId },
      },
      create: {
        merchantId,
        memberId,
        memberEmail: member.email,
        pointsEarned: merchantMember.points,
        payoutAmount: merchant.payoutAmountUSD,
        notified: false,
      },
      update: {
        memberEmail: member.email,
        pointsEarned: merchantMember.points,
        payoutAmount: merchant.payoutAmountUSD,
        notified: false,
        notifiedAt: null,
      },
    });

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

    if (!merchantId) {
      return NextResponse.json(
        { error: "Merchant ID is required" },
        { status: 400 }
      );
    }

    await prisma.payoutNotificationRequest.deleteMany({
      where: {
        merchantId,
        memberId,
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
