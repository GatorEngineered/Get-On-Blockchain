// src/app/api/create-email-member/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type CreateEmailMemberBody = {
  merchantSlug?: string;
  merchant?: string;
  email?: string;
};

// Helper: safely extract `points` from event.metadata
function getPointsFromMetadata(metadata: unknown): number | undefined {
  if (metadata && typeof metadata === "object" && "points" in metadata) {
    const maybePoints = (metadata as { points?: unknown }).points;
    if (typeof maybePoints === "number") {
      return maybePoints;
    }
  }

  // older events might use `amount` instead of `points`
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
    const body = (await req.json()) as CreateEmailMemberBody;

    // Accept BOTH `merchantSlug` and `merchant` from the client
    const merchantSlug = body.merchantSlug || body.merchant;

    const rawEmail = body.email;
    const email = rawEmail?.trim().toLowerCase();

    if (!merchantSlug || !email) {
      return NextResponse.json(
        { error: "Missing merchant or email" },
        { status: 400 }
      );
    }

    // 1) Look up merchant and grab welcomePoints
    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
      select: {
        id: true,
        welcomePoints: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // 2) Look up or create global member by email (no merchantId on Member)
    let member = await prisma.member.findUnique({
      where: { email },
    });

    const startingWelcomePoints = merchant.welcomePoints ?? 0;

    if (!member) {
      // New global member — MemberCreateInput requires firstName & lastName
      // You can later map these from body if you collect them
      member = await prisma.member.create({
        data: {
          email,
          firstName: "",
          lastName: "",
        },
      });
    }

    // 3) Load all events for this (merchant, member) pair
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

    // If this member already has any event with this merchant,
    // treat them as an existing member for this business and
    // do not double-grant welcome points.
    if (events.length > 0) {
      return NextResponse.json(
        {
          memberId: member.id,
          isNew: false,
          points: currentPoints,
        },
        { status: 200 }
      );
    }

    // 4) First-time for this merchant → grant welcome points via event
    if (startingWelcomePoints > 0) {
      await prisma.event.create({
        data: {
          merchantId: merchant.id,
          memberId: member.id,
          type: "REWARD_EARNED",
          source: "email",
          metadata: {
            reason: "welcome",
            amount: startingWelcomePoints,
          },
        },
      });
    }

    const finalPoints = currentPoints + startingWelcomePoints;

    return NextResponse.json(
      {
        memberId: member.id,
        isNew: true,
        points: finalPoints,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("create-email-member error:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
