import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { merchantSlug, address } = await req.json();

    if (!merchantSlug || !address) {
      return NextResponse.json(
        { error: "Missing merchantSlug or address" },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const normalizedAddress = String(address).toLowerCase().trim();

    let member = await prisma.member.findFirst({
      where: {
        merchantId: merchant.id,
        walletAddress: normalizedAddress,
      },
    });

    const welcomePoints = merchant.welcomePoints ?? 10;
    let isNew = false;

    if (!member) {
      isNew = true;

      member = await prisma.member.create({
        data: {
          merchantId: merchant.id,
          walletAddress: normalizedAddress,
          points: welcomePoints,
        },
      });

      await prisma.event.create({
        data: {
          merchantId: merchant.id,
          memberId: member.id,
          type: "REWARD_EARNED",
          source: "wallet",
          metadata: {
            reason: "wallet_welcome",
            amount: welcomePoints,
          },
        },
      });
    }

    return NextResponse.json(
      {
        memberId: member.id,
        isNew,
        points: member.points,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[connect-wallet] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
