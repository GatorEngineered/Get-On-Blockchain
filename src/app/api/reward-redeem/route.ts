// src/app/api/reward-redeem/route.ts

import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      merchant,
      memberId,
      points = 10, // how many points to spend
      reason = "Reward redemption",
      metadata = {},
    } = body;

    if (!merchant || !memberId) {
      return NextResponse.json(
        { error: "Missing merchant or memberId" },
        { status: 400 }
      );
    }

    const merchantRecord = await prisma.merchant.findUnique({
      where: { slug: merchant },
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

    if (!member || member.merchantId !== merchantRecord.id) {
      return NextResponse.json(
        { error: "Member not found for this merchant" },
        { status: 404 }
      );
    }

    if (member.points < points) {
      return NextResponse.json(
        { error: "Not enough points" },
        { status: 400 }
      );
    }

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: {
        points: member.points - points,
      },
    });

    await prisma.event.create({
      data: {
        merchantId: merchantRecord.id,
        memberId: updated.id,
        type: "REWARD_REDEEMED",
        source: "system",
        metadata: {
          points,
          reason,
          ...metadata,
        },
      },
    });

    return NextResponse.json({ ok: true, member: updated });
  } catch (error) {
    console.error("Reward redeem error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
