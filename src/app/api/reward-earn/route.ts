import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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

    if (!member || member.merchantId !== merchant.id) {
      return NextResponse.json(
        { error: "Member not found for this merchant" },
        { status: 404 },
      );
    }

    const pointsToAdd = merchant.earnPerVisit ?? 10;

    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        points: member.points + pointsToAdd,
      },
    });

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
        memberId: updatedMember.id,
        points: updatedMember.points,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[reward-earn] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
