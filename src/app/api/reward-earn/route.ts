// src/app/api/rewards/earn/route.ts (adjust the path if needed)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// Reuse same helper as in other routes
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const merchantSlug = body.merchantSlug as string | undefined;
    const memberId = body.memberId as string | undefined;
    const reason =
      (body.reason as string | undefined) ||
      (body.source as string | undefined) ||
      "visit";

    if (!merchantSlug || !memberId) {
      return NextResponse.json(
        { error: "Missing merchantSlug or memberId" },
        { status: 400 },
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    // Load all events for this (merchant, member) pair
    const events = await prisma.event.findMany({
      where: {
        merchantId: merchant.id,
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

    const pointsToAdd = merchant.earnPerVisit ?? 10;
    const newPoints = currentPoints + pointsToAdd;

    // Record this earn as an event
    await prisma.event.create({
      data: {
        merchantId: merchant.id,
        memberId: member.id,
        type: "REWARD_EARNED",
        source: reason,
        metadata: {
          amount: pointsToAdd,
        },
      },
    });

    return NextResponse.json(
      {
        memberId: member.id,
        points: newPoints,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("[reward-earn] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
