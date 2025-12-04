// src/app/api/reward-redeem/route.ts

import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

type RewardRedeemBody = {
  merchant?: string;          // merchant slug
  memberId?: string;
  points?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
};

// Helper: safely extract points from event.metadata
function getPointsFromMetadata(metadata: unknown): number | undefined {
  if (metadata && typeof metadata === "object" && "points" in metadata) {
    const maybePoints = (metadata as { points?: unknown }).points;
    if (typeof maybePoints === "number") {
      return maybePoints;
    }
  }

  if (metadata && typeof metadata === "object" && "amount" in metadata) {
    const maybeAmount = (metadata as { amount?: unknown }).amount;
    if (typeof maybeAmount === "number") {
      return maybeAmount;
    }
  }

  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RewardRedeemBody;

    const merchantSlug = body.merchant;
    const memberId = body.memberId;
    const pointsToRedeem = body.points ?? 10;
    const reason = body.reason ?? "Reward redemption";
    const extraMetadata = body.metadata ?? {};

    if (!merchantSlug || !memberId) {
      return NextResponse.json(
        { error: "Missing merchant or memberId" },
        { status: 400 }
      );
    }

    const merchantRecord = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchantRecord) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Load all events for this (merchant, member) pair
    const events = await prisma.event.findMany({
      where: {
        merchantId: merchantRecord.id,
        memberId: member.id,
      },
      orderBy: { createdAt: "asc" },
    });

    // Compute current points from events
    let currentPoints = 0;
    for (const ev of events) {
      const pts = getPointsFromMetadata(ev.metadata);
      if (typeof pts !== "number") continue;

      if (ev.type === "REWARD_REDEEMED") {
        currentPoints -= pts;
      } else {
        currentPoints += pts;
      }
    }

    if (currentPoints < pointsToRedeem) {
      return NextResponse.json(
        { error: "Not enough points" },
        { status: 400 }
      );
    }

    const newPoints = currentPoints - pointsToRedeem;

    // Record redemption as an event
    await prisma.event.create({
      data: {
        merchantId: merchantRecord.id,
        memberId: member.id,
        type: "REWARD_REDEEMED",
        source: "system",
        metadata: {
          amount: pointsToRedeem,
          reason,
          ...extraMetadata,
        },
      },
    });

    // Return a minimal "member" object with updated points
    return NextResponse.json(
      {
        ok: true,
        member: {
          id: member.id,
          points: newPoints,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reward redeem error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
